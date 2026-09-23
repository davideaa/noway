//+------------------------------------------------------------------+
//|                                            FxTrendPullback.mq5   |
//|                                                                  |
//|  FOREX 1 — Ingresso sul ritracciamento dentro il trend (H1)       |
//|                                                                  |
//|  DA DOVE VIENE                                                    |
//|  Dieci operazioni USDJPY H1 viste in una foto (agosto-settembre   |
//|  2026): long e short, ingressi dopo una piccola correzione dentro |
//|  il movimento, vincite chiuse a orari qualunque (un target), le   |
//|  due perdite chiuse all'ora tonda (un'uscita a tempo), lotti che  |
//|  cambiano 5 volte (stop sul minimo/massimo, non fisso). Dieci     |
//|  operazioni non dimostrano niente: servono solo a dare la forma   |
//|  dell'ingresso. La struttura e' quella di GoldTrendPullback, gia' |
//|  provata sull'oro e diventata il RITRACCIAMENTO di V1XAU.          |
//|                                                                  |
//|  IPOTESI, scritta prima di qualunque test:                        |
//|  le coppie col yen si muovono a ondate (differenziale dei tassi,  |
//|  interventi, carry che entra ed esce). Dentro un'ondata il prezzo |
//|  riparte dopo una correzione piu' spesso di quanto la continui.   |
//|  Chi perde: chi vende la correzione pensando all'inversione, e    |
//|  chi compra il massimo e viene stoppato dal ritracciamento.       |
//|  L'edge deve esserci da tutte e due le parti: se vive solo sui    |
//|  long, e' il rialzo di USDJPY 2021-2024, non la regola.           |
//|                                                                  |
//|  REGOLE (long; short speculare)                                   |
//|  1. trend su: chiusura sopra l'EMA e EMA in salita                |
//|  2. massimo recente su InpSwingBars barre, alle spalle            |
//|  3. ritracciamento di almeno InpPullbackATR ATR da quel massimo   |
//|  4. ripartenza: la barra chiude sopra il massimo della precedente |
//|  5. stop sotto il minimo del ritracciamento, meno un buffer       |
//|  6. uscita: target in ATR, oppure dopo InpMaxBars barre           |
//|     (le uscite si ottimizzano DOPO, e si contano nel K)           |
//|                                                                  |
//|  NESSUN FILTRO SU ORE O GIORNI (regola del progetto).             |
//|                                                                  |
//|  PROTOCOLLO E CRITERI: docs/fx-pullback.md, scritti prima.        |
//|  Costruzione fino al 2023-12-31. Il 2024.01-2026.09 resta         |
//|  congelato e si guarda una volta sola.                            |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

input group "=== Generale ==="
input long              InpMagic            = 997100;    // Magic number
input double            InpRiskPercent      = 1.0;       // Rischio per trade (% equity)
input int               InpMaxPositions     = 1;         // Posizioni massime
input int               InpSlippagePoints   = 30;        // Deviazione massima

input group "=== Regime: quando c'e' un trend ==="
input ENUM_TIMEFRAMES   InpTF               = PERIOD_H1; // Timeframe
input int               InpTrendEma         = 100;       // <<< Periodo EMA di trend
input int               InpEmaSlopeBars     = 3;         // Barre per misurare la pendenza
input int               InpAtrPeriod        = 14;        // Periodo ATR

input group "=== Il ritracciamento ==="
input int               InpSwingBars        = 20;        // Barre per il massimo/minimo recente
input double            InpPullbackATR      = 1.0;       // <<< Ritracciamento minimo, in ATR
input int               InpCooldownBars     = 3;         // Barre di attesa dopo un ingresso

input group "=== Gestione ==="
input double            InpStopBufferATR    = 0.30;      // <<< Stop oltre il minimo, in ATR
input double            InpTargetATR        = 2.0;       // <<< Target in ATR dall'ingresso (0 = nessuno)
input int               InpMaxBars          = 24;        // <<< Chiude dopo N barre (0 = mai)
input double            InpTrailStartR      = 0.0;       // Trailing: attiva a +xR (0 = spento)
input double            InpTrailATR         = 3.0;       // Distanza trailing in ATR
input bool              InpAllowLong        = true;      // Consenti long
input bool              InpAllowShort       = true;      // Consenti short

//==================================================================
CTrade   trade;
int      hEma = INVALID_HANDLE, hAtr = INVALID_HANDLE;
datetime lastBar = 0;
datetime lastEntryBar = 0;

// Il trailing ha bisogno della distanza di stop iniziale (1R) di ogni
// posizione: l'ATR al momento dell'apertura non e' recuperabile dopo.
#define RISK_SLOTS 32
struct TradeRisk { ulong ticket; double riskDistance; };
TradeRisk g_risk[RISK_SLOTS];
int       g_riskIdx = 0;

//==================================================================
double IndValue(const int h, const int shift)
  {
   double b[];
   ArraySetAsSeries(b, true);
   if(h == INVALID_HANDLE) return(0.0);
   if(CopyBuffer(h, 0, shift, 1, b) < 1) return(0.0);
   return(b[0]);
  }

void RememberRisk(const ulong ticket, const double dist)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) { g_risk[i].riskDistance = dist; return; }
   g_risk[g_riskIdx].ticket = ticket;
   g_risk[g_riskIdx].riskDistance = dist;
   g_riskIdx = (g_riskIdx + 1) % RISK_SLOTS;
  }

double RecallRisk(const ulong ticket, const double fallback)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket && g_risk[i].riskDistance > 0.0)
         return(g_risk[i].riskDistance);
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

double LotsFromRisk(const double stopDistance)
  {
   if(stopDistance <= 0.0) return(0.0);
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPercent / 100.0;
   double tv = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double ts = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tv <= 0.0 || ts <= 0.0) return(0.0);

   double lossPerLot = (stopDistance / ts) * tv;
   if(lossPerLot <= 0.0) return(0.0);

   double lots = riskMoney / lossPerLot;
   double mn   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double mx   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
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

bool OpenPullback(const bool isLong, const double stopPrice)
  {
   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl   = EnforceStopsLevel(price, stopPrice, isLong);
   double risk = MathAbs(price - sl);
   if(risk <= 0.0) return(false);

   int dg = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, dg);

   double lots = LotsFromRisk(risk);
   if(lots <= 0.0) return(false);

   double tp = 0.0;
   double atr = IndValue(hAtr, 1);
   if(InpTargetATR > 0.0 && atr > 0.0)
      tp = NormalizeDouble(isLong ? price + InpTargetATR * atr : price - InpTargetATR * atr, dg);

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippagePoints);

   bool ok = isLong ? trade.Buy (lots, _Symbol, 0.0, sl, tp, "FXPB-L")
                    : trade.Sell(lots, _Symbol, 0.0, sl, tp, "FXPB-S");
   if(ok)
     {
      ulong posTicket = trade.ResultOrder();
      if(posTicket > 0) RememberRisk(posTicket, risk);
      lastEntryBar = iTime(_Symbol, InpTF, 0);
     }
   return(ok);
  }

//------------------------------------------------------------------
//  Trailing: attivato dopo +xR, distanza in ATR dal prezzo corrente.
//  La distanza deve essere 1,5-3 volte quella di stop: con trailing
//  uguale allo stop i vincitori vengono amputati (gia' misurato).
//------------------------------------------------------------------
void ManageTrailing()
  {
   if(InpTrailStartR <= 0.0 || InpTrailATR <= 0.0) return;

   double atr = IndValue(hAtr, 1);
   if(atr <= 0.0) return;
   int dg = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;

      bool   isLong = (PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY);
      double entry  = PositionGetDouble(POSITION_PRICE_OPEN);
      double price  = PositionGetDouble(POSITION_PRICE_CURRENT);
      double curSL  = PositionGetDouble(POSITION_SL);

      double oneR = RecallRisk(tk, atr);
      if(oneR <= 0.0) continue;

      double profitR = (isLong ? (price - entry) : (entry - price)) / oneR;
      if(profitR < InpTrailStartR) continue;

      double newSL = isLong ? price - InpTrailATR * atr : price + InpTrailATR * atr;
      newSL = EnforceStopsLevel(price, newSL, isLong);
      newSL = NormalizeDouble(newSL, dg);

      if(isLong  && (curSL > 0.0 && newSL <= curSL)) continue;
      if(!isLong && (curSL > 0.0 && newSL >= curSL)) continue;

      trade.SetExpertMagicNumber(InpMagic);
      trade.PositionModify(tk, newSL, PositionGetDouble(POSITION_TP));
     }
  }

//------------------------------------------------------------------
//  Uscita a tempo: se dopo InpMaxBars barre ne' target ne' stop sono
//  stati toccati, si chiude. Nella foto le due perdite chiudono all'ora
//  tonda: e' questo.
//------------------------------------------------------------------
void ManageTimeExit()
  {
   if(InpMaxBars <= 0) return;
   long limit = (long)InpMaxBars * PeriodSeconds(InpTF);
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      if((long)(TimeCurrent() - (datetime)PositionGetInteger(POSITION_TIME)) >= limit)
        {
         trade.SetExpertMagicNumber(InpMagic);
         trade.PositionClose(tk);
        }
     }
  }

//------------------------------------------------------------------
void OnNewBar()
  {
   ManageTimeExit();
   if(CountPositions() >= InpMaxPositions) return;

   // attesa dopo un ingresso: senza, dopo uno stop si rientrerebbe
   // sulla barra successiva dello stesso ritracciamento
   if(InpCooldownBars > 0 && lastEntryBar > 0)
     {
      long elapsed = (long)(iTime(_Symbol, InpTF, 0) - lastEntryBar);
      if(elapsed < (long)InpCooldownBars * PeriodSeconds(InpTF)) return;
     }

   double atr  = IndValue(hAtr, 1);
   double ema1 = IndValue(hEma, 1);
   double emaN = IndValue(hEma, 1 + InpEmaSlopeBars);
   if(atr <= 0.0 || ema1 <= 0.0 || emaN <= 0.0) return;

   double slope = (ema1 - emaN) / InpEmaSlopeBars;

   double c1 = iClose(_Symbol, InpTF, 1);
   double h2 = iHigh (_Symbol, InpTF, 2);
   double l2 = iLow  (_Symbol, InpTF, 2);
   if(c1 <= 0.0 || h2 <= 0.0) return;

   // ---------------- LONG ----------------
   if(InpAllowLong && c1 > ema1 && slope > 0.0)
     {
      // idxH >= 2: il massimo deve essere alle spalle. Se fosse la barra
      // appena chiusa non ci sarebbe nessun ritracciamento da comprare,
      // solo una candela grande - ed e' il terreno di S3.
      int idxH = iHighest(_Symbol, InpTF, MODE_HIGH, InpSwingBars, 1);
      if(idxH >= 2)
        {
         double swingHigh = iHigh(_Symbol, InpTF, idxH);

         // minimo toccato DOPO il massimo recente: e' il ritracciamento
         int idxL = iLowest(_Symbol, InpTF, MODE_LOW, idxH, 1);
         if(idxL >= 1)
           {
            double pullLow = iLow(_Symbol, InpTF, idxL);
            double depth   = swingHigh - pullLow;

            bool deepEnough = (depth >= InpPullbackATR * atr);
            bool notAtHigh  = (c1 < swingHigh);          // non e' un nuovo estremo: S3 non entrerebbe qui
            bool resuming   = (c1 > h2);                 // ripartenza nella direzione del trend

            if(deepEnough && notAtHigh && resuming)
              {
               if(OpenPullback(true, pullLow - InpStopBufferATR * atr)) return;
              }
           }
        }
     }

   // ---------------- SHORT ----------------
   if(InpAllowShort && c1 < ema1 && slope < 0.0)
     {
      int idxL = iLowest(_Symbol, InpTF, MODE_LOW, InpSwingBars, 1);
      if(idxL >= 2)
        {
         double swingLow = iLow(_Symbol, InpTF, idxL);

         int idxH = iHighest(_Symbol, InpTF, MODE_HIGH, idxL, 1);
         if(idxH >= 1)
           {
            double pullHigh = iHigh(_Symbol, InpTF, idxH);
            double depth    = pullHigh - swingLow;

            bool deepEnough = (depth >= InpPullbackATR * atr);
            bool notAtLow   = (c1 > swingLow);
            bool resuming   = (c1 < l2);

            if(deepEnough && notAtLow && resuming)
               OpenPullback(false, pullHigh + InpStopBufferATR * atr);
           }
        }
     }
  }

//==================================================================
void PrintSummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;
   int n = 0, w = 0, nl = 0, ns = 0;
   double gw = 0.0, gl = 0.0, best = 0.0, worst = 0.0;

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
      if(net > best)  best  = net;
      if(net < worst) worst = net;
     }
   if(n == 0) { Print("=== FX PULLBACK: nessun trade ==="); return; }

   double pf = (gl != 0.0) ? gw / MathAbs(gl) : 0.0;
   double al = (n - w > 0) ? gl / (n - w) : 0.0;
   PrintFormat("=== FX PULLBACK NEL TREND (%s) ===", EnumToString(InpTF));
   PrintFormat("trade %d (%d long / %d short) | WR %.1f%% | PF %.2f | P&L %.2f",
               n, nl, ns, 100.0 * w / n, pf, gw + gl);
   PrintFormat("migliore %+.2f | peggiore %+.2f", best, worst);
   if(al != 0.0)
      PrintFormat("expectancy %+.3f R/trade", (gw + gl) / (MathAbs(al) * n));
  }

double OnTester() { PrintSummary(); return(AccountInfoDouble(ACCOUNT_BALANCE)); }

int OnInit()
  {
   hEma = iMA (_Symbol, InpTF, InpTrendEma, 0, MODE_EMA, PRICE_CLOSE);
   hAtr = iATR(_Symbol, InpTF, InpAtrPeriod);
   if(hEma == INVALID_HANDLE || hAtr == INVALID_HANDLE)
     { Print("handle indicatore non creato"); return(INIT_FAILED); }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   for(int i = 0; i < RISK_SLOTS; i++) { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; }
   g_riskIdx = 0;
   lastBar = 0; lastEntryBar = 0;
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PrintSummary();
   IndicatorRelease(hEma);
   IndicatorRelease(hAtr);
  }

void OnTick()
  {
   ManageTrailing();
   datetime t = iTime(_Symbol, InpTF, 0);
   if(t == 0 || t == lastBar) return;
   lastBar = t;
   OnNewBar();
  }
//+------------------------------------------------------------------+
