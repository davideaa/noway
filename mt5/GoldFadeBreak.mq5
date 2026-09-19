//+------------------------------------------------------------------+
//|                                              GoldFadeBreak.mq5   |
//|                                                                  |
//|  CANDIDATA 4 — Fade del breakout fallito (XAUUSD, M30)            |
//|                                                                  |
//|  IPOTESI, scritta prima di qualunque test:                        |
//|  sopra un massimo evidente si accumulano stop e ordini stop-buy.  |
//|  Quando il prezzo li raggiunge la liquidita' viene consumata in   |
//|  un colpo; se non arriva domanda reale il prezzo rientra e chi ha |
//|  comprato la rottura resta intrappolato e deve uscire, spingendo  |
//|  nella direzione opposta.                                         |
//|                                                                  |
//|  Prende il lato opposto dello STESSO evento che manda in stop S3: |
//|  l'anticorrelazione e' meccanica, non sperata.                    |
//|                                                                  |
//|  REGOLE                                                           |
//|  1. il prezzo chiude sopra il massimo a 60 barre (trigger di S3)  |
//|  2. entro N barre richiude sotto quel livello                     |
//|  3. -> short a mercato, stop sopra l'estremo toccato, target in R  |
//|  4. uscita forzata dopo un numero massimo di barre                |
//|  Speculare per i minimi.                                          |
//|                                                                  |
//|  PROTOCOLLO: sviluppo e ottimizzazione SOLO su 2019.06-2023.12.   |
//|  Il 2024.01-2026.09 resta congelato e si guarda una volta sola.   |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

input group "=== Generale ==="
input long              InpMagic            = 994000;    // Magic number
input double            InpRiskPercent      = 0.6;       // Rischio per trade (% equity)
input int               InpMaxPositions     = 1;         // Posizioni massime
input int               InpSlippagePoints   = 30;        // Deviazione massima

input group "=== Rilevamento della rottura fallita ==="
input ENUM_TIMEFRAMES   InpTF               = PERIOD_M30;// Timeframe
input int               InpBreakBars        = 60;        // Canale rotto (= trigger di S3)
input int               InpReentryBars      = 3;         // <<< Barre entro cui deve rientrare
input int               InpAtrPeriod        = 14;        // Periodo ATR

input group "=== Filtri opzionali (0 = disattivato) ==="
input int               InpRangeBars        = 480;       // Range di contesto
input double            InpEdgeThreshold    = 0.0;       // Rottura solo al bordo del range (0 = ovunque)
input double            InpMaxVolRatio      = 0.0;       // ATRfast/ATRslow massimo (0 = off)
input int               InpAtrSlow          = 50;        // ATR lento per il filtro sopra

input group "=== Gestione ==="
input double            InpStopBufferATR    = 0.5;       // Buffer dello stop sopra l'estremo
input double            InpTargetR          = 2.0;       // <<< Take profit in R
input int               InpMaxHoldBars      = 48;        // Uscita forzata dopo N barre
input bool              InpAllowLong        = true;      // Fade dei minimi rotti
input bool              InpAllowShort       = true;      // Fade dei massimi rotti

//==================================================================
CTrade   trade;
int      hAtrFast = INVALID_HANDLE, hAtrSlow = INVALID_HANDLE;
datetime lastBar  = 0;

// stato delle due rotture in corso
bool     upActive = false, dnActive = false;
double   upLevel = 0.0, upExtreme = 0.0;
double   dnLevel = 0.0, dnExtreme = 0.0;
int      upBars = 0, dnBars = 0;

//==================================================================
double IndValue(const int h, const int shift)
  {
   double b[];
   ArraySetAsSeries(b, true);
   if(h == INVALID_HANDLE) return(0.0);
   if(CopyBuffer(h, 0, shift, 1, b) < 1) return(0.0);
   return(b[0]);
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

double LotsFromRisk(const double stopDistance)
  {
   if(stopDistance <= 0.0) return(0.0);
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPercent / 100.0;
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tv <= 0.0 || ts <= 0.0) return(0.0);

   double lossPerLot = (stopDistance / ts) * tv;
   if(lossPerLot <= 0.0) return(0.0);

   double lots  = riskMoney / lossPerLot;
   double mn    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double mx    = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(step <= 0.0) step = 0.01;

   lots = MathFloor(lots / step) * step;
   if(lots < mn) return(0.0);
   if(lots > mx) lots = mx;
   return(NormalizeDouble(lots, 2));
  }

double EnforceStopsLevel(const double price, const double sl, const bool isLong)
  {
   long   lvl = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double d   = lvl * _Point;
   if(d <= 0.0) return(sl);
   if(isLong  && (price - sl) < d) return(price - d);
   if(!isLong && (sl - price) < d) return(price + d);
   return(sl);
  }

bool OpenFade(const bool isLong, const double stopPrice)
  {
   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl = EnforceStopsLevel(price, stopPrice, isLong);
   double risk = MathAbs(price - sl);
   if(risk <= 0.0) return(false);

   double tp = 0.0;
   if(InpTargetR > 0.0)
      tp = isLong ? price + InpTargetR * risk : price - InpTargetR * risk;

   int dg = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, dg);
   if(tp > 0.0) tp = NormalizeDouble(tp, dg);

   double lots = LotsFromRisk(risk);
   if(lots <= 0.0) return(false);

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippagePoints);
   return(isLong ? trade.Buy(lots, _Symbol, 0.0, sl, tp, "FADE-LONG")
                 : trade.Sell(lots, _Symbol, 0.0, sl, tp, "FADE-SHORT"));
  }

// uscita forzata: il mean reversion non deve restare appeso
void CloseExpired()
  {
   if(InpMaxHoldBars <= 0) return;
   long maxSec = (long)InpMaxHoldBars * PeriodSeconds(InpTF);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      if(TimeCurrent() - (datetime)PositionGetInteger(POSITION_TIME) >= maxSec)
        {
         trade.SetExpertMagicNumber(InpMagic);
         trade.PositionClose(tk);
        }
     }
  }

//------------------------------------------------------------------
//  Macchina a stati: rileva la rottura, poi il rientro
//------------------------------------------------------------------
void OnNewBar()
  {
   double atrF = IndValue(hAtrFast, 1);
   if(atrF <= 0.0) return;

   double c1 = iClose(_Symbol, InpTF, 1);
   double h1 = iHigh (_Symbol, InpTF, 1);
   double l1 = iLow  (_Symbol, InpTF, 1);
   if(c1 <= 0.0) return;

   // ---- filtro opzionale sulla volatilita'
   if(InpMaxVolRatio > 0.0)
     {
      double atrS = IndValue(hAtrSlow, 1);
      if(atrS <= 0.0) return;
      if(atrF / atrS > InpMaxVolRatio) { upActive = false; dnActive = false; return; }
     }

   // ---- posizione nel range, per il filtro opzionale sul bordo
   double pos = 0.5;
   if(InpEdgeThreshold > 0.0)
     {
      int ih = iHighest(_Symbol, InpTF, MODE_HIGH, InpRangeBars, 2);
      int il = iLowest (_Symbol, InpTF, MODE_LOW,  InpRangeBars, 2);
      if(ih < 0 || il < 0) return;
      double rh = iHigh(_Symbol, InpTF, ih), rl = iLow(_Symbol, InpTF, il);
      if(rh <= rl) return;
      pos = (c1 - rl) / (rh - rl);
     }

   // ================= rottura verso l'alto =================
   if(upActive)
     {
      if(h1 > upExtreme) upExtreme = h1;
      upBars++;
      if(c1 < upLevel)                                  // rientro: la rottura e' fallita
        {
         if(InpAllowShort && CountPositions() < InpMaxPositions)
            OpenFade(false, upExtreme + InpStopBufferATR * atrF);
         upActive = false;
        }
      else if(upBars >= InpReentryBars) upActive = false;   // rottura confermata: nessun fade
     }
   else
     {
      int ih = iHighest(_Symbol, InpTF, MODE_HIGH, InpBreakBars, 2);
      if(ih >= 0)
        {
         double lvl = iHigh(_Symbol, InpTF, ih);
         bool edgeOk = (InpEdgeThreshold <= 0.0) || (pos >= InpEdgeThreshold);
         if(c1 > lvl && edgeOk)
           { upActive = true; upLevel = lvl; upExtreme = h1; upBars = 0; }
        }
     }

   // ================= rottura verso il basso =================
   if(dnActive)
     {
      if(l1 < dnExtreme) dnExtreme = l1;
      dnBars++;
      if(c1 > dnLevel)
        {
         if(InpAllowLong && CountPositions() < InpMaxPositions)
            OpenFade(true, dnExtreme - InpStopBufferATR * atrF);
         dnActive = false;
        }
      else if(dnBars >= InpReentryBars) dnActive = false;
     }
   else
     {
      int il = iLowest(_Symbol, InpTF, MODE_LOW, InpBreakBars, 2);
      if(il >= 0)
        {
         double lvl = iLow(_Symbol, InpTF, il);
         bool edgeOk = (InpEdgeThreshold <= 0.0) || (pos <= (1.0 - InpEdgeThreshold));
         if(c1 < lvl && edgeOk)
           { dnActive = true; dnLevel = lvl; dnExtreme = l1; dnBars = 0; }
        }
     }
  }

//==================================================================
void PrintSummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;
   int n = 0, w = 0, nl = 0, ns = 0;
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
      if(HistoryDealGetInteger(tk, DEAL_TYPE) == DEAL_TYPE_BUY) ns++; else nl++;
      if(net > 0.0) { w++; gw += net; } else gl += net;
     }
   if(n == 0) { Print("=== FADE: nessun trade ==="); return; }

   double pf = (gl != 0.0) ? gw / MathAbs(gl) : 0.0;
   double al = (n - w > 0) ? gl / (n - w) : 0.0;
   PrintFormat("=== FADE DEL BREAKOUT FALLITO ===");
   PrintFormat("trade %d (%d long / %d short) | WR %.1f%% | PF %.2f | P&L %.2f",
               n, nl, ns, 100.0 * w / n, pf, gw + gl);
   if(al != 0.0)
      PrintFormat("expectancy %+.3f R/trade", (gw + gl) / (MathAbs(al) * n));
  }

double OnTester() { PrintSummary(); return(AccountInfoDouble(ACCOUNT_BALANCE)); }

int OnInit()
  {
   hAtrFast = iATR(_Symbol, InpTF, InpAtrPeriod);
   hAtrSlow = iATR(_Symbol, InpTF, InpAtrSlow);
   if(hAtrFast == INVALID_HANDLE || hAtrSlow == INVALID_HANDLE)
     { Print("handle ATR non creato"); return(INIT_FAILED); }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);
   upActive = false; dnActive = false; lastBar = 0;
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PrintSummary();
   IndicatorRelease(hAtrFast);
   IndicatorRelease(hAtrSlow);
  }

void OnTick()
  {
   CloseExpired();
   datetime t = iTime(_Symbol, InpTF, 0);
   if(t == 0 || t == lastBar) return;
   lastBar = t;
   OnNewBar();
  }
//+------------------------------------------------------------------+
