export type AssetType = 'XAU/USD' | 'ANTAM';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

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
  changePct: number;
  upperBound: number;
  lowerBound: number;
  confidence: number;
}

export interface ModelMetrics {
  slidingWindowDays: number;
  rmse: number;
  accuracyRate: string;
  mae: number;
  epochsTrained: number;
  modelType: string;
  featuresUsed: string[];
}

export interface TechnicalIndicators {
  rsi: number;
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
  fedRateExpectation: string;
  us10yYield: number;
  usdIdrRate: number;
  geopoliticalSentiment: 'HIGH_RISK' | 'MODERATE' | 'LOW';
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
  signalReason: string;
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
    rmse?: number;
    sliding_window_days?: number;
    rule_applied?: string;
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
  targetValue: number; // target price (e.g. 2530) or % change (e.g. 0.5)
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
  type: 'ALERT_TRIGGERED' | 'LSTM_SIGNAL_SHIFT';
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

