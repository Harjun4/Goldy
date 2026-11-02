import fs from 'fs';
import path from 'path';
import { WORKSPACE_ROOT } from '../config';
import fallbackPayload from '../../payload_goldy.json';
import fallbackCandles from '../../src/data/realGoldData.json';

let cachedPayload: any = null;
let cachedFullCandles: any[] | null = null;
let isSyncInProgress = false;
let lastSyncTimestamp: string | null = null;

export function getSyncState() {
  return { isSyncInProgress, lastSyncTimestamp };
}

export function setSyncInProgress(inProgress: boolean) {
  isSyncInProgress = inProgress;
  if (!inProgress) {
    lastSyncTimestamp = new Date().toISOString();
  }
}

export function loadPayload(forceReload: boolean = false) {
  if (cachedPayload && !forceReload) return cachedPayload;
  try {
    const payloadPath = path.join(WORKSPACE_ROOT, 'payload_goldy.json');
    if (fs.existsSync(payloadPath)) {
      const raw = fs.readFileSync(payloadPath, 'utf-8');
      cachedPayload = JSON.parse(raw);
      return cachedPayload;
    }
  } catch (e) {
    console.warn('[payloadStore] Failed to load payload from disk, using fallback import:', e);
  }
  cachedPayload = fallbackPayload;
  return cachedPayload;
}

export function loadFullCandles(forceReload: boolean = false): any[] {
  if (cachedFullCandles && !forceReload) return cachedFullCandles;
  try {
    const candlesPath = path.join(WORKSPACE_ROOT, 'src', 'data', 'realGoldData.json');
    if (fs.existsSync(candlesPath)) {
      const raw = fs.readFileSync(candlesPath, 'utf-8');
      cachedFullCandles = JSON.parse(raw);
      return cachedFullCandles || [];
    }
  } catch (e) {
    console.warn('[payloadStore] Failed to load candles from disk, using fallback import:', e);
  }
  cachedFullCandles = fallbackCandles;
  return cachedFullCandles || [];
}

export function computeStatsFromPayload(p: any) {
  const antamRatio = p.current_data.antam_idr.price_per_gram / p.current_data.xau_usd.price;
  return {
    'XAU/USD': {
      lastPrice: p.current_data.xau_usd.price,
      predictedH1: p.projections.H1.target_price_usd_base,
      conservativeH1: p.projections.H1.target_price_usd_conservative,
      predictedH7: p.projections.H7.target_price_usd_base,
      conservativeH7: p.projections.H7.target_price_usd_conservative,
      predictedH30: p.projections.H30.target_price_usd_base,
      conservativeH30: p.projections.H30.target_price_usd_conservative,
      signal: p.ai_recommendation.signal,
      signalLabel: p.ai_recommendation.signal_label,
      accuracyRate: p.model_metadata.backtest_accuracy,
      rmse: p.projections.H1.risk_tolerance_rmse,
      unit: 'USD/oz',
      sma20: p.technical_indicators.momentum.sma_20,
      ema50: p.technical_indicators.momentum.ema_50,
      rsi: p.technical_indicators.momentum.rsi_14,
      s1: p.technical_indicators.support_resistance.S1,
      s2: p.technical_indicators.support_resistance.S2,
      r1: p.technical_indicators.support_resistance.R1,
      r2: p.technical_indicators.support_resistance.R2,
    },
    ANTAM: {
      lastPrice: p.current_data.antam_idr.price_per_gram,
      predictedH1: p.projections.H1.target_price_antam_base,
      conservativeH1: p.projections.H1.target_price_antam_conservative,
      predictedH7: p.projections.H7.target_price_antam_base,
      conservativeH7: p.projections.H7.target_price_antam_conservative,
      predictedH30: p.projections.H30.target_price_antam_base,
      conservativeH30: p.projections.H30.target_price_antam_conservative,
      signal: p.ai_recommendation.signal,
      signalLabel: p.ai_recommendation.signal_label,
      accuracyRate: p.model_metadata.backtest_accuracy,
      rmse: Math.round(p.projections.H1.risk_tolerance_rmse * antamRatio),
      unit: 'IDR/gram',
      sma20: Math.round(p.technical_indicators.momentum.sma_20 * antamRatio),
      ema50: Math.round(p.technical_indicators.momentum.ema_50 * antamRatio),
      rsi: p.technical_indicators.momentum.rsi_14,
      s1: Math.round(p.technical_indicators.support_resistance.S1 * antamRatio),
      s2: Math.round(p.technical_indicators.support_resistance.S2 * antamRatio),
      r1: Math.round(p.technical_indicators.support_resistance.R1 * antamRatio),
      r2: Math.round(p.technical_indicators.support_resistance.R2 * antamRatio),
    },
  };
}

