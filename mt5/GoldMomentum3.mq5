//+------------------------------------------------------------------+
//|                                              GoldMomentum3.mq5   |
//|  Ricostruzione del sistema "Gold Momentum" a 3 strategie (XAUUSD) |
//|                                                                  |
//|  Fonte: sole card promozionali. I parametri DICHIARATI nelle card |
//|  sono i default; i parametri NON dichiarati sono comunque esposti |
//|  come input (marcati [C] = da calibrare) per poterli ottimizzare. |
//|                                                                  |
//|  ATTENZIONE: richiede un conto HEDGING (le 3 strategie possono    |
//|  essere in posizione contemporaneamente, anche in direzioni       |
//|  opposte). Su conto netting i risultati non sono comparabili.     |
//|                                                                  |
//|  Timeframe del grafico: indifferente (ogni strategia usa il suo). |
//|  Consigliato allegarlo su H1 e testare in "Every tick based on    |
//|  real ticks" con spread reale.                                    |
//+------------------------------------------------------------------+
#property copyright "Ricostruzione a scopo di ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//==================================================================
//  INPUT
//==================================================================
input group "=== Generale ==="
input long              InpMagicBase          = 990000;   // Magic base (S1=+1, S2=+2, S3=+3)
input double            InpRiskPercent        = 0.6;      // [L] Rischio base per trade (% equity)
input int               InpMaxPosPerStrategy  = 1;        // [C] Posizioni max per strategia
input double            InpMaxTotalRiskPct    = 0.0;      // [C] Tetto al rischio aperto totale (%, 0 = off)

input group "=== Pesi per strategia (moltiplicatori del rischio base) ==="
input double            InpS1RiskMult         = 1.0;      // [C] Peso di S1
input double            InpS2RiskMult         = 1.0;      // [C] Peso di S2
input double            InpS3RiskMult         = 1.0;      // [C] Peso di S3
input double            InpS4RiskMult         = 1.0;      // [C] Peso di S4
input int               InpSlippagePoints     = 30;       // Deviazione massima (points)
input int               InpMaxSpreadPoints    = 0;        // [C] Spread max in points (0 = filtro off)

input group "=== Adaptive Risk (sizing) ==="
input bool              InpUseAdaptiveRisk    = false;    // [T] Adaptive Risk: misurato peggiore, tenere spento
input ENUM_TIMEFRAMES   InpRiskTF             = PERIOD_H1;// [C] TF per la misura di volatilita
input int               InpRiskAtrPeriod      = 14;       // [C] Periodo ATR corrente
input int               InpRiskBaselinePeriod = 200;      // [C] Finestra del "livello normale"
input double            InpRiskMultMin        = 0.5;      // [L] Moltiplicatore minimo
input double            InpRiskMultMax        = 2.0;      // [L] Moltiplicatore massimo

input group "=== Filtro orario (NON dichiarato nelle card) ==="
input bool              InpUseSessionFilter   = false;    // [C] Attiva filtro orario (server time)
input int               InpSessionStartHour   = 0;        // [C] Ora inizio (inclusa)
input int               InpSessionEndHour     = 24;       // [C] Ora fine (esclusa)
input bool              InpCloseBeforeWeekend = false;    // [C] Chiudi tutto il venerdi
input int               InpFridayCloseHour    = 21;       // [C] Ora chiusura del venerdi

input group "=== S1: Time-Series Momentum (H1) ==="
input bool              InpS1Enabled          = true;     // Attiva S1
input ENUM_TIMEFRAMES   InpS1TF               = PERIOD_H1;// [L] Timeframe
input int               InpS1MomLookback      = 24;       // [L] Lookback momentum (barre = 24h)
input double            InpS1MomThresholdATR  = 0.5;      // [L] Soglia momentum in ATR
input int               InpS1EmaPeriod        = 100;      // [L] Periodo EMA di regime
input int               InpS1EmaSlopeBars     = 1;        // [C] Barre per la pendenza EMA
input int               InpS1BreakoutBars     = 24;       // [L] Barre del canale di rottura
input int               InpS1AtrPeriod        = 14;       // [C] Periodo ATR
input double            InpS1StopATR          = 2.5;      // [L] Stop loss in ATR (= 1R)
input double            InpS1TrailStartR      = 1.0;      // [L] Attiva trailing a +xR
input double            InpS1TrailATR         = 4.25;     // [T] Distanza trailing in ATR (trovato: plateau 4.0-4.5)
input bool              InpS1AllowShort       = true;     // [D] Consenti short

input group "=== S2: Trend-Following EMA (H1) ==="
input bool              InpS2Enabled          = true;     // Attiva S2
input ENUM_TIMEFRAMES   InpS2TF               = PERIOD_H1;// [L] Timeframe
input int               InpS2EmaPeriod        = 10;       // [L] Periodo EMA veloce
input int               InpS2SlopeBars        = 4;        // [T] Barre per la pendenza EMA (trovato)
input double            InpS2SlopeMinATR      = 0.05;     // [C] Soglia pendenza PER BARRA (in ATR) <<< PARAMETRO CHIAVE
input int               InpS2AtrPeriod        = 14;       // [C] Periodo ATR
input double            InpS2StopATR          = 2.0;      // [L] Stop loss in ATR (= 1R)
input bool              InpS2ExitOnOpposite   = true;     // [L] Esci sul segnale opposto
input bool              InpS2ExitNeedsSlope   = true;     // [C] L'uscita richiede la stessa conferma di pendenza
input int               InpS2RegimeEmaPeriod  = 0;        // [C] EMA di regime (0 = filtro disattivato)
input bool              InpS2AllowShort       = true;     // [D] Consenti short

input group "=== S4: Fade del breakout fallito (M30) ==="
input bool              InpS4Enabled          = true;     // Attiva S4
input ENUM_TIMEFRAMES   InpS4TF               = PERIOD_M30;// Timeframe
input int               InpS4BreakBars        = 60;       // Canale rotto (= trigger di S3)
input int               InpS4ReentryBars      = 3;        // Barre entro cui deve rientrare
input int               InpS4AtrPeriod        = 14;       // Periodo ATR
input double            InpS4StopBufferATR    = 0.5;      // Buffer stop oltre l'estremo
input double            InpS4TargetR          = 2.0;      // Take profit in R
input int               InpS4MaxHoldBars      = 48;       // Uscita forzata dopo N barre
input bool              InpS4AllowLong        = true;     // Fade dei minimi rotti
input bool              InpS4AllowShort       = true;     // Fade dei massimi rotti

input group "=== S3: Donchian breakout + Volatilita (M30) ==="
input bool              InpS3Enabled          = true;     // Attiva S3
input ENUM_TIMEFRAMES   InpS3TF               = PERIOD_M30;// [L] Timeframe
input int               InpS3RangeBars        = 480;      // [L] Range di contesto (barre)
input int               InpS3BreakBars        = 60;       // [L] Canale di rottura (barre)
input double            InpS3EdgeThreshold    = 0.91;     // [T] Posizione nel range (trovato: plateau 0.91-0.93)
input int               InpS3AtrFast          = 14;       // [C] ATR veloce
input int               InpS3AtrSlow          = 50;       // [C] ATR lento (riferimento)
input double            InpS3VolExpandRatio   = 0.70;     // [T] Filtro espansione di fatto spento: non aggiunge nulla
input double            InpS3StopATR          = 2.0;      // [L] Stop loss in ATR (= 1R)
input double            InpS3TargetR          = 0.0;      // [T] Take profit in R (0 = nessuno; il 2.5R della card peggiora)
input double            InpS3TrailStartR      = 1.0;      // [C] Attiva trailing a +xR
input double            InpS3TrailATR         = 4.0;      // [T] Distanza trailing in ATR (trovato: plateau 3-6)
input bool              InpS3AllowShort       = true;     // [D] Consenti short

//==================================================================
//  STATO INTERNO
//==================================================================
CTrade   trade;

int      hS1Ema = INVALID_HANDLE, hS1Atr = INVALID_HANDLE;
int      hS2Ema = INVALID_HANDLE, hS2Atr = INVALID_HANDLE, hS2Regime = INVALID_HANDLE;
int      hS3AtrF = INVALID_HANDLE, hS3AtrS = INVALID_HANDLE;
int      hS4Atr  = INVALID_HANDLE;
int      hRiskAtr = INVALID_HANDLE;

datetime lastBarS1 = 0, lastBarS2 = 0, lastBarS3 = 0, lastBarS4 = 0;

// stato delle rotture in corso per S4
bool     s4UpActive = false, s4DnActive = false;
double   s4UpLevel = 0.0, s4UpExtreme = 0.0, s4DnLevel = 0.0, s4DnExtreme = 0.0;
int      s4UpBars = 0, s4DnBars = 0;

// memoria del rischio iniziale (1R) per ticket, per calcolare l'R corrente
// ring buffer a dimensione fissa: le posizioni concorrenti sono al massimo 3,
// 64 slot sono abbondanti e mantengono la ricerca O(1) anche su 4.000 trade
#define RISK_SLOTS 64
struct TradeRisk
  {
   ulong    ticket;
   double   riskDistance;   // distanza entry->SL iniziale, in prezzo
  };
TradeRisk g_risk[RISK_SLOTS];
int       g_riskIdx = 0;

//==================================================================
//  UTILITY
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
//  S4: chiusura forzata per durata massima
//------------------------------------------------------------------
void CloseExpiredS4()
  {
   if(InpS4MaxHoldBars <= 0) return;
   long   magic  = InpMagicBase + 4;
   long   maxSec = (long)InpS4MaxHoldBars * PeriodSeconds(InpS4TF);

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
//  STRATEGIA 1 - Time-Series Momentum (H1)
//  "24h return clears +0.5 ATR, the 100-EMA is rising,
//   price breaks the 24-bar high. Stop 2.5 ATR, trail from 1R."
//==================================================================
void RunS1()
  {
   long magic = InpMagicBase + 1;
   if(CountPositions(magic) >= InpMaxPosPerStrategy) return;

   double atr = IndValue(hS1Atr, 1);
   if(atr <= 0.0) return;

   double close1 = iClose(_Symbol, InpS1TF, 1);
   double closeN = iClose(_Symbol, InpS1TF, 1 + InpS1MomLookback);
   if(close1 <= 0.0 || closeN <= 0.0) return;

   double mom     = close1 - closeN;                       // ritorno a 24h
   double emaNow  = IndValue(hS1Ema, 1);
   double emaPrev = IndValue(hS1Ema, 1 + InpS1EmaSlopeBars);
   if(emaNow <= 0.0 || emaPrev <= 0.0) return;

   int idxH = iHighest(_Symbol, InpS1TF, MODE_HIGH, InpS1BreakoutBars, 2);
   int idxL = iLowest (_Symbol, InpS1TF, MODE_LOW,  InpS1BreakoutBars, 2);
   if(idxH < 0 || idxL < 0) return;
   double hiN = iHigh(_Symbol, InpS1TF, idxH);
   double loN = iLow (_Symbol, InpS1TF, idxL);

   bool longSignal  = (mom >  InpS1MomThresholdATR * atr) &&
                      (emaNow > emaPrev) &&
                      (close1 > hiN);

   bool shortSignal = InpS1AllowShort &&
                      (mom < -InpS1MomThresholdATR * atr) &&
                      (emaNow < emaPrev) &&
                      (close1 < loN);

   if(longSignal)  OpenTrade(magic, true,  InpS1StopATR * atr, 0.0, "S1-TSMOM", InpS1RiskMult);
   else if(shortSignal) OpenTrade(magic, false, InpS1StopATR * atr, 0.0, "S1-TSMOM", InpS1RiskMult);
  }

//==================================================================
//  STRATEGIA 2 - Trend-Following EMA (H1)
//  "Price crosses the fast EMA10 with the EMA slope confirming.
//   Exits on the opposite signal. Stop 2.0 ATR."
//==================================================================
void RunS2()
  {
   long magic = InpMagicBase + 2;

   double atr = IndValue(hS2Atr, 1);
   if(atr <= 0.0) return;

   double close1 = iClose(_Symbol, InpS2TF, 1);
   double close2 = iClose(_Symbol, InpS2TF, 2);
   double ema1   = IndValue(hS2Ema, 1);
   double ema2   = IndValue(hS2Ema, 2);
   double emaS   = IndValue(hS2Ema, 1 + InpS2SlopeBars);
   if(close1 <= 0.0 || close2 <= 0.0 || ema1 <= 0.0 || ema2 <= 0.0 || emaS <= 0.0) return;

   // pendenza normalizzata PER BARRA: rende la soglia indipendente da SlopeBars
   int    nBars    = MathMax(InpS2SlopeBars, 1);
   double slope    = (ema1 - emaS) / nBars;
   double slopeMin = InpS2SlopeMinATR * atr;

   bool crossUp   = (close2 <= ema2) && (close1 > ema1);
   bool crossDown = (close2 >= ema2) && (close1 < ema1);

   // filtro di regime opzionale (NON dichiarato nelle card: default disattivato)
   bool regimeLong = true, regimeShort = true;
   if(hS2Regime != INVALID_HANDLE)
     {
      double reg = IndValue(hS2Regime, 1);
      if(reg <= 0.0) return;
      regimeLong  = (close1 > reg);
      regimeShort = (close1 < reg);
     }

   bool longSignal  = crossUp   && (slope >  slopeMin) && regimeLong;
   bool shortSignal = crossDown && (slope < -slopeMin) && regimeShort && InpS2AllowShort;

   int dir = CurrentDirection(magic);

   // uscita sul segnale opposto.
   // Se InpS2ExitNeedsSlope, l'uscita richiede un segnale *qualificato*: senza
   // questa simmetria un incrocio debole chiude la posizione ben prima dello
   // stop, generando churn (perdita media ~0.3R invece di 1R).
   if(InpS2ExitOnOpposite)
     {
      bool exitLong  = InpS2ExitNeedsSlope ? (crossDown && slope < -slopeMin) : crossDown;
      bool exitShort = InpS2ExitNeedsSlope ? (crossUp   && slope >  slopeMin) : crossUp;
      if(dir > 0 && exitLong)  CloseAllForMagic(magic);
      if(dir < 0 && exitShort) CloseAllForMagic(magic);
      dir = CurrentDirection(magic);
     }

   if(CountPositions(magic) >= InpMaxPosPerStrategy) return;

   if(longSignal  && dir <= 0) OpenTrade(magic, true,  InpS2StopATR * atr, 0.0, "S2-EMA", InpS2RiskMult);
   else if(shortSignal && dir >= 0) OpenTrade(magic, false, InpS2StopATR * atr, 0.0, "S2-EMA", InpS2RiskMult);
  }

//==================================================================
//  STRATEGIA 3 - Donchian breakout + espansione di volatilita (M30)
//  "At the edge of the 480-bar range, breaks the 60-bar high/low
//   with volatility expanding. Stop 2.0 ATR, target 2.5R, trail."
//==================================================================
void RunS3()
  {
   long magic = InpMagicBase + 3;
   if(CountPositions(magic) >= InpMaxPosPerStrategy) return;

   double atrF = IndValue(hS3AtrF, 1);
   double atrS = IndValue(hS3AtrS, 1);
   if(atrF <= 0.0 || atrS <= 0.0) return;

   bool volExpanding = (atrF / atrS) >= InpS3VolExpandRatio;
   if(!volExpanding) return;

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

   double pos = (close1 - rangeLo) / (rangeHi - rangeLo);   // 0..1 nel range lungo

   bool longSignal  = (pos >= InpS3EdgeThreshold) && (close1 > breakHi);
   bool shortSignal = InpS3AllowShort &&
                      (pos <= (1.0 - InpS3EdgeThreshold)) && (close1 < breakLo);

   if(longSignal)  OpenTrade(magic, true,  InpS3StopATR * atrF, InpS3TargetR, "S3-DONCH", InpS3RiskMult);
   else if(shortSignal) OpenTrade(magic, false, InpS3StopATR * atrF, InpS3TargetR, "S3-DONCH", InpS3RiskMult);
  }

//==================================================================
//  STRATEGIA 4 - Fade del breakout fallito (M30)
//  Prende il lato opposto della rottura che manda in stop S3:
//  il prezzo esce dal canale a 60 barre e richiude dentro entro
//  poche barre, quindi chi ha comprato la rottura e' intrappolato.
//==================================================================
void RunS4()
  {
   long   magic = InpMagicBase + 4;
   double atr   = IndValue(hS4Atr, 1);
   if(atr <= 0.0) return;

   double c1 = iClose(_Symbol, InpS4TF, 1);
   double h1 = iHigh (_Symbol, InpS4TF, 1);
   double l1 = iLow  (_Symbol, InpS4TF, 1);
   if(c1 <= 0.0) return;

   bool canOpen = (CountPositions(magic) < InpMaxPosPerStrategy);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   // ---------------- rottura verso l'alto ----------------
   if(s4UpActive)
     {
      if(h1 > s4UpExtreme) s4UpExtreme = h1;
      s4UpBars++;
      if(c1 < s4UpLevel)                       // rientro: rottura fallita -> short
        {
         if(InpS4AllowShort && canOpen && bid > 0.0)
           {
            double stopPrice = s4UpExtreme + InpS4StopBufferATR * atr;
            double dist      = stopPrice - bid;
            if(dist > 0.0)
               OpenTrade(magic, false, dist, InpS4TargetR, "S4-FADE", InpS4RiskMult);
           }
         s4UpActive = false;
        }
      else if(s4UpBars >= InpS4ReentryBars) s4UpActive = false;
     }
   else
     {
      int ih = iHighest(_Symbol, InpS4TF, MODE_HIGH, InpS4BreakBars, 2);
      if(ih >= 0)
        {
         double lvl = iHigh(_Symbol, InpS4TF, ih);
         if(c1 > lvl) { s4UpActive = true; s4UpLevel = lvl; s4UpExtreme = h1; s4UpBars = 0; }
        }
     }

   // ---------------- rottura verso il basso ----------------
   if(s4DnActive)
     {
      if(l1 < s4DnExtreme) s4DnExtreme = l1;
      s4DnBars++;
      if(c1 > s4DnLevel)
        {
         if(InpS4AllowLong && canOpen && ask > 0.0)
           {
            double stopPrice = s4DnExtreme - InpS4StopBufferATR * atr;
            double dist      = ask - stopPrice;
            if(dist > 0.0)
               OpenTrade(magic, true, dist, InpS4TargetR, "S4-FADE", InpS4RiskMult);
           }
         s4DnActive = false;
        }
      else if(s4DnBars >= InpS4ReentryBars) s4DnActive = false;
     }
   else
     {
      int il = iLowest(_Symbol, InpS4TF, MODE_LOW, InpS4BreakBars, 2);
      if(il >= 0)
        {
         double lvl = iLow(_Symbol, InpS4TF, il);
         if(c1 < lvl) { s4DnActive = true; s4DnLevel = lvl; s4DnExtreme = l1; s4DnBars = 0; }
        }
     }
  }

//==================================================================
//  EVENTI
//==================================================================
int OnInit()
  {
   hS1Ema  = iMA (_Symbol, InpS1TF, InpS1EmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hS1Atr  = iATR(_Symbol, InpS1TF, InpS1AtrPeriod);
   hS2Ema  = iMA (_Symbol, InpS2TF, InpS2EmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hS2Atr  = iATR(_Symbol, InpS2TF, InpS2AtrPeriod);
   if(InpS2RegimeEmaPeriod > 0)
      hS2Regime = iMA(_Symbol, InpS2TF, InpS2RegimeEmaPeriod, 0, MODE_EMA, PRICE_CLOSE);
   hS3AtrF = iATR(_Symbol, InpS3TF, InpS3AtrFast);
   hS3AtrS = iATR(_Symbol, InpS3TF, InpS3AtrSlow);
   hS4Atr  = iATR(_Symbol, InpS4TF, InpS4AtrPeriod);
   hRiskAtr= iATR(_Symbol, InpRiskTF, InpRiskAtrPeriod);

   if(hS1Ema == INVALID_HANDLE || hS1Atr == INVALID_HANDLE ||
      hS2Ema == INVALID_HANDLE || hS2Atr == INVALID_HANDLE ||
      hS3AtrF == INVALID_HANDLE || hS3AtrS == INVALID_HANDLE || hS4Atr == INVALID_HANDLE ||
      hRiskAtr == INVALID_HANDLE)
     {
      Print("Errore nella creazione degli handle indicatori");
      return(INIT_FAILED);
     }

   if((ENUM_ACCOUNT_MARGIN_MODE)AccountInfoInteger(ACCOUNT_MARGIN_MODE)
      != ACCOUNT_MARGIN_MODE_RETAIL_HEDGING)
      Print("ATTENZIONE: conto NON hedging. Le 3 strategie si compenseranno a vicenda.");

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   for(int i = 0; i < RISK_SLOTS; i++) { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; }
   g_riskIdx = 0;
   return(INIT_SUCCEEDED);
  }

//------------------------------------------------------------------
//  Riepilogo per strategia a fine test.
//  Usa DEAL_MAGIC: attribuzione esatta, nessuna ricostruzione a posteriori.
//------------------------------------------------------------------
void PrintStrategySummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;

   string names[4] = {"S1-TSMOM", "S2-EMA  ", "S3-DONCH", "S4-FADE "};
   int    n[4]     = {0, 0, 0, 0};
   int    win[4]   = {0, 0, 0, 0};
   double gw[4]    = {0.0, 0.0, 0.0, 0.0};
   double gl[4]    = {0.0, 0.0, 0.0, 0.0};

   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;

      long   magic = HistoryDealGetInteger(tk, DEAL_MAGIC);
      int    idx   = (int)(magic - InpMagicBase) - 1;
      if(idx < 0 || idx > 3) continue;

      double net = HistoryDealGetDouble(tk, DEAL_PROFIT)
                 + HistoryDealGetDouble(tk, DEAL_COMMISSION)
                 + HistoryDealGetDouble(tk, DEAL_SWAP);

      n[idx]++;
      if(net > 0.0) { win[idx]++; gw[idx] += net; }
      else          { gl[idx] += net; }
     }

   PrintFormat("=== RIEPILOGO PER STRATEGIA ===");
   PrintFormat("%-9s %7s %7s %7s %11s %9s %9s", "strategia", "trade", "WR%", "PF", "P&L", "avgWin", "avgLoss");
   int totN = 0;
   for(int k = 0; k < 4; k++)
     {
      if(n[k] == 0) continue;
      totN += n[k];
      double wr = 100.0 * win[k] / n[k];
      double pf = (gl[k] != 0.0) ? gw[k] / MathAbs(gl[k]) : 0.0;
      double aw = (win[k] > 0) ? gw[k] / win[k] : 0.0;
      double al = (n[k] - win[k] > 0) ? gl[k] / (n[k] - win[k]) : 0.0;
      PrintFormat("%-9s %7d %7.1f %7.2f %11.2f %9.2f %9.2f",
                  names[k], n[k], wr, pf, gw[k] + gl[k], aw, al);
     }
   PrintFormat("trade totali: %d  (target card: 3864 su 2019.06-2026.09)", totN);
  }

void OnDeinit(const int reason)
  {
   PrintStrategySummary();
   IndicatorRelease(hS1Ema);  IndicatorRelease(hS1Atr);
   IndicatorRelease(hS2Ema);  IndicatorRelease(hS2Atr);
   if(hS2Regime != INVALID_HANDLE) IndicatorRelease(hS2Regime);
   IndicatorRelease(hS3AtrF); IndicatorRelease(hS3AtrS); IndicatorRelease(hS4Atr);
   IndicatorRelease(hRiskAtr);
  }

void OnTick()
  {
   // 1) gestione posizioni aperte: ad ogni tick
   ManageTrailing(InpMagicBase + 1, InpS1TrailStartR, InpS1TrailATR, hS1Atr,  InpS1StopATR);
   ManageTrailing(InpMagicBase + 3, InpS3TrailStartR, InpS3TrailATR, hS3AtrF, InpS3StopATR);
   CloseExpiredS4();
   WeekendGuard();

   // 2) segnali: solo alla chiusura di una barra del rispettivo TF
   bool newS1 = IsNewBar(InpS1TF, lastBarS1);
   bool newS2 = IsNewBar(InpS2TF, lastBarS2);
   bool newS3 = IsNewBar(InpS3TF, lastBarS3);
   bool newS4 = IsNewBar(InpS4TF, lastBarS4);

   if(!TradingAllowed()) return;

   if(InpS1Enabled && InpS1RiskMult > 0.0 && newS1) RunS1();
   if(InpS2Enabled && InpS2RiskMult > 0.0 && newS2) RunS2();
   if(InpS3Enabled && InpS3RiskMult > 0.0 && newS3) RunS3();
   if(InpS4Enabled && InpS4RiskMult > 0.0 && newS4) RunS4();
  }
//+------------------------------------------------------------------+
