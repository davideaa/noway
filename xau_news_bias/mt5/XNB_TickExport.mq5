//+------------------------------------------------------------------+
//| XNB_TickExport.mq5 — esporta i tick del broker attorno alle release |
//|                                                                    |
//| Serve a misurare se il feed del tuo broker (XAUUSD.p / XAUUSD.s)   |
//| dà la stessa direzione della prima M1 del feed Dukascopy usato     |
//| nella ricerca. Non apre operazioni.                                |
//|                                                                    |
//| Uso:                                                               |
//| 1. copia research_output/cpi_events_utc.csv in                     |
//|    <cartella dati MT5>/MQL5/Files/xnb_events.csv                   |
//| 2. trascina lo script sul grafico del simbolo oro                  |
//| 3. il risultato è MQL5/Files/xnb_ticks_<simbolo>.csv: rimandalo    |
//|    e lancia  python scripts/compare_broker_feed.py <file>          |
//|                                                                    |
//| Orario: MT5 registra i tick nell'ora del SERVER del broker, non in |
//| UTC. PUPrime usa GMT+2 d'inverno e GMT+3 d'estate, cambiando con   |
//| l'ora legale USA: sono i due parametri qui sotto.                  |
//+------------------------------------------------------------------+
#property script_show_inputs
#property strict

input int    WinterGMTOffsetHours = 2;   // offset del server quando NY è in ora solare
input int    SummerGMTOffsetHours = 3;   // offset del server quando NY è in ora legale
input int    SecondsBefore        = 300; // tick da esportare prima di T0
input int    SecondsAfter         = 300; // e dopo

// ora legale USA: dalla seconda domenica di marzo alla prima domenica di novembre
bool UsDst(datetime utc)
{
   MqlDateTime t; TimeToStruct(utc, t);
   if(t.mon < 3 || t.mon > 11) return false;
   if(t.mon > 3 && t.mon < 11) return true;
   MqlDateTime f = t; f.day = 1; f.hour = 0; f.min = 0; f.sec = 0;
   datetime first = StructToTime(f);
   MqlDateTime fw; TimeToStruct(first, fw);
   int firstSunday = 1 + (7 - fw.day_of_week) % 7;
   if(t.mon == 3)  return t.day > firstSunday + 7 || (t.day == firstSunday + 7 && t.hour >= 7);
   return t.day < firstSunday || (t.day == firstSunday && t.hour < 6);
}

void OnStart()
{
   int in = FileOpen("xnb_events.csv", FILE_READ | FILE_CSV | FILE_ANSI, ',');
   if(in == INVALID_HANDLE) { Print("Manca MQL5/Files/xnb_events.csv"); return; }
   string outName = "xnb_ticks_" + _Symbol + ".csv";
   int out = FileOpen(outName, FILE_WRITE | FILE_CSV | FILE_ANSI, ',');
   FileWrite(out, "event_id", "t0_utc", "tick_utc_ms", "bid", "ask", "server_offset_h");
   FileReadString(in); FileReadString(in);  // intestazione: event_id,t0_utc
   int events = 0, rows = 0;
   while(!FileIsEnding(in))
   {
      string eid = FileReadString(in);
      string t0s = FileReadString(in);
      if(eid == "") continue;
      datetime t0 = StringToTime(t0s);            // "YYYY.MM.DD HH:MM" in UTC
      int off = UsDst(t0) ? SummerGMTOffsetHours : WinterGMTOffsetHours;
      long fromMs = ((long)(t0 + off * 3600) - SecondsBefore) * 1000;
      long toMs   = ((long)(t0 + off * 3600) + SecondsAfter) * 1000;
      MqlTick ticks[];
      int n = CopyTicksRange(_Symbol, ticks, COPY_TICKS_INFO, fromMs, toMs);
      for(int i = 0; i < n; i++)
      {
         long utcMs = (long)ticks[i].time_msc - (long)off * 3600000;
         FileWrite(out, eid, t0s, IntegerToString(utcMs), DoubleToString(ticks[i].bid, _Digits),
                   DoubleToString(ticks[i].ask, _Digits), off);
         rows++;
      }
      events++;
   }
   FileClose(in); FileClose(out);
   PrintFormat("XNB: %d eventi, %d tick scritti in %s", events, rows, outName);
}
