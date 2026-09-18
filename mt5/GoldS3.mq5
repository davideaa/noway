//+------------------------------------------------------------------+
//|                                                     GoldS3.mq5   |
//|  Strategia 3 isolata: Donchian breakout + espansione di vola      |
//|                                                                  |
//|  Estratta da GoldMomentum3.mq5 senza modifiche alla logica: gli   |
//|  stessi calcoli di segnale, sizing, stop, target e trailing, in   |
//|  modo che i risultati siano confrontabili con il test combinato.  |
//|                                                                  |
//|  Regola ricostruita dalle card:                                   |
//|  "At the edge of the 480-bar range, breaks the 60-bar high/low     |
//|   with volatility expanding. Stop 2.0 ATR, target 2.5R, trail."   |
//|                                                                  |
//|  [L] = dichiarato nelle card   [C] = da calibrare   [D] = dedotto |
//|                                                                  |
//|  Conto HEDGING consigliato (non indispensabile con una sola       |
//|  strategia e una sola posizione per volta).                       |
//+------------------------------------------------------------------+
#property copyright "Ricostruzione a scopo di ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

//==================================================================
//  INPUT
//==================================================================
input group "=== Generale ==="
input long              InpMagic              = 993000;   // Magic number
input double            InpRiskPercent        = 0.6;      // [L] Rischio base per trade (% equity)
input int               InpMaxPositions       = 1;        // [C] Posizioni massime contemporanee
input int               InpSlippagePoints     = 30;       // Deviazione massima (points)
input int               InpMaxSpreadPoints    = 0;        // [C] Spread max in points (0 = filtro off)

input group "=== Adaptive Risk (sizing) ==="
input bool              InpUseAdaptiveRisk    = false;    // [L] Attiva Adaptive Risk (OFF per il test base)
input ENUM_TIMEFRAMES   InpRiskTF             = PERIOD_H1;// [C] TF per la misura di volatilita
input int               InpRiskAtrPeriod      = 14;       // [C] Periodo ATR corrente
input int               InpRiskBaselinePeriod = 200;      // [C] Finestra del "livello normale"
input double            InpRiskMultMin        = 0.5;      // [L] Moltiplicatore minimo
input double            InpRiskMultMax        = 2.0;      // [L] Moltiplicatore massimo

input group "=== Filtro orario (NON dichiarato nelle card) ==="
input bool              InpUseSessionFilter   = false;    // [C] Attiva filtro orario (server time)
input int               InpSessionStartHour   = 0;        // [C] Ora inizio (inclusa)
input int               InpSessionEndHour     = 24;       // [C] Ora fine (esclusa)

input group "=== S3: Donchian breakout + Volatilita ==="
input ENUM_TIMEFRAMES   InpTF                 = PERIOD_M30;// [L] Timeframe
input int               InpRangeBars          = 480;      // [L] Range di contesto (barre)
input int               InpBreakBars          = 60;       // [L] Canale di rottura (barre)
input double            InpEdgeThreshold      = 0.80;     // [C] Posizione nel range per dirsi "al bordo"
input int               InpAtrFast            = 14;       // [C] ATR veloce (dimensiona lo stop)
input int               InpAtrSlow            = 50;       // [C] ATR lento (riferimento)
input double            InpVolExpandRatio     = 1.00;     // [C] ATRfast/ATRslow minimo (espansione)
input double            InpStopATR            = 2.0;      // [L] Stop loss in ATR (= 1R)
input double            InpTargetR            = 2.5;      // [L] Take profit in R (0 = nessun target)
input double            InpTrailStartR        = 1.0;      // [C] Attiva trailing a +xR (0 = trailing off)
input double            InpTrailATR           = 2.0;      // [C] Distanza trailing in ATR
input bool              InpAllowLong          = true;     // [D] Consenti long
input bool              InpAllowShort         = true;     // [D] Consenti short

//==================================================================
//  STATO INTERNO
//==================================================================
CTrade   trade;
int      hAtrFast = INVALID_HANDLE, hAtrSlow = INVALID_HANDLE, hRiskAtr = INVALID_HANDLE;
datetime lastBar  = 0;

#define RISK_SLOTS 64
struct TradeRisk { ulong ticket; double riskDistance; };
TradeRisk g_risk[RISK_SLOTS];
int       g_riskIdx = 0;

//==================================================================
//  UTILITY
//==================================================================
double IndValue(const int handle, const int shift)
  {
   double buf[];
   ArraySetAsSeries(buf, true);
   if(handle == INVALID_HANDLE) return(0.0);
   if(CopyBuffer(handle, 0, shift, 1, buf) < 1) return(0.0);
   return(buf[0]);
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
   return(fallback);
  }

int CountPositions()
  {
   int c = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      c++;
     }
   return(c);
  }

//------------------------------------------------------------------
//  Adaptive Risk
//------------------------------------------------------------------
double EffectiveRiskPercent()
  {
   if(!InpUseAdaptiveRisk) return(InpRiskPercent);

   double atrNow = IndValue(hRiskAtr, 1);
   if(atrNow <= 0.0) return(InpRiskPercent);

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
//  Sizing
//------------------------------------------------------------------
double LotsFromRisk(const double stopDistance)
  {
   if(stopDistance <= 0.0) return(0.0);

   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * EffectiveRiskPercent() / 100.0;
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0.0 || tickSize <= 0.0) return(0.0);

   double lossPerLot = (stopDistance / tickSize) * tickValue;
   if(lossPerLot <= 0.0) return(0.0);

   double lots    = riskMoney / lossPerLot;
   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(stepLot <= 0.0) stepLot = 0.01;

   lots = MathFloor(lots / stepLot) * stepLot;
   if(lots < minLot) return(0.0);
   if(lots > maxLot) lots = maxLot;
   return(NormalizeDouble(lots, 2));
  }

double EnforceStopsLevel(const double price, const double sl, const bool isLong)
  {
   long   stopsLvl = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double minDist  = stopsLvl * _Point;
   if(minDist <= 0.0) return(sl);
   if(isLong  && (price - sl) < minDist) return(price - minDist);
   if(!isLong && (sl - price) < minDist) return(price + minDist);
   return(sl);
  }

bool TradingAllowed()
  {
   if(InpMaxSpreadPoints > 0 &&
      SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) > InpMaxSpreadPoints) return(false);

   if(InpUseSessionFilter)
     {
      MqlDateTime dt;
      TimeToStruct(TimeCurrent(), dt);
      if(dt.hour < InpSessionStartHour || dt.hour >= InpSessionEndHour) return(false);
     }
   return(true);
  }

//------------------------------------------------------------------
//  Apertura
//------------------------------------------------------------------
bool OpenTrade(const bool isLong, const double stopDist)
  {
   if(stopDist <= 0.0) return(false);

   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl = isLong ? price - stopDist : price + stopDist;
   sl = EnforceStopsLevel(price, sl, isLong);

   double realRisk = MathAbs(price - sl);
   double tp = 0.0;
   if(InpTargetR > 0.0)
      tp = isLong ? price + InpTargetR * realRisk : price - InpTargetR * realRisk;

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);
   if(tp > 0.0) tp = NormalizeDouble(tp, digits);

   double lots = LotsFromRisk(realRisk);
   if(lots <= 0.0) return(false);

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippagePoints);

   bool ok = isLong ? trade.Buy(lots, _Symbol, 0.0, sl, tp, "S3-DONCH")
                    : trade.Sell(lots, _Symbol, 0.0, sl, tp, "S3-DONCH");
   if(ok)
     {
      ulong posTicket = trade.ResultOrder();
      if(posTicket > 0) RememberRisk(posTicket, realRisk);
     }
   return(ok);
  }

//------------------------------------------------------------------
//  Trailing
//------------------------------------------------------------------
void ManageTrailing()
  {
   if(InpTrailStartR <= 0.0 || InpTrailATR <= 0.0) return;

   double atr = IndValue(hAtrFast, 0);
   if(atr <= 0.0) return;
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;

      bool   isLong = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY);
      double entry  = PositionGetDouble(POSITION_PRICE_OPEN);
      double curSL  = PositionGetDouble(POSITION_SL);
      double curTP  = PositionGetDouble(POSITION_TP);
      double price  = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                             : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      double oneR = RecallRisk(tk, atr * InpStopATR);
      if(oneR <= 0.0) continue;

      double profitR = (isLong ? (price - entry) : (entry - price)) / oneR;
      if(profitR < InpTrailStartR) continue;

      double newSL = isLong ? price - InpTrailATR * atr : price + InpTrailATR * atr;
      newSL = EnforceStopsLevel(price, newSL, isLong);
      newSL = NormalizeDouble(newSL, digits);

      if(isLong  && (curSL > 0.0 && newSL <= curSL)) continue;
      if(!isLong && (curSL > 0.0 && newSL >= curSL)) continue;

      trade.SetExpertMagicNumber(InpMagic);
      trade.PositionModify(tk, newSL, curTP);
     }
  }

//------------------------------------------------------------------
//  Segnale
//------------------------------------------------------------------
void RunSignal()
  {
   if(CountPositions() >= InpMaxPositions) return;

   double atrF = IndValue(hAtrFast, 1);
   double atrS = IndValue(hAtrSlow, 1);
   if(atrF <= 0.0 || atrS <= 0.0) return;

   if((atrF / atrS) < InpVolExpandRatio) return;        // volatilita non in espansione

   double close1 = iClose(_Symbol, InpTF, 1);
   if(close1 <= 0.0) return;

   int idxRH = iHighest(_Symbol, InpTF, MODE_HIGH, InpRangeBars, 2);
   int idxRL = iLowest (_Symbol, InpTF, MODE_LOW,  InpRangeBars, 2);
   int idxBH = iHighest(_Symbol, InpTF, MODE_HIGH, InpBreakBars, 2);
   int idxBL = iLowest (_Symbol, InpTF, MODE_LOW,  InpBreakBars, 2);
   if(idxRH < 0 || idxRL < 0 || idxBH < 0 || idxBL < 0) return;

   double rangeHi = iHigh(_Symbol, InpTF, idxRH);
   double rangeLo = iLow (_Symbol, InpTF, idxRL);
   double breakHi = iHigh(_Symbol, InpTF, idxBH);
   double breakLo = iLow (_Symbol, InpTF, idxBL);
   if(rangeHi <= rangeLo) return;

   double pos = (close1 - rangeLo) / (rangeHi - rangeLo);   // 0..1 nel range lungo

   bool longSignal  = InpAllowLong  && (pos >= InpEdgeThreshold)         && (close1 > breakHi);
   bool shortSignal = InpAllowShort && (pos <= (1.0 - InpEdgeThreshold)) && (close1 < breakLo);

   if(longSignal)       OpenTrade(true,  InpStopATR * atrF);
   else if(shortSignal) OpenTrade(false, InpStopATR * atrF);
  }

//------------------------------------------------------------------
//  Riepilogo a fine test (attribuzione esatta via DEAL_MAGIC)
//------------------------------------------------------------------
void PrintSummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;

   int n = 0, win = 0;
   double gw = 0.0, gl = 0.0;

   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_MAGIC) != InpMagic) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;

      double net = HistoryDealGetDouble(tk, DEAL_PROFIT)
                 + HistoryDealGetDouble(tk, DEAL_COMMISSION)
                 + HistoryDealGetDouble(tk, DEAL_SWAP);
      n++;
      if(net > 0.0) { win++; gw += net; } else { gl += net; }
     }
   if(n == 0) { Print("=== S3: nessun trade ==="); return; }

   double wr = 100.0 * win / n;
   double pf = (gl != 0.0) ? gw / MathAbs(gl) : 0.0;
   double aw = (win > 0) ? gw / win : 0.0;
   double al = (n - win > 0) ? gl / (n - win) : 0.0;
   double expR = (al != 0.0) ? (gw + gl) / (MathAbs(al) * n) : 0.0;

   PrintFormat("=== S3 DONCHIAN - RIEPILOGO ===");
   PrintFormat("trade %d | WR %.1f%% | PF %.2f | P&L %.2f", n, wr, pf, gw + gl);
   PrintFormat("avgWin %.2f | avgLoss %.2f | expectancy %+.3f R/trade", aw, al, expR);
   PrintFormat("riferimento test combinato: 709 trade, WR 52.8%%, PF 1.49, +0.491 R");
  }

//==================================================================
//  EVENTI
//==================================================================
int OnInit()
  {
   hAtrFast = iATR(_Symbol, InpTF, InpAtrFast);
   hAtrSlow = iATR(_Symbol, InpTF, InpAtrSlow);
   hRiskAtr = iATR(_Symbol, InpRiskTF, InpRiskAtrPeriod);

   if(hAtrFast == INVALID_HANDLE || hAtrSlow == INVALID_HANDLE || hRiskAtr == INVALID_HANDLE)
     {
      Print("Errore nella creazione degli handle ATR");
      return(INIT_FAILED);
     }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   for(int i = 0; i < RISK_SLOTS; i++) { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; }
   g_riskIdx = 0;
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PrintSummary();
   IndicatorRelease(hAtrFast);
   IndicatorRelease(hAtrSlow);
   IndicatorRelease(hRiskAtr);
  }

void OnTick()
  {
   ManageTrailing();

   datetime t = iTime(_Symbol, InpTF, 0);
   if(t == 0 || t == lastBar) return;
   lastBar = t;

   if(!TradingAllowed()) return;
   RunSignal();
  }
//+------------------------------------------------------------------+
