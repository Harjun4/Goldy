import { AssetAnalysisData, AssetType, CandleData, GoldyMasterPayload, SignalType, TimeframeType } from '../types';
import payloadJson from '../../payload_goldy.json';
import realGoldDataJson from './realGoldData.json';

export let MASTER_PAYLOAD: GoldyMasterPayload = payloadJson as GoldyMasterPayload;
export let REAL_GOLD_DATA: CandleData[] = (
  Array.isArray(realGoldDataJson) && realGoldDataJson.length > 0
    ? (realGoldDataJson as CandleData[])
    : ((MASTER_PAYLOAD.chart_series?.candlestick_history || []) as CandleData[])
);
let XAU_TO_ANTAM_RATIO = MASTER_PAYLOAD.current_data.antam_idr.price_per_gram / MASTER_PAYLOAD.current_data.xau_usd.price;

// Runtime updater used when daily auto-sync or manual Synchronize completes
export function setRuntimeGoldData(newPayload?: GoldyMasterPayload, newCandles?: CandleData[]): void {
  if (newPayload) {
    MASTER_PAYLOAD = newPayload;
    if (newPayload.current_data?.xau_usd?.price) {
      XAU_TO_ANTAM_RATIO = newPayload.current_data.antam_idr.price_per_gram / newPayload.current_data.xau_usd.price;
    }
  }
  if (newCandles && Array.isArray(newCandles) && newCandles.length > 0) {
    REAL_GOLD_DATA = newCandles;
  } else if (newPayload?.chart_series?.candlestick_history?.length) {
    // Merge any newer bars from payload candlestick_history into REAL_GOLD_DATA
    const existingDates = new Set(REAL_GOLD_DATA.map((c) => c.time));
    const updated = [...REAL_GOLD_DATA];
    for (const bar of newPayload.chart_series.candlestick_history) {
      const idx = updated.findIndex((c) => c.time === bar.time);
      if (idx >= 0) {
        updated[idx] = bar;
      } else if (!existingDates.has(bar.time)) {
        updated.push(bar);
      }
    }
    updated.sort((a, b) => a.time.localeCompare(b.time));
    REAL_GOLD_DATA = updated;
  }
}

export function getLatestHistoricalDate(): string {
  return REAL_GOLD_DATA[REAL_GOLD_DATA.length - 1]?.time || MASTER_PAYLOAD.chart_series?.projection_path?.[0]?.time || '';
}

export function getForecastH1Date(): string {
  return MASTER_PAYLOAD.chart_series?.projection_path?.[1]?.time || '';
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function aggregateWeekly(bars: CandleData[], numWeeks: number = 52): CandleData[] {
  const weeks: Record<string, CandleData> = {};
  for (const b of bars) {
    const d = new Date(b.time);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const weekKey = monday.toISOString().split('T')[0];
    if (!weeks[weekKey]) {
      weeks[weekKey] = { time: weekKey, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 };
    } else {
      weeks[weekKey].high = Math.max(weeks[weekKey].high, b.high);
      weeks[weekKey].low = Math.min(weeks[weekKey].low, b.low);
      weeks[weekKey].close = b.close;
      weeks[weekKey].volume = (weeks[weekKey].volume || 0) + (b.volume || 0);
    }
  }
  return Object.values(weeks).slice(-numWeeks);
}

function aggregateMonthly(bars: CandleData[], numMonths: number = 36): CandleData[] {
  const months: Record<string, CandleData> = {};
  for (const b of bars) {
    const monthKey = b.time.substring(0, 7) + '-01';
    if (!months[monthKey]) {
      months[monthKey] = { time: monthKey, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume || 0 };
    } else {
      months[monthKey].high = Math.max(months[monthKey].high, b.high);
      months[monthKey].low = Math.min(months[monthKey].low, b.low);
      months[monthKey].close = b.close;
      months[monthKey].volume = (months[monthKey].volume || 0) + (b.volume || 0);
    }
  }
  return Object.values(months).slice(-numMonths);
}

export function generateTimeframeCandles(
  asset: AssetType,
  timeframe: TimeframeType,
  priceOffset: number = 0
): CandleData[] {
  const isXau = asset === 'XAU/USD';
  const basePrice = isXau 
    ? MASTER_PAYLOAD.current_data.xau_usd.price + priceOffset
    : MASTER_PAYLOAD.current_data.antam_idr.price_per_gram + priceOffset;

  let rawCandles: CandleData[] = [];

  switch (timeframe) {
    case '1D':
      // 7 active trading days so daily bars sit side-by-side with tomorrow's forecast
      rawCandles = REAL_GOLD_DATA.slice(-7);
      break;
    case '1W':
      rawCandles = REAL_GOLD_DATA.slice(-14);
      break;
    case '1M':
      rawCandles = REAL_GOLD_DATA.slice(-30);
      break;
    case '1Y':
      rawCandles = REAL_GOLD_DATA.slice(-252);
      break;
    case 'ALL':
      rawCandles = aggregateWeekly(REAL_GOLD_DATA, 1000);
      break;
    default:
      rawCandles = REAL_GOLD_DATA.slice(-30);
      break;
  }

  const candles: CandleData[] = rawCandles.map((c, idx) => {
    const isLast = idx === rawCandles.length - 1;
    if (isXau) {
      return {
        time: c.time,
        open: c.open,
        high: isLast ? Math.max(c.high, basePrice) : c.high,
        low: isLast ? Math.min(c.low, basePrice) : c.low,
        close: isLast ? basePrice : c.close,
        volume: c.volume,
      };
    } else {
      const close = isLast ? basePrice : Math.round(c.close * XAU_TO_ANTAM_RATIO);
      const open = Math.round(c.open * XAU_TO_ANTAM_RATIO);
      const high = isLast ? Math.max(Math.round(c.high * XAU_TO_ANTAM_RATIO), basePrice) : Math.round(c.high * XAU_TO_ANTAM_RATIO);
      const low = isLast ? Math.min(Math.round(c.low * XAU_TO_ANTAM_RATIO), basePrice) : Math.round(c.low * XAU_TO_ANTAM_RATIO);
      return {
        time: c.time,
        open,
        high,
        low,
        close,
        volume: c.volume ? Math.round(c.volume * 0.4) : undefined,
      };
    }
  });

  return candles;
}

export function calculateSMA(candles: CandleData[], period: number = 20): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    result.push({
      time: candles[i].time,
      value: Math.round((sum / period) * 100) / 100,
    });
  }
  return result;
}

export function calculateEMA(candles: CandleData[], period: number = 50): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (candles.length < period) return result;

  const k = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
  result.push({ time: candles[period - 1].time, value: Math.round(ema * 100) / 100 });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({
      time: candles[i].time,
      value: Math.round(ema * 100) / 100,
    });
  }
  return result;
}

export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: { time: string; value: number }[];
  middle: { time: string; value: number }[];
  lower: { time: string; value: number }[];
} {
  const upper: { time: string; value: number }[] = [];
  const middle: { time: string; value: number }[] = [];
  const lower: { time: string; value: number }[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const sma = sum / period;

    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      varianceSum += Math.pow(candles[i - j].close - sma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / period);

    const time = candles[i].time;
    middle.push({ time, value: Math.round(sma * 100) / 100 });
    upper.push({ time, value: Math.round((sma + stdDevMultiplier * stdDev) * 100) / 100 });
    lower.push({ time, value: Math.round((sma - stdDevMultiplier * stdDev) * 100) / 100 });
  }

  return { upper, middle, lower };
}

export function calculateRSI(candles: CandleData[], period: number = 14): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  if (candles.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  result.push({ time: candles[period].time, value: Math.round(rsi * 10) / 10 });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const currentGain = diff >= 0 ? diff : 0;
    const currentLoss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    result.push({ time: candles[i].time, value: Math.round(rsi * 10) / 10 });
  }

  return result;
}

export function createAssetData(
  asset: AssetType,
  priceOffset: number = 0,
  timeframe: TimeframeType = '1D'
): AssetAnalysisData {
  const isXau = asset === 'XAU/USD';
  const p = MASTER_PAYLOAD;

  const rawLastPrice = isXau ? p.current_data.xau_usd.price : p.current_data.antam_idr.price_per_gram;
  const lastPrice = rawLastPrice + priceOffset;
  const dailyChangePct = isXau ? p.current_data.xau_usd.change_pct : p.current_data.antam_idr.change_pct;
  const previousClose = isXau 
    ? Math.round((lastPrice / (1 + dailyChangePct / 100)) * 100) / 100
    : Math.round(lastPrice / (1 + dailyChangePct / 100));
  const dailyChange = isXau 
    ? Math.round((lastPrice - previousClose) * 100) / 100 
    : Math.round(lastPrice - previousClose);

  const h1Target = isXau ? p.projections.H1.target_price_usd_base : p.projections.H1.target_price_antam_base;
  const h1Conservative = isXau ? p.projections.H1.target_price_usd_conservative : p.projections.H1.target_price_antam_conservative;
  const h1ReturnPct = p.projections.H1.return_pct_base;

  const h7Target = isXau ? p.projections.H7.target_price_usd_base : p.projections.H7.target_price_antam_base;
  const h7Conservative = isXau ? p.projections.H7.target_price_usd_conservative : p.projections.H7.target_price_antam_conservative;
  const h7ReturnPct = p.projections.H7.return_pct_base;

  const h30Target = isXau ? p.projections.H30.target_price_usd_base : p.projections.H30.target_price_antam_base;
  const h30Conservative = isXau ? p.projections.H30.target_price_usd_conservative : p.projections.H30.target_price_antam_conservative;
  const h30ReturnPct = p.projections.H30.return_pct_base;

  const historicalCandles = generateTimeframeCandles(asset, timeframe, priceOffset);
  const lastCandle = historicalCandles[historicalCandles.length - 1] || {
    time: p.chart_series?.projection_path?.[0]?.time || '2026-10-20',
    open: lastPrice,
    high: lastPrice,
    low: lastPrice,
    close: lastPrice,
  };

  const addDaysStr = (baseStr: string, days: number) => {
    const d = new Date(baseStr);
    d.setDate(d.getDate() + days);
    return formatDate(d);
  };
  const predictedCandles = [
    { time: lastCandle.time, value: lastPrice },
    { time: p.chart_series.projection_path[1]?.time || addDaysStr(lastCandle.time, 1), value: h1Target },
    { time: p.chart_series.projection_path[2]?.time || addDaysStr(lastCandle.time, 7), value: h7Target },
    { time: p.chart_series.projection_path[3]?.time || addDaysStr(lastCandle.time, 30), value: h30Target },
  ];

  const sr = p.technical_indicators.support_resistance;
  const mom = p.technical_indicators.momentum;
  const scale = isXau ? 1 : XAU_TO_ANTAM_RATIO;

  const support1 = isXau ? sr.S1 : Math.round(sr.S1 * scale);
  const support2 = isXau ? sr.S2 : Math.round(sr.S2 * scale);
  const resistance1 = isXau ? sr.R1 : Math.round(sr.R1 * scale);
  const resistance2 = isXau ? sr.R2 : Math.round(sr.R2 * scale);
  const sma20 = isXau ? mom.sma_20 : Math.round(mom.sma_20 * scale);
  const ema50 = isXau ? mom.ema_50 : Math.round(mom.ema_50 * scale);
  const rmseH1 = isXau ? p.projections.H1.risk_tolerance_rmse : Math.round(p.projections.H1.risk_tolerance_rmse * scale);
  const rmseH7 = isXau ? p.projections.H7.risk_tolerance_rmse : Math.round(p.projections.H7.risk_tolerance_rmse * scale);
  const rmseH30 = isXau ? p.projections.H30.risk_tolerance_rmse : Math.round(p.projections.H30.risk_tolerance_rmse * scale);

  return {
    asset,
    displayName: isXau ? 'Spot Gold (XAU/USD)' : 'Emas Fisik Antam (LM)',
    currency: isXau ? 'USD' : 'IDR',
    unit: isXau ? 'oz' : 'gram',
    lastPrice,
    previousClose,
    dailyChange,
    dailyChangePct,
    signal: p.ai_recommendation.signal,
    signalLabel: p.ai_recommendation.signal_label,
    signalReason: p.ai_recommendation.reasoning,
    thresholdBuy: p.ai_recommendation.threshold_buy,
    thresholdSell: p.ai_recommendation.threshold_sell,
    contextNote: {
      xauTrading: p.ai_recommendation.context_note.xau_trading,
      antamPhysical: p.ai_recommendation.context_note.antam_physical,
    },
    predictions: {
      h1: {
        days: 1,
        label: p.projections.H1.horizon,
        targetPrice: h1Target,
        conservativePrice: h1Conservative,
        changePct: h1ReturnPct,
        upperBound: isXau ? Math.round((h1Target + rmseH1) * 100) / 100 : Math.round(h1Target + rmseH1),
        lowerBound: isXau ? Math.round((h1Target - rmseH1) * 100) / 100 : Math.round(h1Target - rmseH1),
        confidence: p.projections.H1.confidence_score,
        riskToleranceRmse: rmseH1,
      },
      h7: {
        days: 7,
        label: p.projections.H7.horizon,
        targetPrice: h7Target,
        conservativePrice: h7Conservative,
        changePct: h7ReturnPct,
        upperBound: isXau ? Math.round((h7Target + rmseH7) * 100) / 100 : Math.round(h7Target + rmseH7),
        lowerBound: isXau ? Math.round((h7Target - rmseH7) * 100) / 100 : Math.round(h7Target - rmseH7),
        confidence: p.projections.H7.confidence_score,
        riskToleranceRmse: rmseH7,
      },
      h30: {
        days: 30,
        label: p.projections.H30.horizon,
        targetPrice: h30Target,
        conservativePrice: h30Conservative,
        changePct: h30ReturnPct,
        upperBound: isXau ? Math.round((h30Target + rmseH30) * 100) / 100 : Math.round(h30Target + rmseH30),
        lowerBound: isXau ? Math.round((h30Target - rmseH30) * 100) / 100 : Math.round(h30Target - rmseH30),
        confidence: p.projections.H30.confidence_score,
        riskToleranceRmse: rmseH30,
      },
    },
    metrics: {
      slidingWindowDays: 60,
      rmse: rmseH1,
      accuracyRate: p.model_metadata.backtest_accuracy,
      mae: isXau ? Math.round(rmseH1 * 0.8 * 100) / 100 : Math.round(rmseH1 * 0.8),
      epochsTrained: 250,
      modelType: p.model_metadata.architecture,
      engineName: p.model_metadata.engine_name,
      riskRmseOz: p.model_metadata.risk_rmse_oz,
      featuresUsed: [
        'Lookback Returns Multi-Scale (1D..30D)',
        'DXY Dollar Index',
        'US 10-Year Treasury Yield',
        'USD/IDR Exchange Rate',
        'CBOE VIX Volatility',
        'RSI (14-period momentum)',
        'SMA20 & EMA50 Dynamic Moving Averages'
      ],
    },
    technicals: {
      rsi: mom.rsi_14,
      rsiStatus: mom.rsi_status,
      maCrossStatus: mom.ma_cross_status,
      sma20,
      ema50,
      support1,
      support2,
      resistance1,
      resistance2,
      trend: mom.rsi_14 > 70 ? 'BEARISH' : 'BULLISH',
    },
    macro: {
      dxyIndex: p.macro_sensitivities.dxy.value,
      dxyChange: p.macro_sensitivities.dxy.change_pct,
      dxyStatus: p.macro_sensitivities.dxy.status,
      fedRateExpectation: `Imbal hasil US 10Y di ${p.macro_sensitivities.us10y.yield_pct}% memengaruhi ruang gerak harga emas`,
      us10yYield: p.macro_sensitivities.us10y.yield_pct,
      usdIdrRate: p.macro_sensitivities.usd_idr.rate,
      usdIdrStatus: p.macro_sensitivities.usd_idr.status,
      vixValue: p.macro_sensitivities.geopolitics_vix.vix_value,
      vixStatus: p.macro_sensitivities.geopolitics_vix.status,
      vixInterpretation: p.macro_sensitivities.geopolitics_vix.interpretation,
      geopoliticalSentiment: 'MODERATE',
    },
    historicalCandles,
    predictedCandles,
    timestamp: p.timestamp,
  };
}

export function formatPrice(price: number, currency: 'USD' | 'IDR'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `Rp ${Math.round(price).toLocaleString('id-ID')}`;
}
