//+------------------------------------------------------------------+
//| NAS100 Session-Open Momentum - Quant_Lab replica                 |
//| Reconstructed from public screenshots/reel supplied by user      |
//| Version 1.0                                                      |
//+------------------------------------------------------------------+
#property strict
// LIVE PANEL FINAL: strategy logic inherited unchanged from frozen v2.57
#property version   "2.58"
#property description "MULTI: puo' condividere il conto con altri EA (BlockOnAnyAccountPosition)"
#property description "Card-count adaptive risk: vol+directional quality, rolling centering, optional equity-health throttle"
#property description "Entry-comparison replica: opening M5 vs first EMA12 cross; no forced close"
#property description "Italian-session clock with US/EU DST mismatch handling"

#include <Trade/Trade.mqh>

CTrade trade;

//----------------------------- Inputs -------------------------------//

// Trailing interpretation diagnostic. Mode 0 reproduces the current ATR16 benchmark.
enum ENUM_TRAIL_MODE
  {
   TRAIL_EMA_CLOSED_EXACT = 0,      // current benchmark: SL = EMA120 of last closed M5
   TRAIL_EMA_LIVE_TICK = 1,         // diagnostic: SL follows live EMA120 every tick
   TRAIL_EMA_DELAY_1BAR = 2,        // diagnostic: EMA120 one extra closed M5 behind (shift 2)
   TRAIL_EMA_DELAY_2BARS = 3,       // diagnostic: EMA120 two extra closed M5 behind (shift 3)
   TRAIL_EMA_CLOSE_EXIT = 4,        // diagnostic: after +0.5R, exit only when M5 CLOSE crosses EMA120
   TRAIL_EMA_ATR_BUFFER = 5         // diagnostic: SL = EMA120 +/- TrailATRBuffer*ATR16
  };

enum ENUM_SIGNAL_MODE
  {
   FIRST_M5_BAR_AFTER_NY_OPEN = 0,   // Reel interpretation
   FIRST_EMA_CROSS_AFTER_NY_OPEN = 1 // Alternative interpretation
  };

enum ENUM_BROKER_TIME_MODE
  {
   BROKER_UTC = 0,
   BROKER_CET_CEST = 1,        // UTC+1 winter / UTC+2 summer, EU DST dates
   BROKER_EET_EEST = 2,        // UTC+2 winter / UTC+3 summer, EU DST dates
   BROKER_FIXED_UTC_OFFSET = 3,
   BROKER_PUPRIME = 4          // PU Prime: GMT+2 / GMT+3 following US DST dates
  };

enum ENUM_ADAPTIVE_RISK_FORMULA
  {
   AR_SHORT_OVER_AVG_SHORT=0,    // legacy: vol(short) / mean rolling vol(short)
   AR_SHORT_OVER_LONG=1,         // legacy alt: vol(short) / vol(reference)
   AR_CENTERED_MEDIAN_POWER=2,   // vol(short) / median prior rolling vols, then raw^strength
   AR_VOL_DIRECTIONAL_QUALITY=3 // NEW: volatility expansion is up-sized only when recent path is directional
  };

enum ENUM_RISK_BASE
  {
   RISK_ON_BALANCE = 0,
   RISK_ON_EQUITY  = 1
  };

input group "Core strategy"
input int              FastEMAPeriod       = 12;
input int              SlowEMAPeriod       = 120;
input int              ATRPeriod           = 16;     // FIXED: best ATR-period diagnostic result
input double           ATRStopMultiplier   = 8.0;
input double           TrailActivationR    = 0.50;
input ENUM_SIGNAL_MODE SignalMode           = FIRST_M5_BAR_AFTER_NY_OPEN; // FIXED replica rule: first 09:30-09:35 NY M5 close vs EMA12
input bool             TrailUsesClosedBar  = true;   // retained for compatibility; TrailMode controls v2.00 behavior
input ENUM_TRAIL_MODE   TrailMode           = TRAIL_EMA_CLOSE_EXIT; // FIXED new benchmark: Mode 4
input double            TrailATRBuffer      = 0.50;   // only used by TRAIL_EMA_ATR_BUFFER
input int              MaxTradesPerItalyDay= 1;

input group "Fixed entry filter - Mode 3 checkpoint"
// FROZEN benchmark configuration (do not optimize in this diagnostic):
// body/range >= 0.075 AND close at least 0.05 ATR beyond EMA12.
input double FixedMinBodyToRange = 0.075;
input double FixedMinEMADistanceATR = 0.05;

input group "CARD-COUNT ADAPTIVE RISK"
input double           RiskPercent              = 1.50;   // base risk; all signal/exit parameters remain frozen
input ENUM_RISK_BASE   RiskBase                 = RISK_ON_BALANCE;
input bool             UseAdaptiveRisk          = true;  // adaptive sizing ON
input ENUM_ADAPTIVE_RISK_FORMULA AdaptiveRiskFormula = AR_VOL_DIRECTIONAL_QUALITY;
input double           AdaptiveStrength         = 0.50;   // centered formula: 0=fixed risk, 0.5=sqrt(raw), 1=raw
input int              AdaptiveReferencePeriod  = 200;    // screenshot: long reference average
input int              AdaptiveShortWindow      = 20;     // screenshot: realized-vol short window
input double           AdaptiveMinMultiplier    = 0.50;   // screenshot: never below 0.5x
input double           AdaptiveMaxMultiplier    = 2.00;   // screenshot: never above 2.0x
input int              DirectionalQualityWindow = 20;     // Kaufman-style efficiency ratio on CLOSED M5 bars
input double           DirectionalQualityLow    = 0.20;   // ER <= this: high-vol risk increase is blocked
input double           DirectionalQualityHigh   = 0.45;   // ER >= this: full high-vol risk increase is allowed

input group "CARD-COUNT NORMALIZATION / DRAWDOWN CONTROL"
input bool             UseRollingMarketCenter    = true;    // centers raw adaptive multiplier using ONLY prior executed trades
input int              MarketCenterWindow        = 200;     // prior trade multipliers used for rolling mean
input int              MarketCenterMinSamples    = 20;      // until enough history exists, multiplier stays at 1.0
input bool             UseEquityHealthThrottle   = false;   // FIRST TEST: keep false; second test set true
input double           EquityThrottleK           = 1.00;    // health = exp(-K * current balance DD)
input double           EquityThrottleFloor       = 0.50;    // never reduce health multiplier below this
input ulong            MagicNumber              = 1208120;
input int              MaxDeviationPoints  = 50;     // execution tolerance, NOT synthetic slippage cost
input bool             PrintDebug          = false;  // false recommended during ATR optimization

input bool             WriteAdaptiveAuditCSV       = false;
input bool             WriteRegimeResearchCSV      = false;  // optional research logger

input group "Broker server time -> Italy conversion"
input ENUM_BROKER_TIME_MODE BrokerTimeMode = BROKER_PUPRIME;
input double           FixedBrokerUTCOffsetHours = 0.0; // used only with BROKER_FIXED_UTC_OFFSET

input group "Session controls"
input int              NYRTHCloseHourET          = 16;     // only limits signal search for mode B; DOES NOT close positions
input int              NYRTHCloseMinuteET        = 0;
input bool             ForceCloseAtNYRTHClose    = false;  // positions can remain open overnight / across days
// true  = comportamento originale: non entra se sul conto c'e' QUALUNQUE
//          posizione, di qualunque simbolo o magic. E' con questo che sono
//          stati prodotti tutti i backtest.
// false = guarda solo le proprie posizioni, cosi' l'EA puo' stare sullo
//          stesso conto di altri (per esempio quello sull'oro) senza restare
//          fuori dai propri ingressi.
// Girando DA SOLO le due modalita' sono identiche, perche' le uniche
// posizioni sul conto sono le sue: per questo il cambio non puo' spostare
// di un solo trade i backtest gia' misurati.
input bool             BlockOnAnyAccountPosition = true;
input bool             AllowNewEntryIfPreviousPositionStillOpen = false; // kept false; v1.60 also blocks if ANY account position is open

//-------------------------- Indicator handles -----------------------//
int hFastEMA = INVALID_HANDLE;
int hSlowEMA = INVALID_HANDLE;
int hATR     = INVALID_HANDLE;

datetime lastProcessedClosedBar = 0;
int      lastTradeDateKey        = -1;
double   initialRiskDistance     = 0.0;
bool     trailActivated          = false;
ulong    trackedPositionTicket   = 0;
datetime lastTrailingEvalM5Bar    = 0;

// Diagnostics / logger state
int g_auditHandle=INVALID_HANDLE;
double g_lastAdaptiveMult=1.0;
double g_lastCurrentVol=0.0;
double g_lastReferenceVol=0.0;
double g_lastDirectionalQuality=0.0;
double g_lastRawMarketMult=1.0;
double g_lastMarketCenter=1.0;
double g_lastHealthMult=1.0;
double g_marketRawHistory[];


//-------------------------- LIVE PANEL ONLY -------------------------//
// Completely disabled in Strategy Tester. These variables/functions do not
// participate in signals, sizing, entries, exits, or trailing.
bool g_livePanelEnabled=false;
string PANEL_PREFIX="NAS57_LIVE_";

//----------------------------- Helpers ------------------------------//
datetime MakeDateTime(int y,int mon,int day,int hour=0,int minute=0,int sec=0)
  {
   MqlDateTime dt;
   ZeroMemory(dt);
   dt.year=y; dt.mon=mon; dt.day=day;
   dt.hour=hour; dt.min=minute; dt.sec=sec;
   return StructToTime(dt);
  }

int DaysInMonth(int y,int mon)
  {
   if(mon==2)
      return ((y%400==0) || (y%4==0 && y%100!=0)) ? 29 : 28;
   if(mon==4 || mon==6 || mon==9 || mon==11) return 30;
   return 31;
  }

int DayOfWeek(int y,int mon,int day)
  {
   MqlDateTime dt;
   TimeToStruct(MakeDateTime(y,mon,day,12,0,0),dt);
   return dt.day_of_week; // 0 Sunday
  }

int NthSunday(int y,int mon,int nth)
  {
   int dow1=DayOfWeek(y,mon,1);
   int firstSunday = 1 + ((7-dow1)%7);
   return firstSunday + 7*(nth-1);
  }

int LastSunday(int y,int mon)
  {
   int last=DaysInMonth(y,mon);
   int dow=DayOfWeek(y,mon,last);
   return last-dow;
  }

// Europe/Rome DST in UTC: last Sunday March 01:00 UTC -> last Sunday October 01:00 UTC
bool IsEuropeDSTUtc(datetime utc)
  {
   MqlDateTime d; TimeToStruct(utc,d);
   datetime start=MakeDateTime(d.year,3,LastSunday(d.year,3),1,0,0);
   datetime end  =MakeDateTime(d.year,10,LastSunday(d.year,10),1,0,0);
   return (utc>=start && utc<end);
  }

// Date-level DST helper is enough for broker offset at the NY-open afternoon.
bool IsEuropeDSTCalendarDate(datetime server_time)
  {
   MqlDateTime d; TimeToStruct(server_time,d);
   int marLast=LastSunday(d.year,3);
   int octLast=LastSunday(d.year,10);

   if(d.mon<3 || d.mon>10) return false;
   if(d.mon>3 && d.mon<10) return true;
   if(d.mon==3) return (d.day>=marLast);
   if(d.mon==10) return (d.day<octLast);
   return false;
  }

// PU Prime changes MT5 server from GMT+2 to GMT+3 on US DST dates.
// For our weekday NY-open logic, date-level handling is sufficient:
// second Sunday of March starts DST; first Sunday of November ends it.
bool IsUSDSTCalendarDate(datetime server_time)
  {
   MqlDateTime d; TimeToStruct(server_time,d);
   int marSecond=NthSunday(d.year,3,2);
   int novFirst=NthSunday(d.year,11,1);

   if(d.mon<3 || d.mon>11) return false;
   if(d.mon>3 && d.mon<11) return true;
   if(d.mon==3) return (d.day>=marSecond);
   if(d.mon==11) return (d.day<novFirst);
   return false;
  }

// US Eastern DST in UTC:
// second Sunday March 07:00 UTC -> first Sunday November 06:00 UTC
bool IsUSDSTUtc(datetime utc)
  {
   MqlDateTime d; TimeToStruct(utc,d);
   datetime start=MakeDateTime(d.year,3,NthSunday(d.year,3,2),7,0,0);
   datetime end  =MakeDateTime(d.year,11,NthSunday(d.year,11,1),6,0,0);
   return (utc>=start && utc<end);
  }

int BrokerUTCOffsetSeconds(datetime server_time)
  {
   switch(BrokerTimeMode)
     {
      case BROKER_UTC:
         return 0;

      case BROKER_CET_CEST:
         return (IsEuropeDSTCalendarDate(server_time) ? 2 : 1)*3600;

      case BROKER_EET_EEST:
         return (IsEuropeDSTCalendarDate(server_time) ? 3 : 2)*3600;

      case BROKER_FIXED_UTC_OFFSET:
         return (int)MathRound(FixedBrokerUTCOffsetHours*3600.0);

      case BROKER_PUPRIME:
         return (IsUSDSTCalendarDate(server_time) ? 3 : 2)*3600;
     }
   return 0;
  }

datetime ServerToUTC(datetime server_time)
  {
   return server_time - BrokerUTCOffsetSeconds(server_time);
  }

datetime UTCToItaly(datetime utc)
  {
   return utc + (IsEuropeDSTUtc(utc) ? 2*3600 : 1*3600);
  }

datetime ServerToItaly(datetime server_time)
  {
   return UTCToItaly(ServerToUTC(server_time));
  }

int DateKey(datetime t)
  {
   MqlDateTime d; TimeToStruct(t,d);
   return d.year*10000 + d.mon*100 + d.day;
  }

// New York cash open converted into Italian civil time for the given UTC date.
// Normally 15:30 Italy. During the short US/EU DST mismatch windows it is 14:30 Italy.
void NYOpenItalyForUTCDate(datetime utc,int &hour,int &minute)
  {
   MqlDateTime u; TimeToStruct(utc,u);

   // Build a mid-day UTC anchor on the same date so DST state is unambiguous.
   datetime anchor=MakeDateTime(u.year,u.mon,u.day,12,0,0);
   bool usDST=IsUSDSTUtc(anchor);

   // NY 09:30 ET -> UTC 13:30 if EDT, 14:30 if EST.
   datetime nyOpenUTC=MakeDateTime(u.year,u.mon,u.day,usDST ? 13 : 14,30,0);
   datetime italyOpen=UTCToItaly(nyOpenUTC);

   MqlDateTime it; TimeToStruct(italyOpen,it);
   hour=it.hour;
   minute=it.min;
  }

// Converts the same day's 16:00 New York RTH close into Italian civil time.
// Normally 22:00 Italy; during the short US/EU DST mismatch windows it is 21:00.
void NYRTHCloseItalyForUTCDate(datetime utc,int &hour,int &minute)
  {
   MqlDateTime u; TimeToStruct(utc,u);
   datetime anchor=MakeDateTime(u.year,u.mon,u.day,12,0,0);
   bool usDST=IsUSDSTUtc(anchor);

   // NY 16:00 ET -> UTC 20:00 if EDT, 21:00 if EST.
   int utcHour = NYRTHCloseHourET + (usDST ? 4 : 5);
   datetime closeUTC=MakeDateTime(u.year,u.mon,u.day,utcHour,NYRTHCloseMinuteET,0);
   datetime italyClose=UTCToItaly(closeUTC);

   MqlDateTime it; TimeToStruct(italyClose,it);
   hour=it.hour;
   minute=it.min;
  }

bool GetBufferValue(int handle,int shift,double &value)
  {
   double buf[1];
   if(CopyBuffer(handle,0,shift,1,buf)!=1) return false;
   value=buf[0];
   return (value!=EMPTY_VALUE);
  }

double NormalizePrice(double price)
  {
   int digits=(int)SymbolInfoInteger(_Symbol,SYMBOL_DIGITS);
   return NormalizeDouble(price,digits);
  }

double NormalizeVolume(double volume)
  {
   double vmin=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MIN);
   double vmax=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_MAX);
   double step=SymbolInfoDouble(_Symbol,SYMBOL_VOLUME_STEP);

   if(step<=0.0) return 0.0;

   volume=MathFloor(volume/step)*step;
   volume=MathMax(vmin,MathMin(vmax,volume));

   int vd=0;
   double s=step;
   while(vd<8 && MathAbs(s-MathRound(s))>1e-12)
     {
      s*=10.0;
      vd++;
     }
   return NormalizeDouble(volume,vd);
  }


double ClampDouble(const double v,const double lo,const double hi)
  {
   if(v<lo) return lo;
   if(v>hi) return hi;
   return v;
  }

// Realized volatility = sample standard deviation of M5 log returns.
// Only CLOSED bars are used. Annualization is unnecessary because only a ratio is used.
double RealizedVolAtShift(const int startShift,const int window)
  {
   if(window<2) return 0.0;

   double closes[];
   ArraySetAsSeries(closes,true);
   int need=window+1;
   if(CopyClose(_Symbol,PERIOD_M5,startShift,need,closes)!=need)
      return 0.0;

   double sum=0.0, sumsq=0.0;
   int n=0;
   for(int i=0;i<window;i++)
     {
      double c0=closes[i];
      double c1=closes[i+1];
      if(c0<=0.0 || c1<=0.0) continue;
      double r=MathLog(c0/c1);
      sum+=r;
      sumsq+=r*r;
      n++;
     }
   if(n<2) return 0.0;

   double var=(sumsq-(sum*sum)/(double)n)/(double)(n-1);
   if(var<0.0) var=0.0;
   return MathSqrt(var);
  }

// Directional quality = Kaufman-style Efficiency Ratio (ER) on CLOSED M5 bars.
// ER = net displacement / total path length; 0 = chop, 1 = very directional.
// At entry, startShift=1 includes the just-closed 09:30-09:35 signal candle and no future data.
double DirectionalEfficiencyAtShift(const int startShift,const int window)
  {
   if(window<2) return 0.0;

   double closes[];
   ArraySetAsSeries(closes,true);
   int need=window+1;
   if(CopyClose(_Symbol,PERIOD_M5,startShift,need,closes)!=need)
      return 0.0;

   double path=0.0;
   for(int i=0;i<window;i++)
      path+=MathAbs(closes[i]-closes[i+1]);

   if(path<=0.0) return 0.0;
   double net=MathAbs(closes[0]-closes[window]);
   return ClampDouble(net/path,0.0,1.0);
  }


// ---------------- Regime research features (EX-ANTE only) ----------------
// All calculations use CLOSED bars only. No future data is used.
double MedianPriorRollingVol(const int currentShift,const int shortWindow,const int referencePeriod)
  {
   double vols[]; ArrayResize(vols,referencePeriod); int valid=0;
   for(int k=1;k<=referencePeriod;k++)
     {
      double v=RealizedVolAtShift(currentShift+k,shortWindow);
      if(v>0.0) vols[valid++]=v;
     }
   if(valid<MathMax(10,referencePeriod/2)) return 0.0;
   ArrayResize(vols,valid); ArraySort(vols);
   if((valid%2)==1) return vols[valid/2];
   return 0.5*(vols[valid/2-1]+vols[valid/2]);
  }

double VolPercentile(const double currentVol,const int currentShift,const int shortWindow,const int referencePeriod)
  {
   if(currentVol<=0.0) return 0.5;
   int valid=0,le=0;
   for(int k=1;k<=referencePeriod;k++)
     {
      double v=RealizedVolAtShift(currentShift+k,shortWindow);
      if(v<=0.0) continue;
      valid++;
      if(v<=currentVol) le++;
     }
   if(valid<10) return 0.5;
   return (double)le/(double)valid;
  }

double SlowEMASlopeATR(const int lookback,const double atr)
  {
   if(lookback<1 || atr<=0.0) return 0.0;
   double e1=0.0,eOld=0.0;
   if(!GetBufferValue(hSlowEMA,1,e1)) return 0.0;
   if(!GetBufferValue(hSlowEMA,1+lookback,eOld)) return 0.0;
   return (e1-eOld)/atr;
  }

double RangePercentile(const double currentRange,const int referencePeriod)
  {
   if(currentRange<=0.0) return 0.5;
   int valid=0,le=0;
   for(int k=2;k<=1+referencePeriod;k++)
     {
      double h=iHigh(_Symbol,PERIOD_M5,k), l=iLow(_Symbol,PERIOD_M5,k);
      double r=h-l; if(r<=0.0) continue;
      valid++; if(r<=currentRange) le++;
     }
   if(valid<10) return 0.5;
   return (double)le/(double)valid;
  }

double VolOfVolCV(const int samples,const int shortWindow)
  {
   if(samples<5) return 0.0;
   double sum=0.0,sumsq=0.0; int n=0;
   for(int k=1;k<=samples;k++)
     {
      double v=RealizedVolAtShift(k,shortWindow);
      if(v<=0.0) continue;
      sum+=v; sumsq+=v*v; n++;
     }
   if(n<5) return 0.0;
   double mean=sum/n; if(mean<=0.0) return 0.0;
   double var=(sumsq-sum*sum/n)/MathMax(1,n-1); if(var<0.0) var=0.0;
   return MathSqrt(var)/mean;
  }

double DirectionalPersistence(const int window)
  {
   if(window<2) return 0.5;
   int same=0,valid=0; double prev=0.0;
   for(int k=1;k<=window;k++)
     {
      double c0=iClose(_Symbol,PERIOD_M5,k), c1=iClose(_Symbol,PERIOD_M5,k+1);
      if(c0<=0.0 || c1<=0.0) continue;
      double d=c0-c1; if(d==0.0) continue;
      if(prev!=0.0 && d*prev>0.0) same++;
      if(prev!=0.0) valid++;
      prev=d;
     }
   if(valid<=0) return 0.5;
   return (double)same/(double)valid;
  }

int g_regimeHandle=INVALID_HANDLE;

double CurrentBalanceDrawdownPct()
  {
   static double peak=0.0;
   double b=AccountInfoDouble(ACCOUNT_BALANCE);
   if(peak<=0.0 || b>peak) peak=b;
   if(peak<=0.0) return 0.0;
   return 100.0*(peak-b)/peak;
  }


double PriorMarketRawMean()
  {
   int n=ArraySize(g_marketRawHistory);
   int window=MathMax(1,MarketCenterWindow);
   int take=MathMin(n,window);
   if(take<MathMax(1,MarketCenterMinSamples))
      return 0.0;

   double sum=0.0;
   for(int i=n-take;i<n;i++)
      sum+=g_marketRawHistory[i];

   if(take<=0) return 0.0;
   return sum/(double)take;
  }

void PushMarketRawHistory(const double value)
  {
   if(value<=0.0) return;
   int n=ArraySize(g_marketRawHistory);
   ArrayResize(g_marketRawHistory,n+1);
   g_marketRawHistory[n]=value;
  }

void RegimeOpen()
  {
   if(!WriteRegimeResearchCSV) return;
   string fn="NAS100_RegimeResearch_v2_56.csv";
   g_regimeHandle=FileOpen(fn,FILE_WRITE|FILE_CSV|FILE_ANSI|FILE_COMMON,';');
   if(g_regimeHandle!=INVALID_HANDLE)
     {
      FileWrite(g_regimeHandle,
        "time_server","time_italy","symbol","direction","entry_ref","initial_sl","atr16",
        "body_to_range","ema12_distance_atr","close_location","signal_range_atr",
        "vol20","vol_ref_median200","vol_ratio","vol_percentile200","er20",
        "ema120_slope10_atr","range_percentile200","vol_of_vol_cv50","directional_persistence20",
        "gap_from_prev_close_atr","balance_before","equity_before","balance_dd_pct",
        "adaptive_mult_if_enabled","effective_risk_pct","volume_lots");
      FileFlush(g_regimeHandle);
     }
  }

void RegimeClose()
  {
   if(g_regimeHandle!=INVALID_HANDLE)
     { FileFlush(g_regimeHandle); FileClose(g_regimeHandle); g_regimeHandle=INVALID_HANDLE; }
  }

void RegimeWriteEntry(const bool isLong,const datetime signalBarOpen,const double entryRef,const double sl,
                      const double atr,const double bodyToRange,const double emaDistanceATR,
                      const double closeLocation,const double signalRange,const double volume)
  {
   if(g_regimeHandle==INVALID_HANDLE) return;
   double v=RealizedVolAtShift(1,AdaptiveShortWindow);
   double vref=MedianPriorRollingVol(1,AdaptiveShortWindow,AdaptiveReferencePeriod);
   double vr=(vref>0.0 ? v/vref : 1.0);
   double vp=VolPercentile(v,1,AdaptiveShortWindow,AdaptiveReferencePeriod);
   double er=DirectionalEfficiencyAtShift(1,DirectionalQualityWindow);
   double slope=SlowEMASlopeATR(10,atr);
   double rp=RangePercentile(signalRange,AdaptiveReferencePeriod);
   double vov=VolOfVolCV(50,AdaptiveShortWindow);
   double pers=DirectionalPersistence(20);
   double prevClose=iClose(_Symbol,PERIOD_M5,2);
   double sigOpen=iOpen(_Symbol,PERIOD_M5,1);
   double gap=(atr>0.0 && prevClose>0.0 ? (sigOpen-prevClose)/atr : 0.0);
   datetime italy=ServerToItaly(signalBarOpen);
   FileWrite(g_regimeHandle,
     TimeToString(signalBarOpen,TIME_DATE|TIME_MINUTES),TimeToString(italy,TIME_DATE|TIME_MINUTES),_Symbol,(isLong?"LONG":"SHORT"),
     DoubleToString(entryRef,_Digits),DoubleToString(sl,_Digits),DoubleToString(atr,6),
     DoubleToString(bodyToRange,6),DoubleToString(emaDistanceATR,6),DoubleToString(closeLocation,6),DoubleToString(atr>0.0?signalRange/atr:0.0,6),
     DoubleToString(v,10),DoubleToString(vref,10),DoubleToString(vr,6),DoubleToString(vp,6),DoubleToString(er,6),
     DoubleToString(slope,6),DoubleToString(rp,6),DoubleToString(vov,6),DoubleToString(pers,6),DoubleToString(gap,6),
     DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),2),DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY),2),DoubleToString(CurrentBalanceDrawdownPct(),6),
     DoubleToString(g_lastAdaptiveMult,6),DoubleToString(RiskPercent*g_lastAdaptiveMult,6),DoubleToString(volume,2));
   FileFlush(g_regimeHandle);
  }

// Literal interpretation of the screenshot:
// current short realized volatility / its long reference average,
// clipped to [min multiplier, max multiplier].
// At the 09:35 entry decision, shift=1 is the just-closed signal candle.
double AdaptiveRiskMultiplier()
  {
   g_lastAdaptiveMult=1.0;
   g_lastCurrentVol=0.0;
   g_lastReferenceVol=0.0;
   g_lastDirectionalQuality=0.0;

   if(!UseAdaptiveRisk) return 1.0;
   if(AdaptiveShortWindow<2 || AdaptiveReferencePeriod<2)
      return 1.0;

   double currentVol=RealizedVolAtShift(1,AdaptiveShortWindow);
   g_lastCurrentVol=currentVol;
   if(currentVol<=0.0) return 1.0;

   double referenceVol=0.0;

   if(AdaptiveRiskFormula==AR_SHORT_OVER_LONG)
     {
      referenceVol=RealizedVolAtShift(1,AdaptiveReferencePeriod);
     }
   else if(AdaptiveRiskFormula==AR_CENTERED_MEDIAN_POWER || AdaptiveRiskFormula==AR_VOL_DIRECTIONAL_QUALITY)
     {
      // Robust center: compare current short-window volatility with the MEDIAN
      // of the PRIOR reference-period rolling short-window volatilities.
      // The current observation is deliberately excluded from the reference.
      double vols[];
      ArrayResize(vols,AdaptiveReferencePeriod);
      int valid=0;
      for(int k=1;k<=AdaptiveReferencePeriod;k++)
        {
         double v=RealizedVolAtShift(1+k,AdaptiveShortWindow);
         if(v>0.0)
           {
            vols[valid]=v;
            valid++;
           }
        }

      if(valid<MathMax(10,AdaptiveReferencePeriod/2))
         return 1.0;

      ArrayResize(vols,valid);
      ArraySort(vols);
      if((valid%2)==1)
         referenceVol=vols[valid/2];
      else
         referenceVol=0.5*(vols[valid/2-1]+vols[valid/2]);
     }
   else
     {
      // Legacy formula kept for A/B comparison.
      double sum=0.0;
      int valid=0;
      for(int k=0;k<AdaptiveReferencePeriod;k++)
        {
         double v=RealizedVolAtShift(1+k,AdaptiveShortWindow);
         if(v>0.0)
           {
            sum+=v;
            valid++;
           }
        }

      if(valid<MathMax(10,AdaptiveReferencePeriod/2))
         return 1.0;

      referenceVol=sum/(double)valid;
     }

   g_lastReferenceVol=referenceVol;
   if(referenceVol<=0.0) return 1.0;

   double raw=currentVol/referenceVol;
   if(raw<=0.0) return 1.0;

   double transformed=1.0;
   if(AdaptiveRiskFormula==AR_CENTERED_MEDIAN_POWER)
     {
      // Symmetric centered volatility-only formula.
      transformed=MathPow(raw,AdaptiveStrength);
     }
   else if(AdaptiveRiskFormula==AR_VOL_DIRECTIONAL_QUALITY)
     {
      // v3: low volatility can always reduce risk, but HIGH volatility may increase
      // risk only when the recent M5 path is directionally efficient.
      // This separates clean expansion from noisy/choppy expansion.
      double volMult=MathPow(raw,AdaptiveStrength);
      double er=DirectionalEfficiencyAtShift(1,DirectionalQualityWindow);
      g_lastDirectionalQuality=er;

      double q=0.0;
      if(DirectionalQualityHigh>DirectionalQualityLow)
         q=ClampDouble((er-DirectionalQualityLow)/(DirectionalQualityHigh-DirectionalQualityLow),0.0,1.0);

      if(volMult>1.0)
         transformed=1.0 + (volMult-1.0)*q; // high-vol boost gated by directional quality
      else
         transformed=volMult;              // quiet regimes still de-risk normally
     }
   else
     {
      // Legacy linear damping for backward-compatible comparisons.
      transformed=1.0 + AdaptiveStrength*(raw-1.0);
     }

   // "Card-count" layer:
   // 1) raw market multiplier comes only from EX-ANTE market state;
   // 2) normalize it by the mean of PRIOR executed-trade multipliers so the
   //    adaptive rule does not become hidden permanent leverage;
   // 3) optionally apply a smooth balance-drawdown health throttle.
   double rawMarket=ClampDouble(transformed,AdaptiveMinMultiplier,AdaptiveMaxMultiplier);
   g_lastRawMarketMult=rawMarket;
   g_lastMarketCenter=1.0;
   g_lastHealthMult=1.0;

   double centeredMarket=rawMarket;

   if(AdaptiveRiskFormula==AR_VOL_DIRECTIONAL_QUALITY && UseRollingMarketCenter)
     {
      double center=PriorMarketRawMean();
      if(center>0.0)
        {
         g_lastMarketCenter=center;
         centeredMarket=rawMarket/center;
        }
      else
        {
         // No look-ahead: until enough PRIOR trades exist, do not adapt risk.
         centeredMarket=1.0;
        }
     }

   if(UseEquityHealthThrottle)
     {
      double ddFrac=CurrentBalanceDrawdownPct()/100.0;
      double health=MathExp(-MathMax(0.0,EquityThrottleK)*MathMax(0.0,ddFrac));
      g_lastHealthMult=MathMax(EquityThrottleFloor,health);
     }

   g_lastAdaptiveMult=ClampDouble(centeredMarket*g_lastHealthMult,
                                  AdaptiveMinMultiplier,AdaptiveMaxMultiplier);
   return g_lastAdaptiveMult;
  }

double VolumeFromRisk(double stop_distance)
  {
   if(stop_distance<=0.0) return 0.0;

   double riskBaseValue = (RiskBase==RISK_ON_EQUITY)
                          ? AccountInfoDouble(ACCOUNT_EQUITY)
                          : AccountInfoDouble(ACCOUNT_BALANCE);
   double adaptiveMult=AdaptiveRiskMultiplier();
   double effectiveRiskPct=RiskPercent*adaptiveMult;
   double riskMoney=riskBaseValue*(effectiveRiskPct/100.0);

   if(PrintDebug)
      Print("AdaptiveRiskCentered | base=",DoubleToString(RiskPercent,2),
            "% | mult=",DoubleToString(adaptiveMult,4),
            " | effective=",DoubleToString(effectiveRiskPct,3),"%");

   double tickSize =SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_SIZE);
   double tickValue=SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_VALUE_LOSS);

   if(tickValue<=0.0)
      tickValue=SymbolInfoDouble(_Symbol,SYMBOL_TRADE_TICK_VALUE);

   if(tickSize<=0.0 || tickValue<=0.0) return 0.0;

   double ticks=stop_distance/tickSize;
   double lossPerLot=ticks*tickValue;
   if(lossPerLot<=0.0) return 0.0;

   return NormalizeVolume(riskMoney/lossPerLot);
  }

bool FindOurPosition(ulong &ticket,long &type,double &entry,double &sl)
  {
   for(int i=PositionsTotal()-1;i>=0;i--)
     {
      ulong t=PositionGetTicket(i);
      if(t==0) continue;
      if(!PositionSelectByTicket(t)) continue;

      if(PositionGetString(POSITION_SYMBOL)!=_Symbol) continue;
      if((ulong)PositionGetInteger(POSITION_MAGIC)!=MagicNumber) continue;

      ticket=t;
      type=PositionGetInteger(POSITION_TYPE);
      entry=PositionGetDouble(POSITION_PRICE_OPEN);
      sl=PositionGetDouble(POSITION_SL);
      return true;
     }
   return false;
  }

bool HasOurPosition()
  {
   ulong t; long ty; double e,s;
   return FindOurPosition(t,ty,e,s);
  }

bool HasAnyOpenPositionOnAccount()
  {
   // User requirement: never open a new strategy trade while ANY position
   // is already open on the trading account, regardless of symbol or magic.
   if(BlockOnAnyAccountPosition) return (PositionsTotal()>0);

   // Modalita' convivenza: questo cancello non blocca nulla. Il controllo
   // sulle posizioni DI QUESTO EA resta quello della riga successiva in
   // EvaluateSignalOnClosedM5Bar, che non e' stata toccata.
   return (false);
  }

void ResetPositionTrackingIfFlat()
  {
   if(!HasOurPosition())
     {
      trackedPositionTicket=0;
      initialRiskDistance=0.0;
      trailActivated=false;
      lastTrailingEvalM5Bar=0;
     }
  }

bool IsWithinCrossSearchWindow(datetime barOpenServer)
  {
   datetime italy=ServerToItaly(barOpenServer);
   MqlDateTime d; TimeToStruct(italy,d);

   datetime utc=ServerToUTC(barOpenServer);
   int openH,openM,closeH,closeM;
   NYOpenItalyForUTCDate(utc,openH,openM);
   NYRTHCloseItalyForUTCDate(utc,closeH,closeM);

   int nowMin=d.hour*60+d.min;
   int startMin=openH*60+openM;
   int endMin=closeH*60+closeM;

   return (nowMin>=startMin && nowMin<endMin);
  }

bool IsNYOpeningM5Bar(datetime barOpenServer)
  {
   datetime italy=ServerToItaly(barOpenServer);
   MqlDateTime d; TimeToStruct(italy,d);

   datetime utc=ServerToUTC(barOpenServer);
   int openH,openM;
   NYOpenItalyForUTCDate(utc,openH,openM);

   return (d.hour==openH && d.min==openM);
  }

bool AlreadyTradedThisItalyDay(datetime barOpenServer)
  {
   int key=DateKey(ServerToItaly(barOpenServer));
   return (key==lastTradeDateKey);
  }

void MarkTradeDay(datetime barOpenServer)
  {
   lastTradeDateKey=DateKey(ServerToItaly(barOpenServer));
  }

bool PlaceTrade(bool isLong,double atrValue,datetime signalBarOpen,double bodyToRange,double emaDistanceATR,double closeLocation,double signalRange)
  {
   MqlTick tick;
   if(!SymbolInfoTick(_Symbol,tick)) return false;

   double stopDist=ATRStopMultiplier*atrValue;
   if(stopDist<=0.0) return false;

   double entryRef=isLong ? tick.ask : tick.bid;
   double sl=isLong ? entryRef-stopDist : entryRef+stopDist;

   // Respect broker minimum stop distance.
   double point=SymbolInfoDouble(_Symbol,SYMBOL_POINT);
   int stopsLevel=(int)SymbolInfoInteger(_Symbol,SYMBOL_TRADE_STOPS_LEVEL);
   double minStop=MathMax(0.0,stopsLevel*point);

   if(stopDist<=minStop)
     {
      if(PrintDebug) Print("Stop distance below broker minimum. stopDist=",stopDist," minStop=",minStop);
      return false;
     }

   double volume=VolumeFromRisk(stopDist);
   double auditRiskBase=(RiskBase==RISK_ON_EQUITY ? AccountInfoDouble(ACCOUNT_EQUITY) : AccountInfoDouble(ACCOUNT_BALANCE));
   double auditRiskMoney=auditRiskBase*(RiskPercent*g_lastAdaptiveMult/100.0);
   if(volume<=0.0)
     {
      Print("Could not calculate valid volume. Check symbol tick size/value and account balance.");
      return false;
     }

   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(MaxDeviationPoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   string comment="QL_SessionOpenMom";
   bool ok=false;

   if(isLong)
      ok=trade.Buy(volume,_Symbol,0.0,NormalizePrice(sl),0.0,comment);
   else
      ok=trade.Sell(volume,_Symbol,0.0,NormalizePrice(sl),0.0,comment);

   if(!ok)
     {
      Print("Entry failed. Retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
      return false;
     }

   // Read actual fill and actual SL from the live/tester position.
   ulong ticket; long ptype; double actualEntry=0.0,actualSL=0.0;
   if(FindOurPosition(ticket,ptype,actualEntry,actualSL))
     {
      trackedPositionTicket=ticket;
      initialRiskDistance=MathAbs(actualEntry-actualSL);
      if(initialRiskDistance<=0.0)
         initialRiskDistance=stopDist;
      trailActivated=false;
     }
   else
     {
      initialRiskDistance=stopDist;
      trailActivated=false;
     }

   // Write one row per entry with the exact adaptive risk used.
   double auditEntryPrice=(actualEntry>0.0 ? actualEntry : entryRef);
   double auditStopPrice=(actualSL>0.0 ? actualSL : sl);
   AuditEntry(isLong ? "LONG" : "SHORT",
              auditEntryPrice,auditStopPrice,
              auditRiskMoney,volume);

   RegimeWriteEntry(isLong,signalBarOpen,auditEntryPrice,auditStopPrice,atrValue,
                    bodyToRange,emaDistanceATR,closeLocation,signalRange,volume);

   // Only executed trades become part of the rolling "card count" history.
   if(UseAdaptiveRisk && AdaptiveRiskFormula==AR_VOL_DIRECTIONAL_QUALITY && UseRollingMarketCenter)
      PushMarketRawHistory(g_lastRawMarketMult);

   MarkTradeDay(signalBarOpen);

   if(PrintDebug)
     {
      datetime italy=ServerToItaly(signalBarOpen);
      double fastEmaDbg=0.0;
      GetBufferValue(hFastEMA,1,fastEmaDbg);
      Print("ENTRY ",(isLong?"LONG":"SHORT"),
            " | signal SERVER=",TimeToString(signalBarOpen,TIME_DATE|TIME_MINUTES),
            " | signal ITALY=",TimeToString(italy,TIME_DATE|TIME_MINUTES),
            " | EMA12=",DoubleToString(fastEmaDbg,2),
            " | ATR=",DoubleToString(atrValue,2),
            " | initialSL=",DoubleToString(sl,_Digits),
            " | stopDist=",DoubleToString(stopDist,2),
            " | volume=",DoubleToString(volume,2));
     }
   return true;
  }

void EvaluateSignalOnClosedM5Bar(datetime barOpenServer)
  {
   // Strict account-wide rule: maximum ONE open position on the whole account.
   if(HasAnyOpenPositionOnAccount()) return;
   if(HasOurPosition() && !AllowNewEntryIfPreviousPositionStillOpen) return;
   if(AlreadyTradedThisItalyDay(barOpenServer)) return;

   datetime italy=ServerToItaly(barOpenServer);
   MqlDateTime it; TimeToStruct(italy,it);
   if(it.day_of_week==0 || it.day_of_week==6) return; // Sunday/Saturday

   bool eligible=false;
   bool isLong=false;

   double close1=iClose(_Symbol,PERIOD_M5,1);
   if(close1<=0.0) return;

   double ema1,atr1;
   if(!GetBufferValue(hFastEMA,1,ema1)) return;
   if(!GetBufferValue(hATR,1,atr1)) return;

   // Literal entry rule chosen from the source wording:
   // use ONLY the first M5 candle after 09:30 New York.
   if(!IsNYOpeningM5Bar(barOpenServer)) return;

   if(close1>ema1)      { eligible=true; isLong=true;  }
   else if(close1<ema1) { eligible=true; isLong=false; }
   else                 return;

   // Entry-filter diagnostic: only FILTER the literal signal; never change direction/timing.
   double open1=iOpen(_Symbol,PERIOD_M5,1);
   double high1=iHigh(_Symbol,PERIOD_M5,1);
   double low1 =iLow(_Symbol,PERIOD_M5,1);
   double range1=high1-low1;
   double body1=MathAbs(close1-open1);
   double bodyToRange=(range1>0.0 ? body1/range1 : 0.0);
   double closeLocation=(range1>0.0 ? (close1-low1)/range1 : 0.5); // 0=low, 1=high
   double emaDistanceATR=(atr1>0.0 ? MathAbs(close1-ema1)/atr1 : 0.0);

   // Fixed best Mode 3 filter from the v2.30 diagnostic:
   // 1) opening M5 candle body/range >= 0.075
   // 2) its close is at least 0.05 ATR16 beyond EMA12
   bool filterOK=(bodyToRange>=FixedMinBodyToRange &&
                  emaDistanceATR>=FixedMinEMADistanceATR);

   if(PrintDebug && !filterOK)
      Print("FILTERED fixed Mode3",
            " body/range=",DoubleToString(bodyToRange,3),
            " emaDistATR=",DoubleToString(emaDistanceATR,3));

   if(eligible && filterOK)
      PlaceTrade(isLong,atr1,barOpenServer,bodyToRange,emaDistanceATR,closeLocation,range1);
  }

void ManageTrailing()
  {
   ulong ticket; long ptype; double entry,sl;
   if(!FindOurPosition(ticket,ptype,entry,sl))
     {
      ResetPositionTrackingIfFlat();
      return;
     }

   if(trackedPositionTicket!=ticket)
     {
      trackedPositionTicket=ticket;
      if(initialRiskDistance<=0.0 && sl>0.0)
         initialRiskDistance=MathAbs(entry-sl);
      lastTrailingEvalM5Bar=0;
     }

   if(initialRiskDistance<=0.0) return;

   MqlTick tick;
   if(!SymbolInfoTick(_Symbol,tick)) return;

   bool isLong=(ptype==POSITION_TYPE_BUY);

   // +0.5R remains touch-based/intrabar and is always measured from ORIGINAL 1R.
   double favorableMove=isLong ? (tick.bid-entry) : (entry-tick.ask);
   double activationDistance=TrailActivationR*initialRiskDistance;

   if(!trailActivated && favorableMove>=activationDistance)
     {
      trailActivated=true;
      if(PrintDebug)
         Print("Trailing ARMED: +",DoubleToString(favorableMove/initialRiskDistance,2),"R");
     }

   if(!trailActivated) return;

   // Mode 1: live EMA120 every tick (diagnostic only).
   if(TrailMode==TRAIL_EMA_LIVE_TICK)
     {
      double emaLive;
      if(!GetBufferValue(hSlowEMA,0,emaLive)) return;

      double point=SymbolInfoDouble(_Symbol,SYMBOL_POINT);
      int stopsLevel=(int)SymbolInfoInteger(_Symbol,SYMBOL_TRADE_STOPS_LEVEL);
      int freezeLevel=(int)SymbolInfoInteger(_Symbol,SYMBOL_TRADE_FREEZE_LEVEL);
      double minGap=MathMax(stopsLevel,freezeLevel)*point;
      double desired=NormalizePrice(emaLive);
      bool improve=false;

      if(isLong)
        {
         if((sl==0.0 || desired>sl) && desired<tick.bid-minGap) improve=true;
        }
      else
        {
         if((sl==0.0 || desired<sl) && desired>tick.ask+minGap) improve=true;
        }

      if(improve)
        {
         if(!trade.PositionModify(ticket,desired,0.0) && PrintDebug)
            Print("LIVE EMA120 modify failed. Retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
        }
      return;
     }

   // All other modes are evaluated once when an M5 candle has just closed.
   datetime currentM5Open=iTime(_Symbol,PERIOD_M5,0);
   if(currentM5Open<=0) return;
   if(currentM5Open==lastTrailingEvalM5Bar) return;
   lastTrailingEvalM5Bar=currentM5Open;

   int emaShift=1;
   if(TrailMode==TRAIL_EMA_DELAY_1BAR) emaShift=2;
   if(TrailMode==TRAIL_EMA_DELAY_2BARS) emaShift=3;

   double emaSlow;
   if(!GetBufferValue(hSlowEMA,emaShift,emaSlow)) return;

   // Mode 4: do NOT place EMA as a broker SL. Exit only after a CLOSED M5 candle
   // finishes through the slow EMA. This tests a common interpretation of "trail EMA120".
   if(TrailMode==TRAIL_EMA_CLOSE_EXIT)
     {
      double close1=iClose(_Symbol,PERIOD_M5,1);
      if(close1<=0.0) return;
      bool exitNow=(isLong ? (close1<=emaSlow) : (close1>=emaSlow));
      if(exitNow)
        {
         trade.SetExpertMagicNumber(MagicNumber);
         if(!trade.PositionClose(ticket,MaxDeviationPoints) && PrintDebug)
            Print("EMA120 close-exit failed. Retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
         else if(PrintDebug)
            Print("EMA120 CLOSE EXIT | close=",DoubleToString(close1,_Digits)," EMA=",DoubleToString(emaSlow,_Digits));
        }
      return;
     }

   // Modes 0,2,3,5: broker SL trails a selected EMA120 value and never moves backwards.
   double desired=emaSlow;
   if(TrailMode==TRAIL_EMA_ATR_BUFFER)
     {
      double atrClosed;
      if(!GetBufferValue(hATR,1,atrClosed)) return;
      if(isLong) desired=emaSlow-TrailATRBuffer*atrClosed;
      else       desired=emaSlow+TrailATRBuffer*atrClosed;
     }

   double point=SymbolInfoDouble(_Symbol,SYMBOL_POINT);
   int stopsLevel=(int)SymbolInfoInteger(_Symbol,SYMBOL_TRADE_STOPS_LEVEL);
   int freezeLevel=(int)SymbolInfoInteger(_Symbol,SYMBOL_TRADE_FREEZE_LEVEL);
   double minGap=MathMax(stopsLevel,freezeLevel)*point;
   desired=NormalizePrice(desired);
   bool improve=false;

   if(isLong)
     {
      if((sl==0.0 || desired>sl) && desired<tick.bid-minGap) improve=true;
     }
   else
     {
      if((sl==0.0 || desired<sl) && desired>tick.ask+minGap) improve=true;
     }

   if(improve)
     {
      if(!trade.PositionModify(ticket,desired,0.0) && PrintDebug)
         Print("EMA120 trail modify failed. Retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
      else if(PrintDebug)
         Print("EMA120 trail mode=",EnumToString(TrailMode)," -> SL=",DoubleToString(desired,_Digits),
               " | EMA120=",DoubleToString(emaSlow,_Digits));
     }
  }

void MaybeForceClose()
  {
   if(!ForceCloseAtNYRTHClose) return;

   ulong ticket; long ptype; double entry,sl;
   if(!FindOurPosition(ticket,ptype,entry,sl)) return;

   datetime serverNow=TimeCurrent();
   datetime utcNow=ServerToUTC(serverNow);
   datetime italyNow=UTCToItaly(utcNow);

   int closeH,closeM;
   NYRTHCloseItalyForUTCDate(utcNow,closeH,closeM);

   MqlDateTime d; TimeToStruct(italyNow,d);
   int nowMin=d.hour*60+d.min;
   int closeMin=closeH*60+closeM;

   if(nowMin>=closeMin)
     {
      trade.SetExpertMagicNumber(MagicNumber);
      if(trade.PositionClose(ticket,MaxDeviationPoints))
        {
         if(PrintDebug)
            Print("RTH FORCE CLOSE | Italy=",TimeToString(italyNow,TIME_DATE|TIME_MINUTES),
                  " | NY close converted to Italy=",IntegerToString(closeH),":",
                  (closeM<10 ? "0" : ""),IntegerToString(closeM));
        }
      else if(PrintDebug)
         Print("RTH force close failed. Retcode=",trade.ResultRetcode()," ",trade.ResultRetcodeDescription());
     }
  }

//--------------------------- MT5 events -----------------------------//


void AuditOpen()
  {
   if(!WriteAdaptiveAuditCSV) return;
   string fn="NAS100_AdaptiveRisk_Audit.csv";
   g_auditHandle=FileOpen(fn,FILE_WRITE|FILE_CSV|FILE_ANSI|FILE_COMMON,';');
   if(g_auditHandle!=INVALID_HANDLE)
     {
      FileWrite(g_auditHandle,
                "time","symbol","direction","entry","stop","stop_distance",
                "balance_before","base_risk_pct","adaptive_mult","effective_risk_pct",
                "risk_money","volume_lots","vol_short","vol_reference","directional_quality_er",
                "slow_ema_period","adaptive_formula","adaptive_strength");
      FileFlush(g_auditHandle);
     }
  }

void AuditClose()
  {
   if(g_auditHandle!=INVALID_HANDLE)
     {
      FileFlush(g_auditHandle);
      FileClose(g_auditHandle);
      g_auditHandle=INVALID_HANDLE;
     }
  }

void AuditEntry(const string direction,const double entry,const double stop,
                const double riskMoney,const double volume)
  {
   if(g_auditHandle==INVALID_HANDLE) return;
   FileWrite(g_auditHandle,
             TimeToString(TimeCurrent(),TIME_DATE|TIME_MINUTES|TIME_SECONDS),
             _Symbol,direction,
             DoubleToString(entry,_Digits),DoubleToString(stop,_Digits),
             DoubleToString(MathAbs(entry-stop),_Digits),
             DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE),2),
             DoubleToString(RiskPercent,4),
             DoubleToString(g_lastAdaptiveMult,6),
             DoubleToString(RiskPercent*g_lastAdaptiveMult,6),
             DoubleToString(riskMoney,2),
             DoubleToString(volume,2),
             DoubleToString(g_lastCurrentVol,10),
             DoubleToString(g_lastReferenceVol,10),
             DoubleToString(g_lastDirectionalQuality,6),
             IntegerToString(SlowEMAPeriod),
             IntegerToString((int)AdaptiveRiskFormula),
             DoubleToString(AdaptiveStrength,4));
   FileFlush(g_auditHandle);
  }


//-------------------------- LIVE PANEL ------------------------------//
// VISUAL ONLY. Disabled in Strategy Tester/Optimization.
// It does not trigger, block, size, open, close, or modify strategy trades.

void PanelDelete()
  {
   for(int i=ObjectsTotal(0)-1;i>=0;i--)
     {
      string n=ObjectName(0,i);
      if(StringFind(n,PANEL_PREFIX)==0) ObjectDelete(0,n);
     }
  }

void PRect(string id,int x,int y,int w,int h,color bg,color border)
  {
   string n=PANEL_PREFIX+id;
   if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_RECTANGLE_LABEL,0,0,0);
   ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER);
   ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,n,OBJPROP_XSIZE,w);
   ObjectSetInteger(0,n,OBJPROP_YSIZE,h);
   ObjectSetInteger(0,n,OBJPROP_BGCOLOR,bg);
   ObjectSetInteger(0,n,OBJPROP_BORDER_COLOR,border);
   ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);
  }

void PText(string id,int x,int y,string txt,int size,color c)
  {
   string n=PANEL_PREFIX+id;
   if(ObjectFind(0,n)<0) ObjectCreate(0,n,OBJ_LABEL,0,0,0);
   ObjectSetInteger(0,n,OBJPROP_CORNER,CORNER_LEFT_UPPER);
   ObjectSetInteger(0,n,OBJPROP_XDISTANCE,x);
   ObjectSetInteger(0,n,OBJPROP_YDISTANCE,y);
   ObjectSetInteger(0,n,OBJPROP_FONTSIZE,size);
   ObjectSetInteger(0,n,OBJPROP_COLOR,c);
   ObjectSetString(0,n,OBJPROP_FONT,"Arial");
   ObjectSetInteger(0,n,OBJPROP_SELECTABLE,false);
   ObjectSetInteger(0,n,OBJPROP_HIDDEN,true);
   ObjectSetString(0,n,OBJPROP_TEXT,txt);
  }

double PanelPeriodPnL(datetime fromTime)
  {
   if(!HistorySelect(fromTime,TimeCurrent())) return 0.0;
   double x=0.0;
   for(int i=0;i<HistoryDealsTotal();i++)
     {
      ulong t=HistoryDealGetTicket(i);
      if(t==0) continue;
      if((ulong)HistoryDealGetInteger(t,DEAL_MAGIC)!=MagicNumber) continue;
      if(HistoryDealGetString(t,DEAL_SYMBOL)!=_Symbol) continue;
      long e=HistoryDealGetInteger(t,DEAL_ENTRY);
      if(e!=DEAL_ENTRY_OUT && e!=DEAL_ENTRY_OUT_BY) continue;
      x+=HistoryDealGetDouble(t,DEAL_PROFIT)
        +HistoryDealGetDouble(t,DEAL_SWAP)
        +HistoryDealGetDouble(t,DEAL_COMMISSION);
     }
   return x;
  }

void PanelPeriodStarts(datetime &day0,datetime &week0,datetime &month0)
  {
   MqlDateTime d; TimeToStruct(TimeCurrent(),d);
   day0=MakeDateTime(d.year,d.mon,d.day,0,0,0);
   month0=MakeDateTime(d.year,d.mon,1,0,0,0);
   int back=(d.day_of_week==0 ? 6 : d.day_of_week-1);
   week0=day0-back*86400;
  }


string LiveDiagnosticStatus()
  {
   // READ-ONLY diagnostics. Uses ONLY helpers/variables already present in v2.57.
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))
      return "MT5 NON CONNESSO";
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
      return "ALGO TRADING OFF";
   if(!MQLInfoInteger(MQL_TRADE_ALLOWED))
      return "EA: TRADING NON CONSENTITO";
   if(!AccountInfoInteger(ACCOUNT_TRADE_ALLOWED))
      return "CONTO: TRADING NON CONSENTITO";
   if(HasAnyOpenPositionOnAccount() || HasOurPosition())
      return "POSIZIONE GIA APERTA";

   datetime serverNow=TimeCurrent();
   datetime italyNow=ServerToItaly(serverNow);
   MqlDateTime it; TimeToStruct(italyNow,it);

   if(it.day_of_week==0 || it.day_of_week==6)
      return "WEEKEND - NESSUN SETUP";

   datetime utcNow=ServerToUTC(serverNow);
   int openH,openM;
   NYOpenItalyForUTCDate(utcNow,openH,openM);

   int nowMin=it.hour*60+it.min;
   int openMin=openH*60+openM;

   if(nowMin<openMin)
      return "IN ATTESA OPEN NY 09:30";
   if(nowMin<openMin+5)
      return "M5 OPEN NY IN FORMAZIONE";

   // Locate today's exact NY-opening M5 using the same strategy predicate.
   int foundShift=-1;
   int bars=MathMin(Bars(_Symbol,PERIOD_M5),400);
   for(int sh=1;sh<bars;sh++)
     {
      datetime bt=iTime(_Symbol,PERIOD_M5,sh);
      if(bt<=0) continue;

      datetime bit=ServerToItaly(bt);
      if(DateKey(bit)!=DateKey(italyNow))
        {
         if(bit<italyNow-86400) break;
         continue;
        }

      if(IsNYOpeningM5Bar(bt))
        {
         foundShift=sh;
         break;
        }
     }

   if(foundShift<0)
      return "CANDELA OPEN NY NON TROVATA";

   double o=iOpen(_Symbol,PERIOD_M5,foundShift);
   double h=iHigh(_Symbol,PERIOD_M5,foundShift);
   double l=iLow(_Symbol,PERIOD_M5,foundShift);
   double c=iClose(_Symbol,PERIOD_M5,foundShift);
   if(o<=0.0 || h<=0.0 || l<=0.0 || c<=0.0)
      return "DATI CANDELA NON DISPONIBILI";

   double emaFast[];
   ArraySetAsSeries(emaFast,true);
   if(CopyBuffer(hFastEMA,0,foundShift,1,emaFast)!=1)
      return "EMA12 NON DISPONIBILE";

   double atr[];
   ArraySetAsSeries(atr,true);
   if(CopyBuffer(hATR,0,foundShift,1,atr)!=1 || atr[0]<=0.0)
      return "ATR16 NON DISPONIBILE";

   double range=h-l;
   if(range<=0.0)
      return "SETUP FILTRATO: RANGE ZERO";

   double bodyToRange=MathAbs(c-o)/range;
   double emaDistanceATR=MathAbs(c-emaFast[0])/atr[0];

   if(bodyToRange<FixedMinBodyToRange)
      return "SETUP FILTRATO: BODY/RANGE";
   if(emaDistanceATR<FixedMinEMADistanceATR)
      return "SETUP FILTRATO: DISTANZA EMA12";

   if(c>emaFast[0])
      return "SETUP LONG VALIDO";
   if(c<emaFast[0])
      return "SETUP SHORT VALIDO";

   return "NESSUN SEGNALE";
  }

void UpdateLivePanel()
  {
   if(!g_livePanelEnabled) return;

   color bg=C'13,15,22', card=C'21,24,34', edge=C'80,61,115';
   color white=C'235,238,245', muted=C'158,164,178';
   color green=C'82,214,143', red=C'244,101,105', accent=C'190,102,255';

   MqlTick q; double spread=0.0;
   if(SymbolInfoTick(_Symbol,q)) spread=q.ask-q.bid;

   double bal=AccountInfoDouble(ACCOUNT_BALANCE);
   double eq=AccountInfoDouble(ACCOUNT_EQUITY);
   double floating=eq-bal;
   double effPct=RiskPercent*g_lastAdaptiveMult;
   double baseVal=(RiskBase==RISK_ON_EQUITY ? eq : bal);
   double riskMoney=baseVal*effPct/100.0;

   ulong pt=0; long typ=-1; double pe=0.0,ps=0.0;
   bool hasPos=FindOurPosition(pt,typ,pe,ps);
   string pos=hasPos ? (typ==POSITION_TYPE_BUY?"LONG":"SHORT") : "NESSUNA";
   double curR=0.0;
   if(hasPos && SymbolInfoTick(_Symbol,q) && initialRiskDistance>0.0)
     {
      double px=(typ==POSITION_TYPE_BUY?q.bid:q.ask);
      curR=(typ==POSITION_TYPE_BUY ? px-pe : pe-px)/initialRiskDistance;
     }

   datetime d0,w0,m0; PanelPeriodStarts(d0,w0,m0);
   double pd=PanelPeriodPnL(d0), pw=PanelPeriodPnL(w0), pm=PanelPeriodPnL(m0);

   // Frame / title
   PRect("BG",12,24,370,430,bg,accent);
   PText("T1",38,42,"NAS100",20,white);
   PText("T2",38,69,"M5 MOMENTUM  |  v2.57",10,accent);
   string diag=LiveDiagnosticStatus();
   bool healthy=(diag=="IN ATTESA OPEN NY 09:30" ||
                 diag=="M5 09:30-09:35 IN FORMAZIONE" ||
                 diag=="SETUP LONG VALIDO / VERIFICA ORDINE" ||
                 diag=="SETUP SHORT VALIDO / VERIFICA ORDINE");
   PText("BOT",38,98,"BOT: "+(TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)?"ATTIVO":"BLOCCATO"),11,
         TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)?green:red);
   PText("SP",235,99,"Spread "+DoubleToString(spread,2)+" pt",9,muted);

   PRect("DIAGBG",28,122,338,56,card,edge);
   PText("DH",42,132,"DIAGNOSTICA LIVE",10,white);
   PText("DS",42,153,diag,9,(healthy?green:((StringFind(diag,"FILTRATO")>=0 || StringFind(diag,"WEEKEND")>=0)?muted:red)));

   // Performance
   PRect("C1",28,188,338,92,card,edge);
   PText("H1",42,199,"PERFORMANCE",11,white);
   PText("B1",42,224,"Balance  "+DoubleToString(bal,2),9,muted);
   PText("E1",205,224,"Equity  "+DoubleToString(eq,2),9,muted);
   PText("F1",42,246,"Floating  "+DoubleToString(floating,2),9,(floating>=0?green:red));
   PText("D1",205,246,"Today  "+DoubleToString(pd,2),9,(pd>=0?green:red));

   // Risk
   PRect("C2",28,290,338,72,card,edge);
   PText("H2",42,301,"RISK",11,white);
   PText("R1",42,325,"Base "+DoubleToString(RiskPercent,2)+"%   Adaptive x"+DoubleToString(g_lastAdaptiveMult,3),9,muted);
   PText("R2",42,343,"Effective "+DoubleToString(effPct,2)+"%   Risk $ "+DoubleToString(riskMoney,2),9,white);

   // Trade state
   PRect("C3",28,372,338,58,card,edge);
   PText("H3",42,383,"OPERAZIONE",11,white);
   PText("P1",42,407,pos,10,(hasPos?green:muted));
   PText("P2",150,407,"R "+DoubleToString(curR,2)+"   Trail "+(trailActivated?"ON":"OFF"),9,muted);

   PText("WPM",38,436,"Week "+DoubleToString(pw,2)+"   Month "+DoubleToString(pm,2),8,muted);

   ChartRedraw(0);
  }

int OnInit()
  {
   g_livePanelEnabled = !(bool)MQLInfoInteger(MQL_TESTER) &&
                        !(bool)MQLInfoInteger(MQL_OPTIMIZATION);
   if(g_livePanelEnabled) PanelDelete();
   ArrayResize(g_marketRawHistory,0);
   g_lastRawMarketMult=1.0;
   g_lastMarketCenter=1.0;
   g_lastHealthMult=1.0;

   AuditOpen();
   RegimeOpen();
   if(_Period!=PERIOD_M5)
      Print("WARNING: attach/test this EA on M5. Indicators/signals are hard-coded to M5.");

   hFastEMA=iMA(_Symbol,PERIOD_M5,FastEMAPeriod,0,MODE_EMA,PRICE_CLOSE);
   hSlowEMA=iMA(_Symbol,PERIOD_M5,SlowEMAPeriod,0,MODE_EMA,PRICE_CLOSE);
   hATR=iATR(_Symbol,PERIOD_M5,ATRPeriod);

   if(hFastEMA==INVALID_HANDLE || hSlowEMA==INVALID_HANDLE || hATR==INVALID_HANDLE)
     {
      Print("Failed to create indicator handles.");
      return INIT_FAILED;
     }

   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(MaxDeviationPoints);
   trade.SetTypeFillingBySymbol(_Symbol);

   Print("Session-Open Momentum Card-Count Adaptive Risk v2.57 initialized.");
   Print("ENTRY FIXED: first M5 09:30-09:35 New York; ATR16; TrailMode4; body/range>=0.075; EMA12 distance>=0.05 ATR. Only position sizing changes.");
   Print("SL: 8xATR(signal candle). ATR period FIXED at ATR(16) for this diagnostic.");
   Print("+0.5R: measured permanently from ORIGINAL entry-to-initial-SL risk distance; intrabar touch arms trailing.");
   Print("TRAIL MODE: ",EnumToString(TrailMode)," | ATR buffer=",DoubleToString(TrailATRBuffer,2));
   Print("ACCOUNT RULE: maximum ONE open position on the entire account; if any position exists, no new entry.");
   Print("No forced session close: strategy position may remain open overnight/across days.");
   Print("BrokerTimeMode=",EnumToString(BrokerTimeMode),
         " | PU Prime GMT+2/GMT+3 handled from US DST dates.");
   Print("Risk sizing diagnostic: base=",DoubleToString(RiskPercent,2),
         "% | adaptive=",UseAdaptiveRisk,
         " | formula=",IntegerToString((int)AdaptiveRiskFormula),
         " | strength=",DoubleToString(AdaptiveStrength,2),
         " | realized-vol short=",AdaptiveShortWindow,
         " | reference=",AdaptiveReferencePeriod,
         " | clamp=",DoubleToString(AdaptiveMinMultiplier,2),"x..",
         DoubleToString(AdaptiveMaxMultiplier,2),"x.");
   Print("Card-count normalization: rollingCenter=",UseRollingMarketCenter,
         " | centerWindow=",MarketCenterWindow,
         " | minSamples=",MarketCenterMinSamples,
         " | equityThrottle=",UseEquityHealthThrottle,
         " | throttleK=",DoubleToString(EquityThrottleK,2),
         " | throttleFloor=",DoubleToString(EquityThrottleFloor,2));
   return INIT_SUCCEEDED;
  }

void OnDeinit(const int reason)
  {
   if(g_livePanelEnabled) PanelDelete();
   AuditClose();
   RegimeClose();
   if(hFastEMA!=INVALID_HANDLE) IndicatorRelease(hFastEMA);
   if(hSlowEMA!=INVALID_HANDLE) IndicatorRelease(hSlowEMA);
   if(hATR!=INVALID_HANDLE)     IndicatorRelease(hATR);
  }

void OnTick()
  {
   // Tick-level activation + trailing management
   ManageTrailing();
   MaybeForceClose();

   // Process each newly closed M5 candle exactly once
   datetime closedBarOpen=iTime(_Symbol,PERIOD_M5,1);
   if(closedBarOpen<=0) return;

   if(closedBarOpen!=lastProcessedClosedBar)
     {
      lastProcessedClosedBar=closedBarOpen;
      EvaluateSignalOnClosedM5Bar(closedBarOpen);
     }

   ResetPositionTrackingIfFlat();

   // Visual diagnostics only; disabled entirely in tester/optimization.
   if(g_livePanelEnabled) UpdateLivePanel();
  }
//+------------------------------------------------------------------+
