//+------------------------------------------------------------------+
//|                                       V1XAU_TrendFollowing.mq5   |
//|                                                                  |
//|  V1XAU — TREND FOLLOWING SU ORO                                   |
//|                                                                  |
//|  Due gambe, stessa famiglia ma momenti diversi:                   |
//|                                                                  |
//|   ROTTURA (M30)        il prezzo sfonda il canale a 60 barre con  |
//|                        la volatilita' in espansione, ed entra     |
//|                        nella direzione dello sfondamento.         |
//|                        Nessun take profit: trailing largo.        |
//|                                                                  |
//|   RITRACCIAMENTO (H4)  dentro un trend gia' stabilito, aspetta    |
//|                        che il prezzo ritracci di almeno N ATR dal |
//|                        massimo recente e riparta. Entra dove la   |
//|                        ROTTURA viene stoppata.                    |
//|                                                                  |
//|  Le due NON possono entrare sulla stessa candela: la ROTTURA      |
//|  pretende un nuovo estremo, il RITRACCIAMENTO pretende che il     |
//|  prezzo non ci sia. Correlazione mensile misurata: 0,53.          |
//|                                                                  |
//|  ENTRAMBI I LATI. Misurato sui mesi in cui l'oro e' sceso, il     |
//|  sistema guadagna: +1,6 punti R al mese in discesa lenta e +2,2   |
//|  in discesa forte, con gli short a fare il lavoro. Il nemico non  |
//|  e' la direzione, e' il mercato fermo: nei mesi in cui l'oro non  |
//|  si muove (piu' o meno 0,5%) il sistema perde 1,5 R al mese.      |
//|                                                                  |
//|  RISULTATI (XAUUSD, 2019.01-2026.09, tick reali, rischio 1,05%)   |
//|    1.122 operazioni, profit factor 1,33, +0,171 R per operazione  |
//|    dentro campione 2019-2023  +91% a lotto fisso                  |
//|    fuori campione  2024-2026  +111% a lotto fisso                 |
//|    Monte Carlo: 90% degli scenari sotto il 35% di drawdown        |
//|                                                                  |
//|  I parametri sono stati scelti su 2019-2023 e verificati una sola |
//|  volta su 2024-2026. Non ottimizzarli di nuovo: non ci sono piu'  |
//|  dati vergini con cui controllare il risultato.                   |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//==================================================================
//  INPUT
//==================================================================
input group "=== Generale ==="
input long              InpMagicBase          = 997000;   // Magic base (RITRACC=+2, ROTTURA=+3)
input double            InpRiskPercent        = 0.70;     // Rischio per operazione (% equity) - vedi nota
input int               InpMaxPosPerStrategy  = 1;        // Posizioni max per strategia
// NOTA SUL RISCHIO (Monte Carlo a blocchi, 20.000 scenari sui trade veri):
//   0,70%  ->  90% degli scenari sotto il 26% di drawdown
//   1,05%  ->  90% degli scenari sotto il 35% di drawdown  <- il massimo
//   oltre  ->  il 99esimo percentile supera il 50%: non si torna piu' indietro
input double            InpMaxTotalRiskPct    = 0.0;      // Tetto al rischio aperto totale (%, 0 = off)

input group "=== Pesi per strategia (moltiplicatori del rischio base) ==="
input double            InpS2RiskMult         = 1.0;      // Peso del RITRACCIAMENTO
input double            InpS3RiskMult         = 1.0;      // Peso della ROTTURA
input int               InpSlippagePoints     = 30;       // Deviazione massima (points)
input int               InpMaxSpreadPoints    = 0;        // Spread max in points (0 = filtro off)

input group "=== Adaptive Risk (misurato peggiore: tenere spento) ==="
input bool              InpUseAdaptiveRisk    = false;    // Attiva Adaptive Risk
input ENUM_TIMEFRAMES   InpRiskTF             = PERIOD_H1;// TF per la misura di volatilita
input int               InpRiskAtrPeriod      = 14;       // Periodo ATR corrente
input int               InpRiskBaselinePeriod = 200;      // Finestra del "livello normale"
input double            InpRiskMultMin        = 0.5;      // Moltiplicatore minimo
input double            InpRiskMultMax        = 2.0;      // Moltiplicatore massimo

input group "=== Filtro orario (non usato: nessun filtro su ore o giorni) ==="
input bool              InpUseSessionFilter   = false;    // Attiva filtro orario (server time)
input int               InpSessionStartHour   = 0;        // Ora inizio (inclusa)
input int               InpSessionEndHour     = 24;       // Ora fine (esclusa)
input bool              InpCloseBeforeWeekend = false;    // Chiudi tutto il venerdi
input int               InpFridayCloseHour    = 21;       // Ora chiusura del venerdi

input group "=== RITRACCIAMENTO (H4) ==="
input bool              InpS2Enabled          = true;     // Attiva S2
input ENUM_TIMEFRAMES   InpS2TF               = PERIOD_H4;// Timeframe
input int               InpS2TrendEma         = 30;       // [T] Periodo EMA di trend (collina 30-40)
input int               InpS2EmaSlopeBars     = 3;        // Barre per la pendenza
input int               InpS2AtrPeriod        = 14;       // Periodo ATR
input int               InpS2SwingBars        = 20;       // Barre per il massimo/minimo recente
input double            InpS2PullbackATR      = 1.0;      // Ritracciamento minimo in ATR (ininfluente: 1.0)
input int               InpS2CooldownBars     = 3;        // Barre di attesa dopo un ingresso
input double            InpS2StopBufferATR    = 0.10;     // [T] Stop oltre il minimo in ATR (vedi nota)
input double            InpS2TrailStartR      = 1.0;      // Attiva trailing a +xR
input double            InpS2TrailATR         = 1.5;      // [T] Distanza trailing in ATR (collina 1.5)
input bool              InpS2AllowLong        = true;     // Consenti long
input bool              InpS2AllowShort       = true;     // Consenti short

input group "=== ROTTURA (M30) ==="
input bool              InpS3Enabled          = true;     // Attiva S3
input ENUM_TIMEFRAMES   InpS3TF               = PERIOD_M30;// Timeframe
input int               InpS3RangeBars        = 480;      // Range di contesto (barre)
input int               InpS3BreakBars        = 60;       // Canale di rottura (barre)
input double            InpS3EdgeThreshold    = 0.91;     // Posizione nel range per dirsi "al bordo"
input int               InpS3AtrFast          = 14;       // ATR veloce
input int               InpS3AtrSlow          = 50;       // ATR lento (riferimento)
input double            InpS3VolExpandRatio   = 0.70;     // ATRveloce/ATRlento MINIMO (espansione)
input double            InpS3StopATR          = 2.0;      // Stop loss in ATR (= 1R)
input double            InpS3TargetR          = 0.0;      // Take profit in R (0 = nessuno)
input double            InpS3TrailStartR      = 1.0;      // Attiva trailing a +xR
input double            InpS3TrailATR         = 4.0;      // Distanza trailing in ATR
input bool              InpS3AllowLong        = true;     // Consenti long
input bool              InpS3AllowShort       = true;     // Consenti short

input group "=== Pannello live (non tocca le operazioni) ==="
input bool              InpPannello           = true;     // Mostra il pannello sul grafico
input int               InpPannelloX          = 12;       // Distanza dal bordo sinistro (px)
input int               InpPannelloY          = 24;       // Distanza dal bordo alto (px)

//==================================================================
//  STATO
//==================================================================
CTrade   trade;

int      hS2Ema   = INVALID_HANDLE, hS2Atr  = INVALID_HANDLE;
int      hS3AtrF  = INVALID_HANDLE, hS3AtrS = INVALID_HANDLE;
int      hRiskAtr = INVALID_HANDLE;

datetime lastBarS2 = 0, lastBarS3 = 0;
datetime s2LastEntryBar = 0;   // cooldown di S2

// Il trailing ha bisogno della distanza di stop iniziale (1R) di ogni
// posizione: l'ATR al momento dell'apertura non e' recuperabile dopo.
// retryAfter frena i tentativi di modifica dopo un rifiuto del broker.
#define RISK_SLOTS 64
#define TRAIL_RETRY_SECONDS 60
struct TradeRisk { ulong ticket; double riskDistance; datetime retryAfter; };
TradeRisk g_risk[RISK_SLOTS];
int       g_riskIdx = 0;

//==================================================================
//  UTILITA
//==================================================================
double IndValue(const int handle, const int shift)
  {
   double buf[];
   ArraySetAsSeries(buf, true);
   if(handle == INVALID_HANDLE)          return(0.0);
   if(CopyBuffer(handle, 0, shift, 1, buf) < 1) return(0.0);
   return(buf[0]);
  }

bool IsNewBar(const ENUM_TIMEFRAMES tf, datetime &store)
  {
   datetime t = iTime(_Symbol, tf, 0);
   if(t == 0 || t == store) return(false);
   store = t;
   return(true);
  }

void RememberRisk(const ulong ticket, const double dist)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) { g_risk[i].riskDistance = dist; return; }
   g_risk[g_riskIdx].ticket       = ticket;
   g_risk[g_riskIdx].riskDistance = dist;
   g_risk[g_riskIdx].retryAfter   = 0;
   g_riskIdx = (g_riskIdx + 1) % RISK_SLOTS;
  }

//------------------------------------------------------------------
//  1R ricostruito dallo storico: |prezzo di apertura - stop iniziale|.
//
//  g_risk sta in memoria e OnInit la azzera, quindi dopo un riavvio del
//  terminale una posizione ancora aperta non ha piu' il suo 1R. Prima
//  si ripiegava sull'ATR corrente: per la ROTTURA era quasi esatto
//  (lo stop E' un multiplo dell'ATR), per il RITRACCIAMENTO no, perche'
//  li' 1R e' la profondita' del ritracciamento e non un multiplo fisso.
//  Il trailing partiva quindi prima o dopo del dovuto, in silenzio.
//
//  Lo stop originale e' pero' sull'ordine che ha aperto la posizione,
//  dove il trailing non arriva: da li' il valore e' esatto, non stimato.
//  Nel tester non viene mai chiamata (l'EA non si riavvia mai a meta').
//------------------------------------------------------------------
double RiskFromHistory(const ulong ticket)
  {
   if(!PositionSelectByTicket(ticket)) return(0.0);

   long   posId     = PositionGetInteger(POSITION_IDENTIFIER);
   double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   if(posId <= 0 || openPrice <= 0.0)  return(0.0);

   if(!HistorySelectByPosition(posId)) return(0.0);

   // il primo ordine eseguito della posizione e' quello di apertura:
   // modificare SL/TP non lascia ordini nello storico, quindi non lo
   // sovrascrive nessuno
   for(int i = 0; i < HistoryOrdersTotal(); i++)
     {
      ulong ord = HistoryOrderGetTicket(i);
      if(ord == 0) continue;
      if(HistoryOrderGetInteger(ord, ORDER_POSITION_ID) != posId)      continue;
      if(HistoryOrderGetInteger(ord, ORDER_STATE) != ORDER_STATE_FILLED) continue;

      double sl = HistoryOrderGetDouble(ord, ORDER_SL);
      if(sl <= 0.0) continue;

      double dist = MathAbs(openPrice - sl);
      if(dist > 0.0) return(dist);
     }
   return(0.0);
  }

double RecallRisk(const ulong ticket, const double fallback)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) return(g_risk[i].riskDistance);

   // non in tabella: siamo ripartiti con la posizione gia' aperta
   double fromHist = RiskFromHistory(ticket);
   if(fromHist > 0.0)
     {
      RememberRisk(ticket, fromHist);   // una volta sola, poi e' in tabella
      return(fromHist);
     }

   return(fallback);   // ultima spiaggia: stima con l'ATR corrente
  }

//------------------------------------------------------------------
//  Freno sui rifiuti del broker alla modifica dello stop: senza, una
//  modifica rifiutata verrebbe ritentata a ogni tick e il diario si
//  riempirebbe dello stesso errore. Nel tester non scatta: la distanza
//  minima e' gia' rispettata da EnforceStopsLevel e lo stop non viene
//  mai riproposto identico, quindi non ci sono rifiuti da frenare.
//------------------------------------------------------------------
bool TrailBlocked(const ulong ticket)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket)
         return(g_risk[i].retryAfter > 0 && TimeCurrent() < g_risk[i].retryAfter);
   return(false);
  }

void TrailNote(const ulong ticket, const bool ok)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket)
        {
         if(ok) g_risk[i].retryAfter = 0;
         else   g_risk[i].retryAfter = TimeCurrent() + TRAIL_RETRY_SECONDS;
         return;
        }
  }

int CountPositions(const long magic)
  {
   int c = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      c++;
     }
   return(c);
  }

bool CloseAllForMagic(const long magic)
  {
   // Indispensabile: l'ordine di chiusura eredita il magic impostato su CTrade,
   // non quello della posizione. Senza questa riga le uscite di una strategia
   // finiscono attribuite all'ultima che ha usato l'oggetto trade.
   trade.SetExpertMagicNumber(magic);

   bool ok = true;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      if(!trade.PositionClose(tk)) ok = false;
     }
   return(ok);
  }

// direzione corrente della strategia: +1 long, -1 short, 0 flat
int CurrentDirection(const long magic)
  {
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      return(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY ? 1 : -1);
     }
   return(0);
  }

//------------------------------------------------------------------
//  Rischio complessivo delle posizioni aperte, in % di equity.
//  Serve a impedire che le tre strategie si accumulino sullo stesso
//  movimento: sono correlate, quindi tre posizioni insieme non sono
//  tre scommesse indipendenti ma una sola, tripla.
//------------------------------------------------------------------
double CurrentOpenRiskPercent()
  {
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   if(equity <= 0.0) return(0.0);

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0.0 || tickSize <= 0.0) return(0.0);

   double risk = 0.0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;

      long magic = PositionGetInteger(POSITION_MAGIC);
      if(magic < InpMagicBase + 2 || magic > InpMagicBase + 3) continue;

      double sl = PositionGetDouble(POSITION_SL);
      if(sl <= 0.0) continue;                     // senza stop non e' quantificabile

      double dist = MathAbs(PositionGetDouble(POSITION_PRICE_CURRENT) - sl);
      double lots = PositionGetDouble(POSITION_VOLUME);
      risk += (dist / tickSize) * tickValue * lots;
     }
   return(100.0 * risk / equity);
  }

//------------------------------------------------------------------
//  Adaptive Risk: rischio% effettivo per il trade corrente
//------------------------------------------------------------------
double EffectiveRiskPercent()
  {
   if(!InpUseAdaptiveRisk) return(InpRiskPercent);

   double atrNow = IndValue(hRiskAtr, 1);
   if(atrNow <= 0.0) return(InpRiskPercent);

   // "livello normale" = media dell'ATR sulla finestra lunga
   double buf[];
   ArraySetAsSeries(buf, true);
   if(CopyBuffer(hRiskAtr, 0, 1, InpRiskBaselinePeriod, buf) < InpRiskBaselinePeriod)
      return(InpRiskPercent);

   double sum = 0.0;
   for(int i = 0; i < InpRiskBaselinePeriod; i++) sum += buf[i];
   double baseline = sum / InpRiskBaselinePeriod;
   if(baseline <= 0.0) return(InpRiskPercent);

   double mult = atrNow / baseline;
   if(mult < InpRiskMultMin) mult = InpRiskMultMin;
   if(mult > InpRiskMultMax) mult = InpRiskMultMax;

   return(InpRiskPercent * mult);
  }

//------------------------------------------------------------------
//  Calcolo lotti dal rischio e dalla distanza di stop
//------------------------------------------------------------------
double LotsFromRisk(const double stopDistance, const double riskMult)
  {
   if(stopDistance <= 0.0 || riskMult <= 0.0) return(0.0);

   double equity    = AccountInfoDouble(ACCOUNT_EQUITY);
   double riskMoney = equity * EffectiveRiskPercent() * riskMult / 100.0;

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0.0 || tickSize <= 0.0) return(0.0);

   double lossPerLot = (stopDistance / tickSize) * tickValue;
   if(lossPerLot <= 0.0) return(0.0);

   double lots = riskMoney / lossPerLot;

   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(stepLot <= 0.0) stepLot = 0.01;

   lots = MathFloor(lots / stepLot) * stepLot;
   if(lots < minLot) return(0.0);          // rischio troppo piccolo: niente trade
   if(lots > maxLot) lots = maxLot;

   return(NormalizeDouble(lots, 2));
  }

//------------------------------------------------------------------
//  Rispetto della distanza minima imposta dal broker
//------------------------------------------------------------------
double EnforceStopsLevel(const double price, const double sl, const bool isLong)
  {
   long   stopsLvl = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist  = stopsLvl * _Point;
   if(minDist <= 0.0) return(sl);

   if(isLong  && (price - sl) < minDist) return(price - minDist);
   if(!isLong && (sl - price) < minDist) return(price + minDist);
   return(sl);
  }

//------------------------------------------------------------------
//  Filtri generali (orario, spread)
//------------------------------------------------------------------
bool TradingAllowed()
  {
   if(InpMaxSpreadPoints > 0)
     {
      long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
      if(spread > InpMaxSpreadPoints) return(false);
     }

   if(InpUseSessionFilter)
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      if(dt.hour <  InpSessionStartHour) return(false);
      if(dt.hour >= InpSessionEndHour)   return(false);
     }
   return(true);
  }

void WeekendGuard()
  {
   if(!InpCloseBeforeWeekend) return;
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   if(dt.day_of_week == 5 && dt.hour >= InpFridayCloseHour)
     {
      // niente base+1: era la terza gamba della versione a tre
      CloseAllForMagic(InpMagicBase + 2);
      CloseAllForMagic(InpMagicBase + 3);
     }
  }

//------------------------------------------------------------------
//  Apertura posizione
//------------------------------------------------------------------
bool OpenTrade(const long magic, const bool isLong, const double stopAtrDist,
               const double targetR, const string tag, const double riskMult)
  {
   if(stopAtrDist <= 0.0 || riskMult <= 0.0) return(false);

   if(InpMaxTotalRiskPct > 0.0 && CurrentOpenRiskPercent() >= InpMaxTotalRiskPct)
      return(false);

   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl = isLong ? price - stopAtrDist : price + stopAtrDist;
   sl = EnforceStopsLevel(price, sl, isLong);

   double realRisk = MathAbs(price - sl);
   double tp = 0.0;
   if(targetR > 0.0)
      tp = isLong ? price + targetR * realRisk : price - targetR * realRisk;

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);
   if(tp > 0.0) tp = NormalizeDouble(tp, digits);

   double lots = LotsFromRisk(realRisk, riskMult);
   if(lots <= 0.0) return(false);

   trade.SetExpertMagicNumber(magic);
   trade.SetDeviationInPoints(InpSlippagePoints);

   bool ok = isLong ? trade.Buy(lots, _Symbol, 0.0, sl, tp, tag)
                    : trade.Sell(lots, _Symbol, 0.0, sl, tp, tag);

   if(ok)
     {
      // su conto hedging il ticket della posizione coincide con quello
      // dell'ordine di mercato che l'ha aperta
      ulong posTicket = trade.ResultOrder();
      if(posTicket > 0) RememberRisk(posTicket, realRisk);
     }
   return(ok);
  }

//------------------------------------------------------------------
//  Trailing stop (attivato dopo +xR, distanza in ATR dal prezzo)
//------------------------------------------------------------------
void ManageTrailing(const long magic, const double startR, const double trailAtr,
                    const int atrHandle, const double stopAtrMult)
  {
   if(startR <= 0.0 || trailAtr <= 0.0) return;

   double atr = IndValue(atrHandle, 0);
   if(atr <= 0.0) return;

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      if(TrailBlocked(tk)) continue;      // rifiutata da poco: non insistere

      bool   isLong = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY);
      double entry  = PositionGetDouble(POSITION_PRICE_OPEN);
      double curSL  = PositionGetDouble(POSITION_SL);
      double curTP  = PositionGetDouble(POSITION_TP);
      double price  = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                             : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      double oneR   = RecallRisk(tk, atr * stopAtrMult);
      if(oneR <= 0.0) continue;

      double profitR = (isLong ? (price - entry) : (entry - price)) / oneR;
      if(profitR < startR) continue;

      double newSL = isLong ? price - trailAtr * atr : price + trailAtr * atr;
      newSL = EnforceStopsLevel(price, newSL, isLong);
      newSL = NormalizeDouble(newSL, digits);

      // muove lo stop solo in direzione favorevole
      if(isLong  && (curSL > 0.0 && newSL <= curSL)) continue;
      if(!isLong && (curSL > 0.0 && newSL >= curSL)) continue;

      trade.SetExpertMagicNumber(magic);
      if(trade.PositionModify(tk, newSL, curTP))
         TrailNote(tk, true);
      else
        {
         TrailNote(tk, false);
         PrintFormat("trailing rifiutato su #%I64u (retcode %d): riprovo fra %d s",
                     tk, (int)trade.ResultRetcode(), TRAIL_RETRY_SECONDS);
        }
     }
  }

//==================================================================
//  RITRACCIAMENTO — ingresso sul ritracciamento nel trend (H4)
//
//  Il range mean reversion e' stato bocciato: 174 configurazioni con
//  almeno 100 trade, zero in utile. L'errore era cercare una gamba
//  "laterale" perche' e' la terza casella di uno schema teorico.
//  Qui si diversifica per DURATA, non per tipo di mercato.
//
//  L'oro tende, ma sporco: parte, ritraccia, riparte. S3 viene
//  stoppata dal ritracciamento e perde il seguito del movimento;
//  questa entra proprio li' e resta dentro.
//
//  DECORRELAZIONE DA S3, meccanica: S3 entra quando il prezzo fa un
//  nuovo estremo a 60 barre M30. Qui serve che il prezzo NON sia
//  sull'estremo - un ritracciamento di almeno N ATR dal massimo
//  recente - quindi non possono comprare sulla stessa candela.
//
//  Nessun take profit: il target fisso amputa la coda destra.
//==================================================================
void RunS2()
  {
   long magic = InpMagicBase + 2;
   if(CountPositions(magic) >= InpMaxPosPerStrategy) return;

   // attesa dopo un ingresso: senza, dopo uno stop si rientrerebbe
   // sulla barra successiva dello stesso ritracciamento
   if(InpS2CooldownBars > 0 && s2LastEntryBar > 0)
     {
      long elapsed = (long)(iTime(_Symbol, InpS2TF, 0) - s2LastEntryBar);
      if(elapsed < (long)InpS2CooldownBars * PeriodSeconds(InpS2TF)) return;
     }

   double atr  = IndValue(hS2Atr, 1);
   double ema1 = IndValue(hS2Ema, 1);
   double emaN = IndValue(hS2Ema, 1 + InpS2EmaSlopeBars);
   if(atr <= 0.0 || ema1 <= 0.0 || emaN <= 0.0) return;

   double slope = (ema1 - emaN) / InpS2EmaSlopeBars;

   double c1 = iClose(_Symbol, InpS2TF, 1);
   double h2 = iHigh (_Symbol, InpS2TF, 2);
   double l2 = iLow  (_Symbol, InpS2TF, 2);
   // h2 e l2 vengono dalla stessa barra: o sono validi tutti e due o
   // nessuno dei due, quindi il controllo non puo' scartare una barra
   // che prima passava
   if(c1 <= 0.0 || h2 <= 0.0 || l2 <= 0.0) return;

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   // ---------------- LONG ----------------
   if(InpS2AllowLong && c1 > ema1 && slope > 0.0 && ask > 0.0)
     {
      // idxH >= 2: il massimo deve essere alle spalle. Se fosse la barra
      // appena chiusa non ci sarebbe nessun ritracciamento da comprare,
      // solo una candela grande - ed e' il terreno di S3.
      int idxH = iHighest(_Symbol, InpS2TF, MODE_HIGH, InpS2SwingBars, 1);
      if(idxH >= 2)
        {
         double swingHigh = iHigh(_Symbol, InpS2TF, idxH);
         int idxL = iLowest(_Symbol, InpS2TF, MODE_LOW, idxH, 1);
         if(idxL >= 1)
           {
            double pullLow = iLow(_Symbol, InpS2TF, idxL);
            bool deepEnough = ((swingHigh - pullLow) >= InpS2PullbackATR * atr);
            bool notAtHigh  = (c1 < swingHigh);
            bool resuming   = (c1 > h2);

            if(deepEnough && notAtHigh && resuming)
              {
               double stopPrice = pullLow - InpS2StopBufferATR * atr;
               double dist      = ask - stopPrice;
               if(dist > 0.0 &&
                  OpenTrade(magic, true, dist, 0.0, "S2-PULLB", InpS2RiskMult))
                 { s2LastEntryBar = iTime(_Symbol, InpS2TF, 0); return; }
              }
           }
        }
     }

   // ---------------- SHORT ----------------
   if(InpS2AllowShort && c1 < ema1 && slope < 0.0 && bid > 0.0)
     {
      int idxL = iLowest(_Symbol, InpS2TF, MODE_LOW, InpS2SwingBars, 1);
      if(idxL >= 2)
        {
         double swingLow = iLow(_Symbol, InpS2TF, idxL);
         int idxH = iHighest(_Symbol, InpS2TF, MODE_HIGH, idxL, 1);
         if(idxH >= 1)
           {
            double pullHigh = iHigh(_Symbol, InpS2TF, idxH);
            bool deepEnough = ((pullHigh - swingLow) >= InpS2PullbackATR * atr);
            bool notAtLow   = (c1 > swingLow);
            bool resuming   = (c1 < l2);

            if(deepEnough && notAtLow && resuming)
              {
               double stopPrice = pullHigh + InpS2StopBufferATR * atr;
               double dist      = stopPrice - bid;
               if(dist > 0.0 &&
                  OpenTrade(magic, false, dist, 0.0, "S2-PULLB", InpS2RiskMult))
                  s2LastEntryBar = iTime(_Symbol, InpS2TF, 0);
              }
           }
        }
     }
  }

//==================================================================
//  ROTTURA — Donchian breakout + espansione di volatilita (M30)
//
//  Invariata rispetto a GoldMomentum3: e' l'unica delle tre gambe
//  originali che ha retto la misura (PF 1,50 su 545 trade).
//  Al bordo del range a 480 barre, rompe il canale a 60 barre con la
//  volatilita' in espansione. Nessun take profit: il 2,5R dichiarato
//  nella card amputava la coda destra. Trailing largo.
//==================================================================
void RunS3()
  {
   long magic = InpMagicBase + 3;
   if(CountPositions(magic) >= InpMaxPosPerStrategy) return;

   double atrF = IndValue(hS3AtrF, 1);
   double atrS = IndValue(hS3AtrS, 1);
   if(atrF <= 0.0 || atrS <= 0.0) return;

   if((atrF / atrS) < InpS3VolExpandRatio) return;          // serve espansione

   double close1 = iClose(_Symbol, InpS3TF, 1);
   if(close1 <= 0.0) return;

   int idxRH = iHighest(_Symbol, InpS3TF, MODE_HIGH, InpS3RangeBars, 2);
   int idxRL = iLowest (_Symbol, InpS3TF, MODE_LOW,  InpS3RangeBars, 2);
   int idxBH = iHighest(_Symbol, InpS3TF, MODE_HIGH, InpS3BreakBars, 2);
   int idxBL = iLowest (_Symbol, InpS3TF, MODE_LOW,  InpS3BreakBars, 2);
   if(idxRH < 0 || idxRL < 0 || idxBH < 0 || idxBL < 0) return;

   double rangeHi = iHigh(_Symbol, InpS3TF, idxRH);
   double rangeLo = iLow (_Symbol, InpS3TF, idxRL);
   double breakHi = iHigh(_Symbol, InpS3TF, idxBH);
   double breakLo = iLow (_Symbol, InpS3TF, idxBL);
   if(rangeHi <= rangeLo) return;

   double pos = (close1 - rangeLo) / (rangeHi - rangeLo);    // 0..1 nel range lungo

   bool longSignal  = InpS3AllowLong &&
                      (pos >= InpS3EdgeThreshold) && (close1 > breakHi);
   bool shortSignal = InpS3AllowShort &&
                      (pos <= (1.0 - InpS3EdgeThreshold)) && (close1 < breakLo);

   if(longSignal)       OpenTrade(magic, true,  InpS3StopATR * atrF, InpS3TargetR, "S3-DONCH", InpS3RiskMult);
   else if(shortSignal) OpenTrade(magic, false, InpS3StopATR * atrF, InpS3TargetR, "S3-DONCH", InpS3RiskMult);
  }

//==================================================================
//  RIEPILOGO PER STRATEGIA (via DEAL_MAGIC, non via commento)
//==================================================================
void PrintStrategySummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;

   string names[2] = {"RITRACC ", "ROTTURA "};
   int    n[2]     = {0, 0};
   int    w[2]     = {0, 0};
   double gw[2]    = {0.0, 0.0};
   double gl[2]    = {0.0, 0.0};

   // Commissione e swap dell'APERTURA stanno su un'operazione separata
   // da quella di chiusura. Contando solo la chiusura andavano persi, e
   // il diario risultava piu' generoso del conto vero: su .p la
   // commissione e' 7,03 $ per lotto a giro completo, e se il broker la
   // divide fra ingresso e uscita ne mancava meta'. tools/estrai.py li
   // ha sempre sommati (`costo_in`), quindi i due non coincidevano.
   // Stesso genere dell'errore n.2: contabilita', non profitto.
   int    total = HistoryDealsTotal();
   long   inPos[];
   double inCost[];
   ArrayResize(inPos,  total);
   ArrayResize(inCost, total);
   int    nIn = 0;

   for(int i = 0; i < total; i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_IN) continue;

      inPos[nIn]  = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      inCost[nIn] = HistoryDealGetDouble(tk, DEAL_COMMISSION)
                  + HistoryDealGetDouble(tk, DEAL_SWAP);
      nIn++;
     }

   for(int i = 0; i < total; i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;

      long magic = HistoryDealGetInteger(tk, DEAL_MAGIC);
      int  idx   = (int)(magic - InpMagicBase) - 2;
      if(idx < 0 || idx > 1) continue;

      double net = HistoryDealGetDouble(tk, DEAL_PROFIT)
                 + HistoryDealGetDouble(tk, DEAL_COMMISSION)
                 + HistoryDealGetDouble(tk, DEAL_SWAP);

      long posId = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      for(int k = 0; k < nIn; k++)
         if(inPos[k] == posId) { net += inCost[k]; break; }

      n[idx]++;
      if(net > 0.0) { w[idx]++; gw[idx] += net; } else gl[idx] += net;
     }

   PrintFormat("===== RIEPILOGO PER STRATEGIA =====");
   double tot = 0.0;
   for(int k = 0; k < 2; k++)
     {
      if(n[k] == 0) { PrintFormat("%s  nessun trade", names[k]); continue; }
      double pf = (gl[k] != 0.0) ? gw[k] / MathAbs(gl[k]) : 0.0;
      PrintFormat("%s  trade %4d | WR %5.1f%% | PF %5.2f | P&L %+10.2f",
                  names[k], n[k], 100.0 * w[k] / n[k], pf, gw[k] + gl[k]);
      tot += gw[k] + gl[k];
     }
   PrintFormat("TOTALE %+.2f", tot);
  }

double OnTester()
  {
   PrintStrategySummary();
   return(AccountInfoDouble(ACCOUNT_BALANCE));
  }

//==================================================================
//  PANNELLO LIVE
//  Solo disegno. Non apre, non chiude, non modifica e non dimensiona
//  niente: legge il conto e lo scrive sul grafico. Si spegne da solo
//  nel tester e in ottimizzazione, quindi non rallenta i backtest.
//==================================================================
#define PN_PRE "PN_"
#define PN_OGNI 2          // secondi fra due riletture dello storico

// Dichiarate qui, definite piu' sotto nella parte specifica di questo
// EA: sono le uniche cose che cambiano fra il pannello dell'oro e
// quello del nasdaq. Il resto del blocco e' identico nei due file.
bool   PnMio(const ulong deal);
string PnTitolo();
string PnSotto();
double PnRischioPct();
double PnRischioSoldi();
int    PnDiagnostica(string &r[],color &c[]);
string PnPosizione(color &col);

bool     g_pnOn        = false;
datetime g_pnLento     = 0;     // ultimo giro "pesante"
datetime g_pnDeal      = 0;     // tempo dell'ultimo deal gia' contato
ulong    g_pnTicket    = 0;     // e il suo ticket: due deal possono cadere
                                // nello stesso secondo, e il tempo da solo
                                // ne farebbe sparire uno
double   g_pnSaldo     = 0.0;   // saldo ricostruito a quel punto
double   g_pnCurva     = 1.0;   // rendimento composto del conto (1 = piatto)
double   g_pnPicco     = 1.0;
double   g_pnDDmax     = 0.0;   // massimo drawdown toccato, in %
// PnL del periodo: [0]=mio  [1]=tutto il conto  [2]=saldo a inizio periodo
double   g_pnG[3], g_pnS[3], g_pnM[3];
double   g_pnMioTot    = 0.0;
int      g_pnMioN      = 0, g_pnMioW = 0;

//------------------------------------------------------------------
//  Disegno
//------------------------------------------------------------------
void PnRect(const string id,const int x,const int y,const int w,const int h,
            const color bg,const color bordo)
  {
   string n = PN_PRE + id;
   if(ObjectFind(0,n) < 0) ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0);
   ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER);
   ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,n,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,n,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);
   ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,bordo);
   ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);
  }

void PnText(const string id,const int x,const int y,const string txt,
            const int size,const color c)
  {
   string n = PN_PRE + id;
   if(ObjectFind(0,n) < 0) ObjectCreate(0,n,OBJ_LABEL,0,0,0);
   ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER);
   ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,n,OBJPROP_FONTSIZE,size);
   ObjectSetInteger(0,n,OBJPROP_COLOR,c);
   ObjectSetString (0,n,OBJPROP_FONT,"Arial");
   ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);
   ObjectSetString (0,n,OBJPROP_TEXT,txt);
  }

void PnPulisci()
  {
   for(int i = ObjectsTotal(0) - 1; i >= 0; i--)
     {
      string n = ObjectName(0,i);
      if(StringFind(n,PN_PRE) == 0) ObjectDelete(0,n);
     }
  }

//------------------------------------------------------------------
//  Inizio di giornata, settimana e mese in ora del server
//------------------------------------------------------------------
void PnInizioPeriodi(datetime &g,datetime &s,datetime &m)
  {
   MqlDateTime d; TimeToStruct(TimeCurrent(),d);
   MqlDateTime z; z = d;                 // copia esplicita: piu' sicura
   z.hour = 0; z.min = 0; z.sec = 0;
   g = StructToTime(z);
   z.day = 1; m = StructToTime(z);
   int indietro = (d.day_of_week == 0 ? 6 : d.day_of_week - 1);
   s = g - indietro * 86400;
  }

//------------------------------------------------------------------
//  Curva del conto in frazione, immune ai versamenti
//
//  Per ogni deal:  f = (profitto + swap + commissione) / saldo_prima
//  e il rendimento e' il prodotto dei (1+f). I versamenti e i prelievi
//  spostano il saldo ma non entrano nel rendimento, che e' quello che
//  serve: dice quanto ha reso il TRADING, non quanto e' stato messo.
//  E' la stessa grandezza usata nelle analisi in Python.
//
//  Girata tutta una volta all'avvio, poi solo sui deal nuovi.
//------------------------------------------------------------------
void PnCurvaAggiorna(const bool daCapo)
  {
   if(daCapo)
     {
      if(!HistorySelect(0,TimeCurrent())) return;
      // saldo a inizio storia = saldo di adesso meno tutto quello che e' passato
      double somma = 0.0;
      for(int i = 0; i < HistoryDealsTotal(); i++)
        {
         ulong t = HistoryDealGetTicket(i);
         if(t == 0) continue;
         somma += HistoryDealGetDouble(t,DEAL_PROFIT)
                + HistoryDealGetDouble(t,DEAL_SWAP)
                + HistoryDealGetDouble(t,DEAL_COMMISSION);
        }
      g_pnSaldo  = AccountInfoDouble(ACCOUNT_BALANCE) - somma;
      g_pnCurva  = 1.0; g_pnPicco = 1.0; g_pnDDmax = 0.0;
      g_pnDeal   = 0;   g_pnTicket = 0;
      g_pnMioTot = 0.0; g_pnMioN = 0; g_pnMioW = 0;
     }
   else
     {
      // si rileggono solo i deal nuovi: lo storico intero si gira una
      // volta sola all'avvio, non ogni due secondi
      if(!HistorySelect(g_pnDeal,TimeCurrent())) return;
     }

   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong t = HistoryDealGetTicket(i);
      if(t == 0) continue;
      if(!daCapo && t <= g_pnTicket) continue;       // gia' contato

      double netto = HistoryDealGetDouble(t,DEAL_PROFIT)
                   + HistoryDealGetDouble(t,DEAL_SWAP)
                   + HistoryDealGetDouble(t,DEAL_COMMISSION);

      g_pnDeal   = (datetime)HistoryDealGetInteger(t,DEAL_TIME);
      g_pnTicket = t;

      if(HistoryDealGetInteger(t,DEAL_TYPE) == DEAL_TYPE_BALANCE)
        { g_pnSaldo += netto; continue; }            // versamento: non e' rendimento

      // totale di questa strategia, accumulato nello stesso giro
      if(PnMio(t))
        {
         g_pnMioTot += netto;
         long e = HistoryDealGetInteger(t,DEAL_ENTRY);
         if(e == DEAL_ENTRY_OUT || e == DEAL_ENTRY_OUT_BY)
           {
            g_pnMioN++;
            if(HistoryDealGetDouble(t,DEAL_PROFIT) > 0.0) g_pnMioW++;
           }
        }

      if(g_pnSaldo > 0.0) g_pnCurva *= (1.0 + netto / g_pnSaldo);
      g_pnSaldo += netto;

      if(g_pnCurva > g_pnPicco) g_pnPicco = g_pnCurva;
      if(g_pnPicco > 0.0)
        {
         double dd = 100.0 * (g_pnPicco - g_pnCurva) / g_pnPicco;
         if(dd > g_pnDDmax) g_pnDDmax = dd;
        }
     }
  }

//------------------------------------------------------------------
//  PnL di un periodo: mio (per magic), di tutto il conto, e il saldo
//  che c'era all'inizio del periodo.
//
//  Il saldo iniziale serve per la percentuale: su un conto che cresce,
//  cento euro oggi non valgono la stessa percentuale di cento euro
//  l'anno scorso. Si divide per quello che c'era ALL'INIZIO di quel
//  periodo, non per il deposito di partenza.
//
//  Contati TUTTI i deal del magic, non solo quelli di chiusura: su
//  molti broker la commissione sta sul deal di apertura, e contando
//  solo le chiusure sparirebbe.
//------------------------------------------------------------------
void PnPeriodo(const datetime da,double &out[])
  {
   out[0] = 0.0; out[1] = 0.0; out[2] = 0.0;
   if(!HistorySelect(da,TimeCurrent())) return;
   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong t = HistoryDealGetTicket(i);
      if(t == 0) continue;
      double netto = HistoryDealGetDouble(t,DEAL_PROFIT)
                   + HistoryDealGetDouble(t,DEAL_SWAP)
                   + HistoryDealGetDouble(t,DEAL_COMMISSION);
      out[1] += netto;                              // tutto il conto, versamenti compresi
      if(HistoryDealGetInteger(t,DEAL_TYPE) == DEAL_TYPE_BALANCE) continue;
      if(PnMio(t)) out[0] += netto;                 // solo questa strategia
     }
   out[2] = AccountInfoDouble(ACCOUNT_BALANCE) - out[1];   // saldo a inizio periodo
  }

//------------------------------------------------------------------
//  Formattazione
//------------------------------------------------------------------
string PnSoldi(const double v)
  {
   return (v >= 0.0 ? "+" : "") + DoubleToString(v,2);
  }

string PnPerc(const double v,const double base)
  {
   if(base <= 0.0) return "n/d";
   double p = 100.0 * v / base;
   return (p >= 0.0 ? "+" : "") + DoubleToString(p,2) + "%";
  }

color PnCol(const double v,const color su,const color giu,const color pari)
  {
   if(v > 0.0) return su;
   if(v < 0.0) return giu;
   return pari;
  }

//------------------------------------------------------------------
//  Le parti che cambiano da un EA all'altro — qui l'ORO
//------------------------------------------------------------------
bool PnMio(const ulong deal)
  {
   long m = HistoryDealGetInteger(deal,DEAL_MAGIC);
   return (m == InpMagicBase + 2 || m == InpMagicBase + 3);
  }

string PnTitolo() { return "ORO"; }
string PnSotto()  { return "ROTTURA M30 + RITRACCIAMENTO H4"; }

double PnRischioPct()   { return EffectiveRiskPercent(); }
double PnRischioSoldi() { return AccountInfoDouble(ACCOUNT_EQUITY)
                               * EffectiveRiskPercent() / 100.0; }

//  Lo stato delle due gambe, in lettura pura: gli stessi indicatori e
//  gli stessi confronti di RunS2 e RunS3, ma senza toccare niente.
int PnDiagnostica(string &r[],color &c[])
  {
   color verde=C'82,214,143', rosso=C'244,101,105', smorto=C'158,164,178',
         bianco=C'235,238,245';
   int n = 0;

   if(!TerminalInfoInteger(TERMINAL_CONNECTED))
     { r[0]="MT5 NON CONNESSO"; c[0]=rosso; return 1; }

   MqlDateTime d; TimeToStruct(TimeCurrent(),d);
   if(d.day_of_week == 0 || d.day_of_week == 6)
     { r[0]="WEEKEND - MERCATO CHIUSO"; c[0]=smorto; return 1; }

   if(InpMaxSpreadPoints > 0 &&
      SymbolInfoInteger(_Symbol,SYMBOL_SPREAD) > InpMaxSpreadPoints)
     { r[n]="SPREAD TROPPO LARGO - ferma"; c[n]=rosso; n++; }

   double bid = SymbolInfoDouble(_Symbol,SYMBOL_BID);

   // ---------------- ROTTURA (M30) ----------------
   if(!InpS3Enabled)
     { r[n]="ROTTURA M30: spenta"; c[n]=smorto; n++; }
   else if(CountPositions(InpMagicBase+3) > 0)
     { r[n]="ROTTURA M30: posizione aperta"; c[n]=verde; n++; }
   else
     {
      double atrF = IndValue(hS3AtrF,1), atrS = IndValue(hS3AtrS,1);
      if(atrF <= 0.0 || atrS <= 0.0)
        { r[n]="ROTTURA M30: dati non pronti"; c[n]=smorto; n++; }
      else if((atrF/atrS) < InpS3VolExpandRatio)
        {
         r[n]="ROTTURA M30: volatilita' piatta (" +
              DoubleToString(atrF/atrS,2) + " < " +
              DoubleToString(InpS3VolExpandRatio,2) + ")";
         c[n]=smorto; n++;
        }
      else
        {
         int iBH = iHighest(_Symbol,InpS3TF,MODE_HIGH,InpS3BreakBars,2);
         int iBL = iLowest (_Symbol,InpS3TF,MODE_LOW, InpS3BreakBars,2);
         if(iBH < 0 || iBL < 0)
           { r[n]="ROTTURA M30: dati non pronti"; c[n]=smorto; n++; }
         else
           {
            double bh = iHigh(_Symbol,InpS3TF,iBH), bl = iLow(_Symbol,InpS3TF,iBL);
            double su = bh - bid, giu = bid - bl;
            r[n] = "ROTTURA M30: " +
                   (su <= 0.0 ? "SOPRA il canale"
                              : "mancano " + DoubleToString(su,2) + " in su") +
                   " / " +
                   (giu <= 0.0 ? "SOTTO il canale"
                               : DoubleToString(giu,2) + " in giu'");
            c[n] = (su <= 0.0 || giu <= 0.0) ? bianco : smorto;
            n++;
           }
        }
     }

   // ---------------- RITRACCIAMENTO (H4) ----------------
   if(!InpS2Enabled)
     { r[n]="RITRACC H4: spento"; c[n]=smorto; n++; }
   else if(CountPositions(InpMagicBase+2) > 0)
     { r[n]="RITRACC H4: posizione aperta"; c[n]=verde; n++; }
   else
     {
      double ema1 = IndValue(hS2Ema,1);
      double emaN = IndValue(hS2Ema,1+InpS2EmaSlopeBars);
      double c1   = iClose(_Symbol,InpS2TF,1);
      if(ema1 <= 0.0 || emaN <= 0.0 || c1 <= 0.0)
        { r[n]="RITRACC H4: dati non pronti"; c[n]=smorto; n++; }
      else
        {
         double slope = (ema1 - emaN) / InpS2EmaSlopeBars;
         string t;
         if(c1 > ema1 && slope > 0.0)      t = "trend SU, cerca il ritracciamento";
         else if(c1 < ema1 && slope < 0.0) t = "trend GIU', cerca il rimbalzo";
         else                              t = "niente trend, fermo";
         // attesa dopo l'ultimo ingresso
         if(InpS2CooldownBars > 0 && s2LastEntryBar > 0)
           {
            long passati = (long)(iTime(_Symbol,InpS2TF,0) - s2LastEntryBar);
            long serve   = (long)InpS2CooldownBars * PeriodSeconds(InpS2TF);
            if(passati < serve)
               t = "attesa dopo l'ultimo ingresso (" +
                   IntegerToString((int)((serve-passati)/3600)) + "h)";
           }
         r[n] = "RITRACC H4: " + t;
         c[n] = (StringFind(t,"trend") == 0) ? bianco : smorto;
         n++;
        }
     }
   return n;
  }

//  La distanza di stop iniziale, letta e basta.
//  NON si usa RecallRisk: quella, se non trova il ticket in memoria,
//  lo va a cercare nello storico e POI LO SCRIVE nella memoria, che ha
//  64 posti. Chiamarla dal pannello a ogni tick sfratterebbe le voci
//  vere e il trailing perderebbe il suo 1R. Qui si legge soltanto: se
//  il ticket non c'e' (EA riavviato a meta'), l'R non si mostra.
double PnDistanzaRischio(const ulong ticket)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) return(g_risk[i].riskDistance);
   return(0.0);
  }

//  La posizione aperta, con il suo R corrente
string PnPosizione(color &col)
  {
   color verde=C'82,214,143', rosso=C'244,101,105', smorto=C'158,164,178';
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong t = PositionGetTicket(i);
      if(t == 0 || !PositionSelectByTicket(t)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      long m = PositionGetInteger(POSITION_MAGIC);
      if(m != InpMagicBase + 2 && m != InpMagicBase + 3) continue;

      bool lungo = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY);
      double apertura = PositionGetDouble(POSITION_PRICE_OPEN);
      double prezzo   = PositionGetDouble(POSITION_PRICE_CURRENT);
      double profitto = PositionGetDouble(POSITION_PROFIT)
                      + PositionGetDouble(POSITION_SWAP);
      col = PnCol(profitto,verde,rosso,smorto);

      string nome = (m == InpMagicBase + 3 ? "ROTTURA" : "RITRACC");
      string r = "";
      double dist = PnDistanzaRischio(t);
      if(dist > 0.0)
        {
         double rr = (lungo ? prezzo - apertura : apertura - prezzo) / dist;
         r = "  R " + (rr >= 0.0 ? "+" : "") + DoubleToString(rr,2);
        }
      return nome + " " + (lungo ? "LONG" : "SHORT") + r;
     }
   col = smorto;
   return "nessuna posizione";
  }

//------------------------------------------------------------------
//  Il disegno vero e proprio. Le parti che cambiano da un EA
//  all'altro stanno nelle funzioni PnMio, PnTitolo, PnSotto,
//  PnDiagnostica, PnRischioPct e PnPosizione, definite piu' sotto.
//------------------------------------------------------------------
void PnDisegna()
  {
   color bg=C'13,15,22', card=C'21,24,34', bordo=C'80,61,115';
   color bianco=C'235,238,245', smorto=C'158,164,178';
   color verde=C'82,214,143', rosso=C'244,101,105', viola=C'190,102,255';

   int X = InpPannelloX, Y = InpPannelloY, W = 360;
   int cx = X + 16, cw = W - 32, tx = X + 28;

   string diag[8]; color dcol[8];
   int nd = PnDiagnostica(diag,dcol);
   if(nd > 8) nd = 8;

   // altezza totale: quello che c'e' sopra + le righe di diagnostica
   int hDiag = 30 + 18*nd;
   int H = 96 + hDiag + 8 + 66 + 8 + 116 + 8 + 48 + 8 + 48 + 8 + 52 + 14;

   PnRect("BG",X,Y,W,H,bg,bordo);

   PnText("T1",tx,Y+16,PnTitolo(),19,bianco);
   PnText("T2",tx,Y+45,PnSotto(),9,viola);

   bool algo = (bool)TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)
            && (bool)MQLInfoInteger(MQL_TRADE_ALLOWED)
            && (bool)AccountInfoInteger(ACCOUNT_TRADE_ALLOWED);
   PnText("BOT",tx,Y+72,"BOT: " + (algo ? "ATTIVO" : "BLOCCATO"),11,
          algo ? verde : rosso);

   MqlTick q; double spread = 0.0;
   if(SymbolInfoTick(_Symbol,q)) spread = q.ask - q.bid;
   PnText("SP",X+232,Y+73,"Spread " + DoubleToString(spread,2),9,smorto);

   int y = Y + 96;

   // ---------------- diagnostica ----------------
   PnRect("C0",cx,y,cw,hDiag,card,bordo);
   PnText("H0",tx,y+9,"DIAGNOSTICA",10,bianco);
   for(int i = 0; i < nd; i++)
      PnText("D"+IntegerToString(i),tx,y+30+18*i,diag[i],9,dcol[i]);
   for(int i = nd; i < 8; i++) ObjectDelete(0,PN_PRE+"D"+IntegerToString(i));
   y += hDiag + 8;

   // ---------------- conto ----------------
   double bal = AccountInfoDouble(ACCOUNT_BALANCE);
   double eq  = AccountInfoDouble(ACCOUNT_EQUITY);
   double flt = eq - bal;
   double mrg = AccountInfoDouble(ACCOUNT_MARGIN);
   PnRect("C1",cx,y,cw,66,card,bordo);
   PnText("H1",tx,y+9,"CONTO",10,bianco);
   PnText("A1",tx,y+28,"Saldo  " + DoubleToString(bal,2),9,smorto);
   PnText("A2",X+204,y+28,"Equity  " + DoubleToString(eq,2),9,smorto);
   PnText("A3",tx,y+46,"Flottante  " + PnSoldi(flt),9,PnCol(flt,verde,rosso,smorto));
   PnText("A4",X+204,y+46,"Margine  " + (eq > 0.0 ? DoubleToString(100.0*mrg/eq,1) : "0,0") + "%",
          9,smorto);
   y += 66 + 8;

   // ---------------- questa strategia ----------------
   PnRect("C2",cx,y,cw,116,card,bordo);
   PnText("H2",tx,y+9,"QUESTA STRATEGIA",10,bianco);
   PnText("H2b",X+236,y+10,"(solo il suo magic)",7,smorto);
   string et[3] = {"Oggi","Settimana","Mese"};
   for(int i = 0; i < 3; i++)
     {
      double mio, base;
      if(i == 0)      { mio = g_pnG[0]; base = g_pnG[2]; }
      else if(i == 1) { mio = g_pnS[0]; base = g_pnS[2]; }
      else            { mio = g_pnM[0]; base = g_pnM[2]; }
      color c = PnCol(mio,verde,rosso,smorto);
      PnText("P"+IntegerToString(i)+"a",tx,y+30+20*i,et[i],9,smorto);
      PnText("P"+IntegerToString(i)+"b",X+212,y+30+20*i,PnSoldi(mio),9,c);
      PnText("P"+IntegerToString(i)+"c",X+292,y+30+20*i,PnPerc(mio,base),9,c);
     }
   PnText("P3a",tx,y+92,"Da sempre",9,smorto);
   PnText("P3b",X+212,y+92,PnSoldi(g_pnMioTot),9,PnCol(g_pnMioTot,verde,rosso,smorto));
   PnText("P3c",X+292,y+92,IntegerToString(g_pnMioN) + " op" +
          (g_pnMioN > 0 ? "  " + DoubleToString(100.0*g_pnMioW/g_pnMioN,0) + "%" : ""),
          9,smorto);
   y += 116 + 8;

   // ---------------- drawdown ----------------
   // curva in frazione + il flottante di adesso, cosi' il "sotto il
   // massimo" tiene conto anche di quello che e' ancora aperto
   double curvaOra = g_pnCurva;
   if(bal > 0.0) curvaOra *= (1.0 + flt / bal);
   double ddOra = (g_pnPicco > 0.0 ? 100.0*(g_pnPicco - curvaOra)/g_pnPicco : 0.0);
   if(ddOra < 0.0) ddOra = 0.0;
   double ddMax = MathMax(g_pnDDmax,ddOra);
   PnRect("C3",cx,y,cw,48,card,bordo);
   PnText("H3",tx,y+9,"DRAWDOWN",10,bianco);
   PnText("W1",tx,y+28,"Adesso  -" + DoubleToString(ddOra,2) + "%",9,
          ddOra > 0.01 ? rosso : smorto);
   PnText("W2",X+196,y+28,"Massimo toccato  -" + DoubleToString(ddMax,2) + "%",9,
          ddMax > 0.01 ? rosso : smorto);
   y += 48 + 8;

   // ---------------- rendimento del conto ----------------
   PnRect("C4",cx,y,cw,48,card,bordo);
   PnText("H4",tx,y+9,"RENDIMENTO DEL CONTO",10,bianco);
   PnText("H4b",X+230,y+10,"(versamenti esclusi)",7,smorto);
   double rc = 100.0*(curvaOra - 1.0);
   PnText("R0",tx,y+28,(rc >= 0.0 ? "+" : "") + DoubleToString(rc,2) + "%  composto, da quando c'e' storico",
          9,PnCol(rc,verde,rosso,smorto));
   y += 48 + 8;

   // ---------------- rischio e operazione ----------------
   PnRect("C5",cx,y,cw,52,card,bordo);
   PnText("H5",tx,y+9,"RISCHIO E OPERAZIONE",10,bianco);
   PnText("K1",tx,y+30,DoubleToString(PnRischioPct(),2) + "% = " +
          DoubleToString(PnRischioSoldi(),2) + " per operazione",9,bianco);
   color pcol = smorto;
   string ps = PnPosizione(pcol);
   PnText("K2",X+196,y+30,ps,9,pcol);

   ChartRedraw(0);
  }

//------------------------------------------------------------------
//  Aggancio al ciclo di vita dell'EA
//------------------------------------------------------------------
void PannelloInit()
  {
   // spento nel tester e in ottimizzazione: il backtest non deve
   // pagare un centesimo di tempo per una cosa che nessuno guarda
   g_pnOn = InpPannello
         && !(bool)MQLInfoInteger(MQL_TESTER)
         && !(bool)MQLInfoInteger(MQL_OPTIMIZATION);
   if(!g_pnOn) return;
   PnPulisci();
   PnCurvaAggiorna(true);
   datetime g,s,m; PnInizioPeriodi(g,s,m);
   PnPeriodo(g,g_pnG); PnPeriodo(s,g_pnS); PnPeriodo(m,g_pnM);
   g_pnLento = TimeCurrent();
   PnDisegna();
  }

void PannelloTick()
  {
   if(!g_pnOn) return;
   // lo storico si rilegge ogni PN_OGNI secondi; equity, flottante e
   // posizione aperta si ridisegnano a ogni tick perche' costano nulla
   if(TimeCurrent() - g_pnLento >= PN_OGNI)
     {
      PnCurvaAggiorna(false);
      datetime g,s,m; PnInizioPeriodi(g,s,m);
      PnPeriodo(g,g_pnG); PnPeriodo(s,g_pnS); PnPeriodo(m,g_pnM);
      g_pnLento = TimeCurrent();
     }
   PnDisegna();
  }

void PannelloDeinit()
  {
   if(g_pnOn) PnPulisci();
  }

//==================================================================
//  CICLO DI VITA
//==================================================================
int OnInit()
  {
   hS2Ema   = iMA (_Symbol, InpS2TF, InpS2TrendEma, 0, MODE_EMA, PRICE_CLOSE);
   hS2Atr   = iATR(_Symbol, InpS2TF, InpS2AtrPeriod);
   hS3AtrF  = iATR(_Symbol, InpS3TF, InpS3AtrFast);
   hS3AtrS  = iATR(_Symbol, InpS3TF, InpS3AtrSlow);
   hRiskAtr = iATR(_Symbol, InpRiskTF, InpRiskAtrPeriod);

   if(hS2Ema  == INVALID_HANDLE || hS2Atr  == INVALID_HANDLE ||
      hS3AtrF == INVALID_HANDLE || hS3AtrS == INVALID_HANDLE ||
      hRiskAtr == INVALID_HANDLE)
     { Print("handle indicatore non creato"); return(INIT_FAILED); }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   for(int i = 0; i < RISK_SLOTS; i++)
     { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; g_risk[i].retryAfter = 0; }
   g_riskIdx  = 0;
   lastBarS2 = 0; lastBarS3 = 0; s2LastEntryBar = 0;

   PannelloInit();
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PannelloDeinit();
   PrintStrategySummary();
   IndicatorRelease(hS2Ema);
   IndicatorRelease(hS2Atr);
   IndicatorRelease(hS3AtrF);
   IndicatorRelease(hS3AtrS);
   IndicatorRelease(hRiskAtr);
  }

void OnTick()
  {
   PannelloTick();          // solo disegno, e solo fuori dal tester
   WeekendGuard();

   // entrambe cavalcano, ciascuna con il proprio ATR e timeframe
   ManageTrailing(InpMagicBase + 2, InpS2TrailStartR, InpS2TrailATR, hS2Atr,  1.0);
   ManageTrailing(InpMagicBase + 3, InpS3TrailStartR, InpS3TrailATR, hS3AtrF, InpS3StopATR);

   if(!TradingAllowed()) return;

   bool newS2 = IsNewBar(InpS2TF, lastBarS2);
   bool newS3 = IsNewBar(InpS3TF, lastBarS3);

   if(InpS2Enabled && InpS2RiskMult > 0.0 && newS2) RunS2();
   if(InpS3Enabled && InpS3RiskMult > 0.0 && newS3) RunS3();
  }
//+------------------------------------------------------------------+
