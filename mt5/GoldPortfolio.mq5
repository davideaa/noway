//+------------------------------------------------------------------+
//|                                              GoldPortfolio.mq5   |
//|                                                                  |
//|  PORTAFOGLIO A TRE FAMIGLIE — XAUUSD                              |
//|                                                                  |
//|  Sostituisce GoldMomentum3, che conteneva tre sistemi trend       |
//|  diversi solo nella formula. Misurato: si accendevano insieme     |
//|  (Z-Score -3,53) e il drawdown si sommava invece di compensarsi.  |
//|                                                                  |
//|  Qui le tre gambe rispondono a momenti diversi, e la differenza   |
//|  e' imposta dal codice, non sperata:                              |
//|                                                                  |
//|   S1 FADE   il prezzo rompe il canale a 60 barre e RIENTRA        |
//|             -> chi ha comprato la rottura e' intrappolato         |
//|             (ex S4; era la strategia 4 di GoldMomentum3)          |
//|                                                                  |
//|   S2 PULLB  ritracciamento dentro un trend gia' stabilito (H4)   |
//|             -> entra dove S3 viene stoppata e resta dentro         |
//|             (nuova)                                               |
//|                                                                  |
//|   S3 DONCH  il prezzo rompe il canale a 60 barre e CONTINUA       |
//|             (invariata: e' l'unica delle tre originali che regge) |
//|                                                                  |
//|  S1 e S3 nascono dallo stesso evento e prendono lati opposti.     |
//|  S2 richiede che il prezzo NON sia sull'estremo, quindi non puo'  |
//|  entrare sulla stessa candela di S3, e lavora su H4: tiene le     |
//|  posizioni per settimane dove S3 le tiene per ore.                |
//|                                                                  |
//|  PROTOCOLLO: sviluppo solo su 2019.06.01-2023.12.31.              |
//|  Il 2024.01.01-2026.09.18 resta congelato.                        |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//==================================================================
//  INPUT
//==================================================================
input group "=== Generale ==="
input long              InpMagicBase          = 997000;   // Magic base (S1=+1, S2=+2, S3=+3)
input double            InpRiskPercent        = 0.6;      // Rischio base per trade (% equity)
input int               InpMaxPosPerStrategy  = 1;        // Posizioni max per strategia
input double            InpMaxTotalRiskPct    = 0.0;      // Tetto al rischio aperto totale (%, 0 = off)

input group "=== Pesi per strategia (moltiplicatori del rischio base) ==="
input double            InpS1RiskMult         = 1.0;      // Peso di S1 (FADE)
input double            InpS2RiskMult         = 1.0;      // Peso di S2 (PULLBACK)
input double            InpS3RiskMult         = 1.0;      // Peso di S3 (DONCH)
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

input group "=== S1: FADE del breakout fallito (M30) ==="
input bool              InpS1Enabled          = true;     // Attiva S1
input ENUM_TIMEFRAMES   InpS1TF               = PERIOD_M30;// Timeframe
input int               InpS1BreakBars        = 60;       // Canale rotto (lo stesso di S3)
input int               InpS1ReentryBars      = 3;        // Barre entro cui deve rientrare
input int               InpS1AtrPeriod        = 14;       // Periodo ATR
input double            InpS1StopBufferATR    = 0.5;      // Buffer stop oltre l'estremo
input double            InpS1TargetR          = 2.0;      // Take profit in R
input int               InpS1MaxHoldBars      = 48;       // Uscita forzata dopo N barre
input bool              InpS1AllowLong        = true;     // Fade dei minimi rotti
input bool              InpS1AllowShort       = true;     // Fade dei massimi rotti

input group "=== S2: PULLBACK nel trend (H4) ==="
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

input group "=== S3: DONCHIAN breakout + volatilita (M30) ==="
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
input bool              InpS3AllowShort       = true;     // Consenti short

//==================================================================
//  STATO
//==================================================================
CTrade   trade;

int      hS1Atr   = INVALID_HANDLE;
int      hS2Ema   = INVALID_HANDLE, hS2Atr  = INVALID_HANDLE;
int      hS3AtrF  = INVALID_HANDLE, hS3AtrS = INVALID_HANDLE;
int      hRiskAtr = INVALID_HANDLE;

datetime lastBarS1 = 0, lastBarS2 = 0, lastBarS3 = 0;
datetime s2LastEntryBar = 0;   // cooldown di S2

// macchina a stati di S1 (fade): rottura in corso verso alto / basso
bool     s1UpActive = false, s1DnActive = false;
double   s1UpLevel = 0.0, s1UpExtreme = 0.0, s1DnLevel = 0.0, s1DnExtreme = 0.0;
int      s1UpBars = 0, s1DnBars = 0;

// Il trailing ha bisogno della distanza di stop iniziale (1R) di ogni
// posizione: l'ATR al momento dell'apertura non e' recuperabile dopo.
#define RISK_SLOTS 64
struct TradeRisk { ulong ticket; double riskDistance; };
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
   g_riskIdx = (g_riskIdx + 1) % RISK_SLOTS;
  }

double RecallRisk(const ulong ticket, const double fallback)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) return(g_risk[i].riskDistance);
   return(fallback);   // non trovato: stima con l'ATR corrente
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
      if(magic < InpMagicBase + 1 || magic > InpMagicBase + 3) continue;

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
      CloseAllForMagic(InpMagicBase + 1);
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
//  Chiusura forzata per durata massima.
//  Serve alle due gambe mean reverting: se il prezzo non e' tornato
//  dove doveva entro poche barre, l'ipotesi e' sbagliata e restare
//  aperti significa solo trasformare il trade in una scommessa
//  direzionale che nessuno ha deciso di fare.
//------------------------------------------------------------------
void CloseExpiredMagic(const long magic, const ENUM_TIMEFRAMES tf, const int maxBars)
  {
   if(maxBars <= 0) return;
   long maxSec = (long)maxBars * PeriodSeconds(tf);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      if(TimeCurrent() - (datetime)PositionGetInteger(POSITION_TIME) >= maxSec)
        {
         trade.SetExpertMagicNumber(magic);
         trade.PositionClose(tk);
        }
     }
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
      trade.PositionModify(tk, newSL, curTP);
     }
  }

//==================================================================
//  S1 — FADE del breakout fallito (M30)
//
//  Sopra un massimo evidente si accumulano stop e ordini stop-buy.
//  Quando il prezzo li raggiunge la liquidita' viene consumata in un
//  colpo; se non arriva domanda reale il prezzo rientra e chi ha
//  comprato la rottura resta intrappolato e deve uscire, spingendo
//  nella direzione opposta.
//
//  Prende il lato opposto dello STESSO evento su cui entra S3:
//  l'anticorrelazione fra le due e' meccanica, non sperata.
//==================================================================
void RunS1()
  {
   long   magic = InpMagicBase + 1;
   double atr   = IndValue(hS1Atr, 1);
   if(atr <= 0.0) return;

   double c1 = iClose(_Symbol, InpS1TF, 1);
   double h1 = iHigh (_Symbol, InpS1TF, 1);
   double l1 = iLow  (_Symbol, InpS1TF, 1);
   if(c1 <= 0.0) return;

   bool   canOpen = (CountPositions(magic) < InpMaxPosPerStrategy);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   // ---------------- rottura verso l'alto ----------------
   if(s1UpActive)
     {
      if(h1 > s1UpExtreme) s1UpExtreme = h1;
      s1UpBars++;
      if(c1 < s1UpLevel)                       // rientro: la rottura e' fallita -> short
        {
         if(InpS1AllowShort && canOpen && bid > 0.0)
           {
            double stopPrice = s1UpExtreme + InpS1StopBufferATR * atr;
            double dist      = stopPrice - bid;
            if(dist > 0.0)
               OpenTrade(magic, false, dist, InpS1TargetR, "S1-FADE", InpS1RiskMult);
           }
         s1UpActive = false;
        }
      else if(s1UpBars >= InpS1ReentryBars) s1UpActive = false;  // rottura confermata
     }
   else
     {
      int ih = iHighest(_Symbol, InpS1TF, MODE_HIGH, InpS1BreakBars, 2);
      if(ih >= 0)
        {
         double lvl = iHigh(_Symbol, InpS1TF, ih);
         if(c1 > lvl) { s1UpActive = true; s1UpLevel = lvl; s1UpExtreme = h1; s1UpBars = 0; }
        }
     }

   // ---------------- rottura verso il basso ----------------
   if(s1DnActive)
     {
      if(l1 < s1DnExtreme) s1DnExtreme = l1;
      s1DnBars++;
      if(c1 > s1DnLevel)
        {
         if(InpS1AllowLong && canOpen && ask > 0.0)
           {
            double stopPrice = s1DnExtreme - InpS1StopBufferATR * atr;
            double dist      = ask - stopPrice;
            if(dist > 0.0)
               OpenTrade(magic, true, dist, InpS1TargetR, "S1-FADE", InpS1RiskMult);
           }
         s1DnActive = false;
        }
      else if(s1DnBars >= InpS1ReentryBars) s1DnActive = false;
     }
   else
     {
      int il = iLowest(_Symbol, InpS1TF, MODE_LOW, InpS1BreakBars, 2);
      if(il >= 0)
        {
         double lvl = iLow(_Symbol, InpS1TF, il);
         if(c1 < lvl) { s1DnActive = true; s1DnLevel = lvl; s1DnExtreme = l1; s1DnBars = 0; }
        }
     }
  }

//==================================================================
//  S2 — PULLBACK nel trend (H4)
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
   if(c1 <= 0.0 || h2 <= 0.0) return;

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
//  S3 — DONCHIAN breakout + espansione di volatilita (M30)
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

   bool longSignal  = (pos >= InpS3EdgeThreshold) && (close1 > breakHi);
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

   string names[3] = {"S1-FADE ", "S2-PULLB", "S3-DONCH"};
   int    n[3]     = {0, 0, 0};
   int    w[3]     = {0, 0, 0};
   double gw[3]    = {0.0, 0.0, 0.0};
   double gl[3]    = {0.0, 0.0, 0.0};

   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;

      long magic = HistoryDealGetInteger(tk, DEAL_MAGIC);
      int  idx   = (int)(magic - InpMagicBase) - 1;
      if(idx < 0 || idx > 2) continue;

      double net = HistoryDealGetDouble(tk, DEAL_PROFIT)
                 + HistoryDealGetDouble(tk, DEAL_COMMISSION)
                 + HistoryDealGetDouble(tk, DEAL_SWAP);
      n[idx]++;
      if(net > 0.0) { w[idx]++; gw[idx] += net; } else gl[idx] += net;
     }

   PrintFormat("===== RIEPILOGO PER STRATEGIA =====");
   double tot = 0.0;
   for(int k = 0; k < 3; k++)
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
//  CICLO DI VITA
//==================================================================
int OnInit()
  {
   hS1Atr   = iATR(_Symbol, InpS1TF, InpS1AtrPeriod);
   hS2Ema   = iMA (_Symbol, InpS2TF, InpS2TrendEma, 0, MODE_EMA, PRICE_CLOSE);
   hS2Atr   = iATR(_Symbol, InpS2TF, InpS2AtrPeriod);
   hS3AtrF  = iATR(_Symbol, InpS3TF, InpS3AtrFast);
   hS3AtrS  = iATR(_Symbol, InpS3TF, InpS3AtrSlow);
   hRiskAtr = iATR(_Symbol, InpRiskTF, InpRiskAtrPeriod);

   if(hS1Atr  == INVALID_HANDLE || hS2Ema  == INVALID_HANDLE ||
      hS2Atr  == INVALID_HANDLE || hS3AtrF == INVALID_HANDLE ||
      hS3AtrS == INVALID_HANDLE || hRiskAtr == INVALID_HANDLE)
     { Print("handle indicatore non creato"); return(INIT_FAILED); }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   for(int i = 0; i < RISK_SLOTS; i++) { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; }
   g_riskIdx  = 0;
   lastBarS1  = 0; lastBarS2 = 0; lastBarS3 = 0; s2LastEntryBar = 0;
   s1UpActive = false; s1DnActive = false;

   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PrintStrategySummary();
   IndicatorRelease(hS1Atr);
   IndicatorRelease(hS2Ema);
   IndicatorRelease(hS2Atr);
   IndicatorRelease(hS3AtrF);
   IndicatorRelease(hS3AtrS);
   IndicatorRelease(hRiskAtr);
  }

void OnTick()
  {
   WeekendGuard();

   // uscita per durata: solo S1, l'unica con un target fisso da
   // raggiungere entro poche barre
   CloseExpiredMagic(InpMagicBase + 1, InpS1TF, InpS1MaxHoldBars);

   // trailing: S2 e S3 cavalcano, ciascuna con il proprio ATR e il
   // proprio timeframe. S1 ha un target fisso e si chiude da sola.
   ManageTrailing(InpMagicBase + 2, InpS2TrailStartR, InpS2TrailATR, hS2Atr,  1.0);
   ManageTrailing(InpMagicBase + 3, InpS3TrailStartR, InpS3TrailATR, hS3AtrF, InpS3StopATR);

   if(!TradingAllowed()) return;

   bool newS1 = IsNewBar(InpS1TF, lastBarS1);
   bool newS2 = IsNewBar(InpS2TF, lastBarS2);
   bool newS3 = IsNewBar(InpS3TF, lastBarS3);

   if(InpS1Enabled && InpS1RiskMult > 0.0 && newS1) RunS1();
   if(InpS2Enabled && InpS2RiskMult > 0.0 && newS2) RunS2();
   if(InpS3Enabled && InpS3RiskMult > 0.0 && newS3) RunS3();
  }
//+------------------------------------------------------------------+
