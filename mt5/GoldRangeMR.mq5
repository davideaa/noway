//+------------------------------------------------------------------+
//|                                                GoldRangeMR.mq5   |
//|                                                                  |
//|  CANDIDATA 5 — Mean reversion nel range in compressione           |
//|  (XAUUSD, H1)                                                    |
//|                                                                  |
//|  PERCHE' ESISTE                                                   |
//|  S3 guadagna quando una rottura continua. S4 guadagna quando la   |
//|  stessa rottura fallisce. Entrambe hanno bisogno che una rottura  |
//|  AVVENGA. Quando il mercato si comprime e non rompe niente, tutte |
//|  e due restano ferme (o si fanno logorare dai falsi segnali).     |
//|  Questa terza gamba guadagna esattamente li'.                     |
//|                                                                  |
//|  IPOTESI, scritta prima di qualunque test:                        |
//|  quando la volatilita' si contrae e il prezzo si muove dentro un  |
//|  canale stretto, ai bordi del canale ci sono venditori in alto e  |
//|  compratori in basso che difendono il livello. Finche' la         |
//|  compressione dura, toccare il bordo e' un'occasione per tornare  |
//|  verso il centro.                                                 |
//|                                                                  |
//|  DECORRELAZIONE PER COSTRUZIONE, non sperata:                     |
//|  - S3 richiede ATRveloce/ATRlento >= soglia (espansione).         |
//|    Qui si richiede ATRveloce/ATRlento <= soglia (compressione).   |
//|    Le due condizioni non possono essere vere insieme.             |
//|  - S3 e S4 richiedono una chiusura OLTRE il canale a 60 barre.    |
//|    Qui si entra solo se NESSUNA rottura e' avvenuta di recente.   |
//|  - S3 cavalca lontano dal centro senza target. Qui si torna al    |
//|    centro con un target fisso e piccolo.                          |
//|  - S3 tiene la posizione per giorni. Qui si esce dopo poche ore.  |
//|                                                                  |
//|  REGOLE                                                           |
//|  1. compressione: ATR(veloce)/ATR(lento) <= soglia                |
//|  2. il canale a N barre e' stretto rispetto alla volatilita'      |
//|     normale (larghezza <= K * ATRlento)                           |
//|  3. nessuna rottura del canale nelle ultime M barre               |
//|  4. il prezzo tocca il bordo basso -> long (e viceversa)          |
//|  5. stop oltre il bordo di un buffer in ATR                       |
//|  6. target: ritorno al centro del canale                          |
//|  7. uscita forzata dopo un numero massimo di barre                |
//|                                                                  |
//|  PROTOCOLLO: sviluppo e ottimizzazione SOLO su 2019.06-2023.12.   |
//|  Il 2024.01-2026.09 resta congelato e si guarda una volta sola.   |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

input group "=== Generale ==="
input long              InpMagic            = 996000;    // Magic number
input double            InpRiskPercent      = 0.6;       // Rischio per trade (% equity)
input int               InpMaxPositions     = 1;         // Posizioni massime
input int               InpSlippagePoints   = 30;        // Deviazione massima

input group "=== Definizione del range ==="
input ENUM_TIMEFRAMES   InpTF               = PERIOD_H1; // Timeframe
input int               InpRangeBars        = 48;        // <<< Barre che definiscono il canale
input double            InpTouchATR         = 0.25;      // <<< Quanto vicino al bordo per dire "tocca"

input group "=== Condizione di compressione ==="
input int               InpAtrFast          = 14;        // ATR veloce
input int               InpAtrSlow          = 100;       // ATR lento (volatilita' normale)
input double            InpMaxVolRatio      = 0.85;      // <<< ATRveloce/ATRlento MASSIMO (l'opposto di S3)
input double            InpMaxRangeATR      = 6.0;       // <<< Larghezza max del canale in ATRlento

input group "=== Niente rotture recenti ==="
input int               InpBreakBars        = 60;        // Canale sorvegliato (= quello di S3/S4)
input int               InpQuietBars        = 12;        // <<< Barre senza rotture richieste

input group "=== Gestione ==="
input double            InpStopBufferATR    = 1.0;       // <<< Stop oltre il bordo, in ATRveloce
input double            InpTargetPct        = 0.50;      // <<< Target: frazione del canale (0.5 = centro)
input double            InpMinTargetR       = 0.0;       // Scarta il segnale se target < questo R (0 = off)
input int               InpMaxHoldBars      = 24;        // <<< Uscita forzata dopo N barre
input bool              InpAllowLong        = true;      // Compra il bordo basso
input bool              InpAllowShort       = true;      // Vendi il bordo alto

//==================================================================
CTrade   trade;
int      hAtrFast = INVALID_HANDLE, hAtrSlow = INVALID_HANDLE;
datetime lastBar  = 0;

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

//  Il target e' un PREZZO (il centro del canale), non un multiplo di R:
//  e' il canale a decidere dove si torna, non il nostro stop.
bool OpenMR(const bool isLong, const double stopPrice, const double targetPrice)
  {
   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl = EnforceStopsLevel(price, stopPrice, isLong);
   double risk = MathAbs(price - sl);
   if(risk <= 0.0) return(false);

   double reward = isLong ? (targetPrice - price) : (price - targetPrice);
   if(reward <= 0.0) return(false);
   if(InpMinTargetR > 0.0 && reward / risk < InpMinTargetR) return(false);

   double tp = EnforceStopsLevel(price, targetPrice, !isLong);  // stesso vincolo, lato opposto
   int dg = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, dg);
   tp = NormalizeDouble(tp, dg);

   double lots = LotsFromRisk(risk);
   if(lots <= 0.0) return(false);

   trade.SetExpertMagicNumber(InpMagic);
   trade.SetDeviationInPoints(InpSlippagePoints);
   return(isLong ? trade.Buy (lots, _Symbol, 0.0, sl, tp, "MR-LONG")
                 : trade.Sell(lots, _Symbol, 0.0, sl, tp, "MR-SHORT"));
  }

//  Il mean reversion decade con il tempo: se non torna al centro
//  entro poche barre, l'ipotesi e' sbagliata e si esce.
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
//  Nessuna rottura del canale a InpBreakBars nelle ultime N barre.
//  E' il filtro che tiene questa strategia fuori dal terreno di S3/S4.
//------------------------------------------------------------------
bool NoRecentBreak()
  {
   if(InpQuietBars <= 0) return(true);

   for(int k = 1; k <= InpQuietBars; k++)
     {
      int ih = iHighest(_Symbol, InpTF, MODE_HIGH, InpBreakBars, k + 1);
      int il = iLowest (_Symbol, InpTF, MODE_LOW,  InpBreakBars, k + 1);
      if(ih < 0 || il < 0) return(false);

      double c = iClose(_Symbol, InpTF, k);
      if(c > iHigh(_Symbol, InpTF, ih)) return(false);
      if(c < iLow (_Symbol, InpTF, il)) return(false);
     }
   return(true);
  }

//------------------------------------------------------------------
void OnNewBar()
  {
   if(CountPositions() >= InpMaxPositions) return;

   double atrF = IndValue(hAtrFast, 1);
   double atrS = IndValue(hAtrSlow, 1);
   if(atrF <= 0.0 || atrS <= 0.0) return;

   // ---- 1. compressione (l'opposto esatto del filtro di S3)
   if(atrF / atrS > InpMaxVolRatio) return;

   // ---- 2. il canale e' stretto rispetto alla volatilita' normale
   // il canale si misura a partire da DUE barre fa: il livello deve
   // esistere PRIMA che il prezzo lo venga a toccare, altrimenti la barra
   // del tocco definisce da sola il bordo e il segnale e' circolare.
   int ih = iHighest(_Symbol, InpTF, MODE_HIGH, InpRangeBars, 2);
   int il = iLowest (_Symbol, InpTF, MODE_LOW,  InpRangeBars, 2);
   if(ih < 0 || il < 0) return;

   double rh = iHigh(_Symbol, InpTF, ih);
   double rl = iLow (_Symbol, InpTF, il);
   double width = rh - rl;
   if(width <= 0.0) return;
   if(InpMaxRangeATR > 0.0 && width > InpMaxRangeATR * atrS) return;

   // ---- 3. niente rotture recenti: qui S3 e S4 sono ferme
   if(!NoRecentBreak()) return;

   // ---- 4. il prezzo tocca un bordo
   double c1    = iClose(_Symbol, InpTF, 1);
   double l1    = iLow  (_Symbol, InpTF, 1);
   double h1    = iHigh (_Symbol, InpTF, 1);
   if(c1 <= 0.0) return;

   double touch  = InpTouchATR * atrF;
   double middle = rl + InpTargetPct * width;

   // bordo basso -> long, target verso il centro
   if(InpAllowLong && l1 <= rl + touch && c1 > rl)
     {
      // lo stop va sotto il punto piu' basso realmente toccato, non sotto il
      // bordo teorico: se la barra ha perforato il livello, il bordo e' gia'
      // alle spalle del prezzo.
      double stopPrice = MathMin(rl, l1) - InpStopBufferATR * atrF;
      if(OpenMR(true, stopPrice, middle)) return;
     }

   // bordo alto -> short, target verso il centro
   if(InpAllowShort && h1 >= rh - touch && c1 < rh)
     {
      double stopPrice = MathMax(rh, h1) + InpStopBufferATR * atrF;
      double mid2      = rh - InpTargetPct * width;
      OpenMR(false, stopPrice, mid2);
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
   if(n == 0) { Print("=== RANGE MR: nessun trade ==="); return; }

   double pf = (gl != 0.0) ? gw / MathAbs(gl) : 0.0;
   double al = (n - w > 0) ? gl / (n - w) : 0.0;
   PrintFormat("=== MEAN REVERSION NEL RANGE COMPRESSO ===");
   PrintFormat("trade %d (%d long / %d short) | WR %.1f%% | PF %.2f | P&L %.2f",
               n, nl, ns, 100.0 * w / n, pf, gw + gl);
   if(al != 0.0)
      PrintFormat("expectancy %+.3f R/trade", (gw + gl) / (MathAbs(al) * n));
  }

double OnTester() { PrintSummary(); return(AccountInfoDouble(ACCOUNT_BALANCE)); }

int OnInit()
  {
   hAtrFast = iATR(_Symbol, InpTF, InpAtrFast);
   hAtrSlow = iATR(_Symbol, InpTF, InpAtrSlow);
   if(hAtrFast == INVALID_HANDLE || hAtrSlow == INVALID_HANDLE)
     { Print("handle ATR non creato"); return(INIT_FAILED); }

   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);
   lastBar = 0;
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
