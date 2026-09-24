//+------------------------------------------------------------------+
//|                                                EsportaBarre.mq5  |
//|                                                                  |
//|  Script: scrive in un file CSV le candele di un simbolo, per      |
//|  studiarle fuori da MetaTrader. Si trascina sul grafico, fa il    |
//|  file e finisce. Non apre operazioni.                             |
//|                                                                  |
//|  Il file va in  MQL5\Files\  (File -> Apri cartella dati).        |
//|  Di proposito si ferma al 2022-12-31: il 2023-2026 e' il fuori    |
//|  campione e non deve uscire da MetaTrader prima del test finale.  |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property script_show_inputs

input string          InpSimbolo = "USDJPY";       // Simbolo
input ENUM_TIMEFRAMES InpTF      = PERIOD_M5;      // Timeframe
input datetime        InpDal     = D'2019.01.01';  // Dal
input datetime        InpAl      = D'2022.12.31 23:59'; // Al (non oltre il 2022)

void OnStart()
  {
   datetime al = InpAl;
   if(al > D'2022.12.31 23:59') al = D'2022.12.31 23:59';

   MqlRates r[];
   ArraySetAsSeries(r, false);
   int n = CopyRates(InpSimbolo, InpTF, InpDal, al, r);
   if(n <= 0)
     {
      Alert("Nessuna candela: apri prima un grafico ", InpSimbolo, " e scorri indietro fino al 2019, poi riprova. Errore ", GetLastError());
      return;
     }

   string nome = InpSimbolo + "_" + StringSubstr(EnumToString(InpTF), 7) + "_" +
                 TimeToString(InpDal, TIME_DATE) + "_" + TimeToString(al, TIME_DATE) + ".csv";
   StringReplace(nome, ".", "");
   StringReplace(nome, "csv", ".csv");

   int h = FileOpen(nome, FILE_WRITE | FILE_CSV | FILE_ANSI, ',');
   if(h == INVALID_HANDLE) { Alert("Non riesco a scrivere il file, errore ", GetLastError()); return; }
   FileWrite(h, "time", "open", "high", "low", "close", "tick_volume", "spread");
   int dg = (int)SymbolInfoInteger(InpSimbolo, SYMBOL_DIGITS);
   for(int i = 0; i < n; i++)
      FileWrite(h, TimeToString(r[i].time, TIME_DATE | TIME_MINUTES),
                DoubleToString(r[i].open, dg), DoubleToString(r[i].high, dg),
                DoubleToString(r[i].low, dg), DoubleToString(r[i].close, dg),
                (long)r[i].tick_volume, r[i].spread);
   FileClose(h);

   Alert("Fatto: ", n, " candele dal ", TimeToString(r[0].time), " al ", TimeToString(r[n-1].time),
         ". File: MQL5\\Files\\", nome);
  }
//+------------------------------------------------------------------+
