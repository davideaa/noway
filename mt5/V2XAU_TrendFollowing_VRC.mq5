//+------------------------------------------------------------------+
//|                                   V2XAU_TrendFollowing_VRC.mq5   |
//|                                                                  |
//|  V2XAU — CAPITALE DI RISCHIO VIRTUALE (VRC)                       |
//|                                                                  |
//|  STESSA STRATEGIA di V1XAU_TrendFollowing.mq5. Segnali, stop,     |
//|  trailing, indicatori, timeframe, magic, cooldown, permessi       |
//|  long/short: identici, riga per riga. Qui cambia SOLO da quale    |
//|  capitale si calcola la dimensione della posizione.               |
//|                                                                  |
//|  IL PROBLEMA                                                      |
//|  Rischio e margine non sono la stessa cosa. Su XAUUSD un broker   |
//|  puo' chiedere ~19.000 di margine per 1 lotto: due gambe aperte   |
//|  insieme a 0,70 lotti totali vogliono ~13.300 di margine, che un  |
//|  conto da 10.000 non ha — anche se il rischio da stop e' ~100.    |
//|                                                                  |
//|  LA SOLUZIONE                                                     |
//|  Si versa capitale in piu' PER IL MARGINE, e si impedisce a quel  |
//|  capitale di alzare il rischio.                                   |
//|                                                                  |
//|    equity vera del conto   -> margine, free margin, sicurezza     |
//|    capitale virtuale       -> UNICA base per il calcolo dei lotti |
//|                                                                  |
//|    capitale virtuale = InpInitialRiskCapital                      |
//|                      + P&L netto REALIZZATO dei magic di questo EA|
//|                                                                  |
//|  Esempio: deposito 20.000, capitale virtuale 10.000, rischio 1%.  |
//|  Il primo trade rischia 100, non 200. Dopo +2.000 realizzati il   |
//|  capitale virtuale e' 12.000 e il trade rischia 120, mentre       |
//|  l'equity vera e' 22.000 e NON viene usata per il sizing.         |
//|  Il composto continua a funzionare, e in drawdown la size scende. |
//|                                                                  |
//|  RIAVVII: il capitale virtuale non si azzera. OnInit lo ricostru- |
//|  isce sommando dallo storico i deal dei magic base+2 e base+3.    |
//|                                                                  |
//|  MARGINE: calcolato a parte con OrderCalcMargin(), cioe' col      |
//|  calcolo vero del broker, mai con notional/leva. Se non basta,    |
//|  l'ordine viene rifiutato e SCRITTO nel diario, non falsato in    |
//|  silenzio (a meno di InpReduceLotsIfMargin).                      |
//|                                                                  |
//|  NON VERIFICATO: vedi docs/CONTINUA-QUI.md sezione 8.             |
//+------------------------------------------------------------------+
#property copyright "Ricerca"
#property version   "2.00"
#property strict

#include <Trade\Trade.mqh>

//==================================================================
//  INPUT
//==================================================================
input group "=== Capitale di rischio virtuale (VRC) ==="
// La base per il calcolo dei lotti. NON e' l'equity del conto: il
// deposito in piu' serve solo a reggere il margine, e non deve far
// crescere il rischio. Nel tester: Deposito 20000 + questo a 10000
// significa 20.000 disponibili per il margine, ma la strategia
// rischia come se ne avesse 10.000.
input double            InpInitialRiskCapital = 10000.0;  // Capitale di rischio iniziale
input bool              InpUseMarginSafety    = true;     // Attiva la riserva di margine
input double            InpMinFreeMarginAfterPct = 30.0;  // Margine libero che deve restare dopo l'ordine (% equity)
input bool              InpReduceLotsIfMargin = false;    // Se il margine non basta: false = rifiuta, true = riduce il lotto
input bool              InpVerboseSizing      = false;    // Scrive nel diario ogni calcolo (i rifiuti si scrivono sempre)

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

//==================================================================
//  STATO
//==================================================================
CTrade   trade;

int      hS2Ema   = INVALID_HANDLE, hS2Atr  = INVALID_HANDLE;
int      hS3AtrF  = INVALID_HANDLE, hS3AtrS = INVALID_HANDLE;
int      hRiskAtr = INVALID_HANDLE;

// Capitale di rischio virtuale: P&L realizzato dei nostri magic, in
// cache. g_capitalDirty lo fa ricalcolare quando qualcosa si e' chiuso.
double   g_realizedPnL   = 0.0;
bool     g_capitalDirty  = true;
int      g_lastOpenCount = 0;

// Prototipi. Alcune di queste funzioni si chiamano fra loro prima di
// essere definite (CurrentOpenRiskPercent usa StrategyRiskCapital,
// RiskMoney usa EffectiveRiskPercent): dichiararle qui toglie ogni
// dipendenza dall'ordine in cui stanno nel file.
double EffectiveRiskPercent();
double RealizedPnLForEA();
double StrategyRiskCapital();
double RiskMoney(const double riskMult);
double MarginBudget();
bool   RequiredMargin(const bool isLong, const double lots, double &needed);
double LotsMarginAllows(const bool isLong, const double wanted);

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
   // in % del capitale virtuale, non dell'equity: "rischio" deve
   // voler dire la stessa cosa in tutto l'EA
   double capital = StrategyRiskCapital();
   if(capital <= 0.0) return(0.0);

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
   return(100.0 * risk / capital);
  }

//==================================================================
//  CAPITALE DI RISCHIO VIRTUALE
//
//  L'unica cosa che V2 cambia rispetto a V1. Il capitale su cui si
//  calcolano i lotti non e' piu' l'equity del conto: e' il capitale
//  iniziale dichiarato piu' il P&L netto REALIZZATO attribuibile ai
//  magic di questo EA.
//
//  Perche' realizzato e non equity:
//   - l'equity comprende il deposito messo per il margine, che non
//     deve alzare il rischio;
//   - l'equity comprende il P&L fluttuante delle posizioni aperte,
//     quindi un trade in corso gonfierebbe la size del successivo;
//   - il realizzato si ricostruisce identico dopo un riavvio, il
//     fluttuante no.
//==================================================================

//  Somma dei deal chiusi dei nostri due magic: profitto + commissione
//  + swap + fee. Comprende i deal di APERTURA, dove sta la commissione
//  d'ingresso. Filtra per simbolo e magic, quindi operazioni a mano o
//  di altri EA non toccano questo capitale.
double RealizedPnLForEA()
  {
   if(!HistorySelect(0, TimeCurrent())) return(0.0);

   double pnl   = 0.0;
   int    total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
     {
      ulong tk = HistoryDealGetTicket(i);
      if(tk == 0) continue;
      if(HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;

      long magic = HistoryDealGetInteger(tk, DEAL_MAGIC);
      if(magic != InpMagicBase + 2 && magic != InpMagicBase + 3) continue;

      pnl += HistoryDealGetDouble(tk, DEAL_PROFIT)
           + HistoryDealGetDouble(tk, DEAL_COMMISSION)
           + HistoryDealGetDouble(tk, DEAL_SWAP)
           + HistoryDealGetDouble(tk, DEAL_FEE);
     }
   return(pnl);
  }

//  Il capitale virtuale, in cache. Si ricalcola solo quando qualcosa
//  si e' chiuso (OnTradeTransaction, o il controllo in OnTick).
double StrategyRiskCapital()
  {
   if(g_capitalDirty)
     {
      g_realizedPnL  = RealizedPnLForEA();
      g_capitalDirty = false;
     }
   double cap = InpInitialRiskCapital + g_realizedPnL;
   return(cap > 0.0 ? cap : 0.0);
  }

//  Il denaro che questo trade puo' perdere fino allo stop.
double RiskMoney(const double riskMult)
  {
   return(StrategyRiskCapital() * EffectiveRiskPercent() * riskMult / 100.0);
  }

//==================================================================
//  MARGINE — calcolato a parte dal rischio, col metodo del broker
//==================================================================

//  Margine vero richiesto da questo volume. Mai notional/leva: su
//  XAUUSD il requisito puo' essere a scaglioni e non proporzionale.
bool RequiredMargin(const bool isLong, const double lots, double &needed)
  {
   needed = 0.0;
   if(lots <= 0.0) return(false);

   double price = isLong ? SymbolInfoDouble(_Symbol, SYMBOL_ASK)
                         : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   if(price <= 0.0) return(false);

   ENUM_ORDER_TYPE type = isLong ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   return(OrderCalcMargin(type, _Symbol, lots, price, needed));
  }

//  Quanto margine possiamo spendere adesso. Il margine gia' occupato
//  dall'altra gamba e' gia' scontato dentro ACCOUNT_MARGIN_FREE.
double MarginBudget()
  {
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   if(!InpUseMarginSafety) return(freeMargin > 0.0 ? freeMargin : 0.0);

   double equity  = AccountInfoDouble(ACCOUNT_EQUITY);
   double riserva = equity * InpMinFreeMarginAfterPct / 100.0;
   double budget  = freeMargin - riserva;
   return(budget > 0.0 ? budget : 0.0);
  }

//  Il volume piu' grande che il margine regge, mai sopra quello voluto.
//  Parte da una stima lineare e poi scende a passi, perche' il margine
//  potrebbe non essere proporzionale al volume.
double LotsMarginAllows(const bool isLong, const double wanted)
  {
   double budget = MarginBudget();
   double need   = 0.0;
   if(!RequiredMargin(isLong, wanted, need)) return(0.0);
   if(need <= budget) return(wanted);

   double step   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   if(step <= 0.0) step = 0.01;

   double v = (need > 0.0) ? wanted * budget / need : 0.0;
   v = MathFloor(v / step) * step;
   if(v > wanted) v = wanted;

   for(; v >= minLot - 1e-9; v -= step)
     {
      double vol = NormalizeDouble(v, 2);
      double nd  = 0.0;
      if(!RequiredMargin(isLong, vol, nd)) return(0.0);
      if(nd <= budget) return(vol);
     }
   return(0.0);
  }

//  I rifiuti e le riduzioni si scrivono SEMPRE: un ordine che non parte
//  deve lasciare traccia del perche'.
void LogSizing(const string tag, const bool isLong, const double riskMoney,
               const double wantLots, const double needed, const string esito,
               const bool sempre)
  {
   if(!sempre && !InpVerboseSizing) return;
   PrintFormat("%s %s | capitale virtuale %.2f | rischio %.2f%% = %.2f | volume %.2f | margine richiesto %.2f | libero %.2f | budget %.2f | %s",
               tag, isLong ? "LONG" : "SHORT",
               StrategyRiskCapital(), EffectiveRiskPercent(), riskMoney,
               wantLots, needed, AccountInfoDouble(ACCOUNT_MARGIN_FREE),
               MarginBudget(), esito);
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

   // IL CAMBIO CENTRALE DI V2: non l'equity del conto, ma il capitale
   // virtuale. Il deposito messo per reggere il margine non deve
   // alzare il rischio.
   double riskMoney = RiskMoney(riskMult);
   if(riskMoney <= 0.0) return(0.0);

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
   if(lots <= 0.0)
     {
      LogSizing(tag, isLong, RiskMoney(riskMult), 0.0, 0.0,
                "NIENTE ORDINE: volume sotto il minimo del broker", true);
      return(false);
     }

   // ---- margine: conto separato dal rischio ----
   double needed = 0.0;
   if(!RequiredMargin(isLong, lots, needed))
     {
      LogSizing(tag, isLong, RiskMoney(riskMult), lots, 0.0,
                "NIENTE ORDINE: OrderCalcMargin non risponde", true);
      return(false);
     }

   if(needed > MarginBudget())
     {
      if(!InpReduceLotsIfMargin)
        {
         LogSizing(tag, isLong, RiskMoney(riskMult), lots, needed,
                   "ORDINE RIFIUTATO DALL'EA: margine insufficiente", true);
         return(false);
        }

      double ridotto = LotsMarginAllows(isLong, lots);
      if(ridotto <= 0.0)
        {
         LogSizing(tag, isLong, RiskMoney(riskMult), lots, needed,
                   "ORDINE RIFIUTATO DALL'EA: margine insufficiente anche al minimo", true);
         return(false);
        }
      PrintFormat("%s volume ridotto per margine: %.2f -> %.2f (rischio reale piu' basso del dichiarato)",
                  tag, lots, ridotto);
      lots = ridotto;
      RequiredMargin(isLong, lots, needed);
     }

   LogSizing(tag, isLong, RiskMoney(riskMult), lots, needed, "ordine inviato", false);

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
   g_capitalDirty = true;
   PrintFormat("VRC finale: capitale %.2f = iniziale %.2f + realizzato %.2f",
               StrategyRiskCapital(), InpInitialRiskCapital, g_realizedPnL);
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

   // Il capitale virtuale NON riparte da InpInitialRiskCapital: si
   // ricostruisce dallo storico, quindi un riavvio di MT5, del VPS o
   // un cambio di timeframe non azzerano il composto.
   g_capitalDirty  = true;
   double cap      = StrategyRiskCapital();
   g_lastOpenCount = CountPositions(InpMagicBase + 2) + CountPositions(InpMagicBase + 3);
   PrintFormat("VRC all'avvio: capitale %.2f = iniziale %.2f + realizzato %.2f | posizioni aperte %d",
               cap, InpInitialRiskCapital, g_realizedPnL, g_lastOpenCount);
   if(cap <= 0.0)
      Print("VRC: capitale virtuale a zero, l'EA non aprira' piu' nulla");

   return(INIT_SUCCEEDED);
  }

void OnDeinit(const int reason)
  {
   PrintStrategySummary();
   IndicatorRelease(hS2Ema);
   IndicatorRelease(hS2Atr);
   IndicatorRelease(hS3AtrF);
   IndicatorRelease(hS3AtrS);
   IndicatorRelease(hRiskAtr);
  }

//  Una chiusura cambia il capitale virtuale. OnTradeTransaction lo
//  segnala, ma questo controllo e' la rete di sicurezza se un evento
//  non arriva: se il numero di posizioni nostre cambia, si ricalcola.
void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest     &request,
                        const MqlTradeResult      &result)
  {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) g_capitalDirty = true;
  }

void OnTick()
  {
   WeekendGuard();

   int openNow = CountPositions(InpMagicBase + 2) + CountPositions(InpMagicBase + 3);
   if(openNow != g_lastOpenCount) { g_capitalDirty = true; g_lastOpenCount = openNow; }

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
