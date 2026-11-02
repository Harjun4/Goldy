export type AssetType = 'XAU/USD' | 'ANTAM';
export type ThemeMode = 'dark' | 'light';
export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export interface PredictionComparisonRecord {
  id: string;
  run_timestamp: string;
  base_date: string;
  target_date: string;
  horizon: 'H1' | 'H7' | 'H30';
  asset: 'XAU/USD' | 'ANTAM';
  base_price: number;
  predicted_price: number;
  predicted_return_pct: number;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence_score: number;
  engine_name: string;
  actual_price: number | null;
  actual_return_pct: number | null;
  evaluated_at: string | null;
  error_abs: number | null;
  error_pct: number | null;
  direction_hit: boolean | null;
  status: 'PENDING' | 'EVALUATED';
  created_at: string;
  updated_at?: string;
}

export interface ComparisonSummaryMetrics {
  totalRuns: number;
  evaluatedCount: number;
  pendingCount: number;
  directionalAccuracyPct: number;
  averageMapePct: number;
  averageMaeUsd: number;
  averageMaeAntam?: number;
  asset: 'XAU/USD' | 'ANTAM' | 'ALL';
}

export interface CandleData {
  time: string; // YYYY-MM-DD or Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface PredictionHorizon {
  days: number;
  label: string; // 'H+1' | 'H+7' | 'H+30'
  targetPrice: number;
  conservativePrice?: number;
  changePct: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
  riskToleranceRmse?: number;
}

export interface ModelMetrics {
  slidingWindowDays: number;
  rmse: number;
  accuracyRate: string;
  mae: number;
  epochsTrained: number;
  modelType: string;
  engineName?: string;
  riskRmseOz?: string;
  featuresUsed: string[];
}

export interface TechnicalIndicators {
  rsi: number;
  rsiStatus?: string;
  maCrossStatus?: string;
  sma20: number;
  ema50: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface MacroFactors {
  dxyIndex: number;
  dxyChange: number;
  dxyStatus?: string;
  fedRateExpectation: string;
  us10yYield: number;
  usdIdrRate: number;
  usdIdrStatus?: string;
  geopoliticalSentiment: 'HIGH_RISK' | 'MODERATE' | 'LOW';
  vixValue?: number;
  vixStatus?: string;
  vixInterpretation?: string;
}

export interface AssetAnalysisData {
  asset: AssetType;
  displayName: string;
  currency: 'USD' | 'IDR';
  unit: 'oz' | 'gram';
  lastPrice: number;
  previousClose: number;
  dailyChange: number;
  dailyChangePct: number;
  signal: SignalType;
  signalLabel?: string;
  signalReason: string;
  thresholdBuy?: string;
  thresholdSell?: string;
  contextNote?: {
    xauTrading: string;
    antamPhysical: string;
  };
  predictions: {
    h1: PredictionHorizon;
    h7: PredictionHorizon;
    h30: PredictionHorizon;
  };
  metrics: ModelMetrics;
  technicals: TechnicalIndicators;
  macro: MacroFactors;
  historicalCandles: CandleData[];
  predictedCandles: { time: string; value: number }[];
  timestamp: string;
}

export interface GoldyMasterPayload {
  timestamp: string;
  active_asset: string;
  current_data: {
    xau_usd: {
      price: number;
      change_pct: number;
      open_today: number;
      high_today: number;
      low_today: number;
    };
    antam_idr: {
      price_per_gram: number;
      kurs_usd_idr: number;
      change_pct: number;
    };
  };
  ai_recommendation: {
    signal: SignalType;
    signal_label: string;
    reasoning: string;
    threshold_buy: string;
    threshold_sell: string;
    tolerance: string;
    context_note: {
      xau_trading: string;
      antam_physical: string;
    };
  };
  projections: {
    H1: {
      horizon: string;
      target_price_usd_base: number;
      target_price_usd_conservative: number;
      return_pct_base: number;
      target_price_antam_base: number;
      target_price_antam_conservative: number;
      risk_tolerance_rmse: number;
      confidence_score: number;
    };
    H7: {
      horizon: string;
      target_price_usd_base: number;
      target_price_usd_conservative: number;
      return_pct_base: number;
      target_price_antam_base: number;
      target_price_antam_conservative: number;
      risk_tolerance_rmse: number;
      confidence_score: number;
    };
    H30: {
      horizon: string;
      target_price_usd_base: number;
      target_price_usd_conservative: number;
      return_pct_base: number;
      target_price_antam_base: number;
      target_price_antam_conservative: number;
      risk_tolerance_rmse: number;
      confidence_score: number;
    };
  };
  technical_indicators: {
    support_resistance: {
      R2: number;
      R1: number;
      S1: number;
      S2: number;
    };
    momentum: {
      rsi_14: number;
      rsi_status: string;
      ma_cross_status: string;
      sma_20: number;
      ema_50: number;
    };
  };
  macro_sensitivities: {
    dxy: {
      value: number;
      change_pct: number;
      status: string;
      interpretation: string;
    };
    us10y: {
      yield_pct: number;
      interpretation: string;
    };
    usd_idr: {
      rate: number;
      status: string;
      interpretation: string;
    };
    geopolitics_vix: {
      vix_value: number;
      status: string;
      interpretation: string;
    };
  };
  chart_series: {
    candlestick_history: CandleData[];
    projection_path: {
      time: string;
      price: number;
      type: string;
    }[];
  };
  model_metadata: {
    engine_name: string;
    architecture: string;
    backtest_accuracy: string;
    risk_rmse_oz: string;
  };
}

export interface GoldyApiPayload {
  asset: string;
  last_price: number;
  predicted_h1: number;
  predicted_h7: number;
  signal: SignalType;
  change_percentage: string;
  accuracy_rate: string;
  timestamp: string;
  details?: {
    predicted_h30?: number;
    currency?: string;
    unit?: string;
    rmse?: number | string;
    sliding_window_days?: number;
    rule_applied?: string;
    model?: string;
    architecture?: string;
    confidence_score?: number;
    conservative_targets?: {
      h1: number;
      h7: number;
      h30: number;
    };
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    signal?: SignalType;
    asset?: AssetType;
    predicted_h1?: number;
    isModeBPayload?: boolean;
  };
}

export type AlertCondition = 'ABOVE' | 'BELOW' | 'PCT_GAIN' | 'PCT_DROP';

export interface PriceAlert {
  id: string;
  asset: AssetType;
  condition: AlertCondition;
  targetValue: number; // target price (e.g. 4580) or % change (e.g. 0.5)
  initialPrice: number; // snapshot when created
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  active: boolean;
  note?: string;
  soundEnabled: boolean;
}

export interface AlertNotification {
  id: string;
  alertId?: string;
  asset: AssetType;
  title: string;
  message: string;
  timestamp: string;
  price: number;
  read: boolean;
  type: 'ALERT_TRIGGERED' | 'LSTM_SIGNAL_SHIFT' | 'DATA_SYNC';
}

export type TimeframeType = '1D' | '1W' | '1M' | '1Y' | 'ALL';
export type ChartStyleType = 'CANDLESTICK' | 'AREA' | 'LINE';

export interface IndicatorSettings {
  showSma20: boolean;
  showEma50: boolean;
  showBollinger: boolean;
  showVolume: boolean;
  showRsi: boolean;
  showLstmForecast: boolean;
}


