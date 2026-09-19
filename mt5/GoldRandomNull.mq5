//+------------------------------------------------------------------+
//|                                             GoldRandomNull.mq5   |
//|                                                                  |
//|  BENCHMARK NULLO per GoldMomentum3.                               |
//|                                                                  |
//|  Riproduce l'intera macchina di GoldMomentum3 -- tre gambe, stessi |
//|  stop in ATR, stesso trailing, stesso sizing 0,6%, stesso numero   |
//|  di trade, stessa durata media, stessi costi -- e sostituisce la   |
//|  SOLA cosa che vogliamo testare: il momento e la direzione         |
//|  dell'ingresso, che qui sono casuali.                              |
//|                                                                    |
//|  Serve a rispondere alla domanda che nessun backtest profittevole  |
//|  risponde da solo: i segnali di ingresso portano informazione,     |
//|  oppure il risultato viene dalla gestione delle uscite applicata   |
//|  a uno strumento che ha avuto una tendenza?                        |
//|                                                                    |
//|  USO                                                              |
//|  1. una passata singola per tarare le probabilita' di ingresso     |
//|     finche' i conteggi trade coincidono con quelli reali;          |
//|  2. poi ottimizzare InpSeed da 1 a 200: ogni passata e' un         |
//|     universo casuale diverso, e la colonna Risultato diventa la    |
//|     distribuzione nulla con cui confrontare il sistema vero.       |
//+------------------------------------------------------------------+
#property copyright "Benchmark nullo a scopo di ricerca"
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>

input group "=== Generale ==="
input int               InpSeed               = 1;        // Seme casuale (da ottimizzare 1..200)
input long              InpMagicBase          = 995000;   // Magic base
input double            InpRiskPercent        = 0.6;      // Rischio per trade (% equity)
input int               InpMaxPosPerLeg       = 1;        // Posizioni max per gamba
input int               InpSlippagePoints     = 30;       // Deviazione massima
input double            InpLongProbability    = 0.50;     // Quota di ingressi long

input group "=== Gamba 1 (specchio di S1: stop 2.5 ATR, trailing 4.25) ==="
input bool              InpL1Enabled          = true;
input ENUM_TIMEFRAMES   InpL1TF               = PERIOD_H1;
input double            InpL1EntryProb        = 0.0288;   // prob. di ingresso per barra, da tarare
input int               InpL1AtrPeriod        = 14;
input double            InpL1StopATR          = 2.5;
input double            InpL1TrailStartR      = 1.0;
input double            InpL1TrailATR         = 4.25;
input double            InpL1ExitProb         = 0.0;      // 0 = esce solo su stop/trailing

input group "=== Gamba 2 (specchio di S2: stop 2.0 ATR, uscita a tempo) ==="
input bool              InpL2Enabled          = true;
input ENUM_TIMEFRAMES   InpL2TF               = PERIOD_H1;
input double            InpL2EntryProb        = 0.0182;   // da tarare
input int               InpL2AtrPeriod        = 14;
input double            InpL2StopATR          = 2.0;
input double            InpL2TrailStartR      = 0.0;      // S2 non ha trailing
input double            InpL2TrailATR         = 0.0;
input double            InpL2ExitProb         = 0.125;    // uscita casuale: riproduce la durata media

input group "=== Gamba 3 (specchio di S3: M30, stop 2.0 ATR, trailing 4.0) ==="
input bool              InpL3Enabled          = true;
input ENUM_TIMEFRAMES   InpL3TF               = PERIOD_M30;
input double            InpL3EntryProb        = 0.0078;   // da tarare
input int               InpL3AtrPeriod        = 14;
input double            InpL3StopATR          = 2.0;
input double            InpL3TrailStartR      = 1.0;
input double            InpL3TrailATR         = 4.0;
input double            InpL3ExitProb         = 0.0;

//==================================================================
CTrade   trade;
int      hAtr[3]  = {INVALID_HANDLE, INVALID_HANDLE, INVALID_HANDLE};
datetime lastBar[3] = {0, 0, 0};

#define RISK_SLOTS 64
struct TradeRisk { ulong ticket; double riskDistance; };
TradeRisk g_risk[RISK_SLOTS];
int       g_riskIdx = 0;

// parametri per gamba, riuniti per non ripetere tre volte lo stesso codice
ENUM_TIMEFRAMES  legTF[3];
double           legEntry[3], legStop[3], legTrailStart[3], legTrail[3], legExit[3];
bool             legOn[3];

//==================================================================
//  UTILITY
//==================================================================
double Rnd() { return((double)MathRand() / 32768.0); }      // [0,1)

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
   g_risk[g_riskIdx].ticket = ticket;
   g_risk[g_riskIdx].riskDistance = dist;
   g_riskIdx = (g_riskIdx + 1) % RISK_SLOTS;
  }

double RecallRisk(const ulong ticket, const double fallback)
  {
   for(int i = 0; i < RISK_SLOTS; i++)
      if(g_risk[i].ticket == ticket) return(g_risk[i].riskDistance);
   return(fallback);
  }

int CountPositions(const long magic)
  {
   int c = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic) continue;
      c++;
     }
   return(c);
  }

double LotsFromRisk(const double stopDistance)
  {
   if(stopDistance <= 0.0) return(0.0);
   double riskMoney = AccountInfoDouble(ACCOUNT_EQUITY) * InpRiskPercent / 100.0;
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
   long   lvl  = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   double dist = lvl * _Point;
   if(dist <= 0.0) return(sl);
   if(isLong  && (price - sl) < dist) return(price - dist);
   if(!isLong && (sl - price) < dist) return(price + dist);
   return(sl);
  }

bool OpenRandom(const int leg, const bool isLong, const double stopDist)
  {
   if(stopDist <= 0.0) return(false);
   long magic = InpMagicBase + leg + 1;

   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   double sl = isLong ? price - stopDist : price + stopDist;
   sl = EnforceStopsLevel(price, sl, isLong);
   double realRisk = MathAbs(price - sl);

   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   sl = NormalizeDouble(sl, digits);

   double lots = LotsFromRisk(realRisk);
   if(lots <= 0.0) return(false);

   trade.SetExpertMagicNumber(magic);
   trade.SetDeviationInPoints(InpSlippagePoints);

   bool ok = isLong ? trade.Buy(lots, _Symbol, 0.0, sl, 0.0, "NULL-L" + IntegerToString(leg + 1))
                    : trade.Sell(lots, _Symbol, 0.0, sl, 0.0, "NULL-L" + IntegerToString(leg + 1));
   if(ok)
     {
      ulong pt = trade.ResultOrder();
      if(pt > 0) RememberRisk(pt, realRisk);
     }
   return(ok);
  }

void ManageLeg(const int leg)
  {
   long   magic = InpMagicBase + leg + 1;
   double atr   = IndValue(hAtr[leg], 0);
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
      double price  = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_BID)
                             : SymbolInfoDouble(_Symbol, SYMBOL_ASK);

      if(legTrailStart[leg] <= 0.0 || legTrail[leg] <= 0.0) continue;

      double oneR = RecallRisk(tk, atr * legStop[leg]);
      if(oneR <= 0.0) continue;

      double profitR = (isLong ? (price - entry) : (entry - price)) / oneR;
      if(profitR < legTrailStart[leg]) continue;

      double newSL = isLong ? price - legTrail[leg] * atr : price + legTrail[leg] * atr;
      newSL = NormalizeDouble(EnforceStopsLevel(price, newSL, isLong), digits);

      if(isLong  && curSL > 0.0 && newSL <= curSL) continue;
      if(!isLong && curSL > 0.0 && newSL >= curSL) continue;

      trade.SetExpertMagicNumber(magic);
      trade.PositionModify(tk, newSL, PositionGetDouble(POSITION_TP));
     }
  }

// uscita casuale a fine barra: riproduce la distribuzione di durata
void RandomExitLeg(const int leg)
  {
   if(legExit[leg] <= 0.0) return;
   long magic = InpMagicBase + leg + 1;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
     {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) != magic)   continue;
      if(Rnd() < legExit[leg])
        {
         trade.SetExpertMagicNumber(magic);
         trade.PositionClose(tk);
        }
     }
  }

void RunLeg(const int leg)
  {
   long magic = InpMagicBase + leg + 1;
   RandomExitLeg(leg);
   if(CountPositions(magic) >= InpMaxPosPerLeg) return;
   if(Rnd() >= legEntry[leg]) return;

   double atr = IndValue(hAtr[leg], 1);
   if(atr <= 0.0) return;
   OpenRandom(leg, Rnd() < InpLongProbability, legStop[leg] * atr);
  }

//==================================================================
void PrintSummary()
  {
   if(!HistorySelect(0, TimeCurrent())) return;
   int n[3] = {0,0,0}, win[3] = {0,0,0};
   double gw[3] = {0,0,0}, gl[3] = {0,0,0};

   for(int i = 0; i < HistoryDealsTotal(); i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;
      int idx = (int)(HistoryDealGetInteger(tk, DEAL_MAGIC) - InpMagicBase) - 1;
      if(idx < 0 || idx > 2) continue;
      double net = HistoryDealGetDouble(tk, DEAL_PROFIT)
                 + HistoryDealGetDouble(tk, DEAL_COMMISSION)
                 + HistoryDealGetDouble(tk, DEAL_SWAP);
      n[idx]++;
      if(net > 0.0) { win[idx]++; gw[idx] += net; } else gl[idx] += net;
     }
   PrintFormat("=== BENCHMARK NULLO - seme %d ===", InpSeed);
   int tot = 0;
   for(int k = 0; k < 3; k++)
     {
      if(n[k] == 0) continue;
      tot += n[k];
      double pf = (gl[k] != 0.0) ? gw[k] / MathAbs(gl[k]) : 0.0;
      PrintFormat("gamba %d: %d trade | WR %.1f%% | PF %.2f | P&L %.2f",
                  k + 1, n[k], 100.0 * win[k] / n[k], pf, gw[k] + gl[k]);
     }
   PrintFormat("trade totali %d  (reale: 869 / 687 / 545 = 2101)", tot);
  }

double OnTester() { PrintSummary(); return(AccountInfoDouble(ACCOUNT_BALANCE)); }

int OnInit()
  {
   legOn[0]=InpL1Enabled; legOn[1]=InpL2Enabled; legOn[2]=InpL3Enabled;
   legTF[0]=InpL1TF;      legTF[1]=InpL2TF;      legTF[2]=InpL3TF;
   legEntry[0]=InpL1EntryProb; legEntry[1]=InpL2EntryProb; legEntry[2]=InpL3EntryProb;
   legStop[0]=InpL1StopATR;    legStop[1]=InpL2StopATR;    legStop[2]=InpL3StopATR;
   legTrailStart[0]=InpL1TrailStartR; legTrailStart[1]=InpL2TrailStartR; legTrailStart[2]=InpL3TrailStartR;
   legTrail[0]=InpL1TrailATR;  legTrail[1]=InpL2TrailATR;  legTrail[2]=InpL3TrailATR;
   legExit[0]=InpL1ExitProb;   legExit[1]=InpL2ExitProb;   legExit[2]=InpL3ExitProb;

   int per[3] = {InpL1AtrPeriod, InpL2AtrPeriod, InpL3AtrPeriod};
   for(int k = 0; k < 3; k++)
     {
      hAtr[k] = iATR(_Symbol, legTF[k], per[k]);
      if(hAtr[k] == INVALID_HANDLE) { Print("handle ATR non creato"); return(INIT_FAILED); }
      lastBar[k] = 0;
     }

   MathSrand(InpSeed);            // e' il seme a rendere diversa ogni passata
   trade.SetDeviationInPoints(InpSlippagePoints);
   trade.SetTypeFillingBySymbol(_Symbol);
   for(int i = 0; i < RISK_SLOTS; i++) { g_risk[i].ticket = 0; g_risk[i].riskDistance = 0.0; }
   g_riskIdx = 0;
   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   for(int k = 0; k < 3; k++) IndicatorRelease(hAtr[k]);
  }

void OnTick()
  {
   for(int k = 0; k < 3; k++)
     {
      if(!legOn[k]) continue;
      ManageLeg(k);
      datetime t = iTime(_Symbol, legTF[k], 0);
      if(t == 0 || t == lastBar[k]) continue;
      lastBar[k] = t;
      RunLeg(k);
     }
  }
//+------------------------------------------------------------------+
