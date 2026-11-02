import fs from 'fs';
import path from 'path';
import { WORKSPACE_ROOT } from '../config';

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

function resolveFilePath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), filename),
    path.join(WORKSPACE_ROOT, filename),
    path.resolve(__dirname, '..', '..', filename),
    path.resolve(__dirname, '..', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

export function loadPayload(forceReload: boolean = false) {
  if (cachedPayload && !forceReload) return cachedPayload;
  try {
    const targetPath = resolveFilePath('payload_goldy.json');
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      cachedPayload = JSON.parse(raw);
      return cachedPayload;
    }
  } catch (e) {
    console.error('[payloadStore] Error loading payload:', e);
  }
  return cachedPayload || {};
}

export function loadFullCandles(forceReload: boolean = false): any[] {
  if (cachedFullCandles && !forceReload) return cachedFullCandles;
  try {
    const targetPath = resolveFilePath(path.join('src', 'data', 'realGoldData.json'));
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      cachedFullCandles = JSON.parse(raw);
      return cachedFullCandles || [];
    }
  } catch (e) {
    console.error('[payloadStore] Error loading candles:', e);
  }
  const p = loadPayload(forceReload);
  return p.chart_series?.candlestick_history || [];
}

export function computeStatsFromPayload(p: any) {
  const antamRatio =
    (p?.current_data?.antam_idr?.price_per_gram || 2378427) /
    (p?.current_data?.xau_usd?.price || 3898.9);

  const xauPrice = p?.current_data?.xau_usd?.price || 3898.9;
  const antamPrice = p?.current_data?.antam_idr?.price_per_gram || Math.round(xauPrice * antamRatio);

  return {
    'XAU/USD': {
      lastPrice: xauPrice,
      predictedH1: p?.projections?.H1?.target_price_usd_base || 3900.16,
      conservativeH1: p?.projections?.H1?.target_price_usd_conservative || 3854.28,
      predictedH7: p?.projections?.H7?.target_price_usd_base || 3952.54,
      conservativeH7: p?.projections?.H7?.target_price_usd_conservative || 3829.43,
      predictedH30: p?.projections?.H30?.target_price_usd_base || 3978.9,
      conservativeH30: p?.projections?.H30?.target_price_usd_conservative || 3725.86,
      signal: p?.ai_recommendation?.signal || 'HOLD',
      signalLabel: p?.ai_recommendation?.signal_label || 'NETRAL / TAHAN POSISI',
      accuracyRate: p?.model_metadata?.backtest_accuracy || '85.0%',
      rmse: p?.projections?.H1?.risk_tolerance_rmse || 46.14,
      unit: 'USD/oz',
      sma20: p?.technical_indicators?.momentum?.sma_20 || 4115.04,
      ema50: p?.technical_indicators?.momentum?.ema_50 || 4268.93,
      rsi: p?.technical_indicators?.momentum?.rsi_14 || 25.1,
      s1: p?.technical_indicators?.support_resistance?.S1 || 3819.73,
      s2: p?.technical_indicators?.support_resistance?.S2 || 3740.57,
      r1: p?.technical_indicators?.support_resistance?.R1 || 4037.63,
      r2: p?.technical_indicators?.support_resistance?.R2 || 4176.37,
    },
    ANTAM: {
      lastPrice: antamPrice,
      predictedH1: p?.projections?.H1?.target_price_antam_base || Math.round(3900.16 * antamRatio),
      conservativeH1:
        p?.projections?.H1?.target_price_antam_conservative || Math.round(3854.28 * antamRatio),
      predictedH7: p?.projections?.H7?.target_price_antam_base || Math.round(3952.54 * antamRatio),
      conservativeH7:
        p?.projections?.H7?.target_price_antam_conservative || Math.round(3829.43 * antamRatio),
      predictedH30:
        p?.projections?.H30?.target_price_antam_base || Math.round(3978.9 * antamRatio),
      conservativeH30:
        p?.projections?.H30?.target_price_antam_conservative || Math.round(3725.86 * antamRatio),
      signal: p?.ai_recommendation?.signal || 'HOLD',
      signalLabel: p?.ai_recommendation?.signal_label || 'NETRAL / TAHAN POSISI',
      accuracyRate: p?.model_metadata?.backtest_accuracy || '85.0%',
      rmse: Math.round((p?.projections?.H1?.risk_tolerance_rmse || 46.14) * antamRatio),
      unit: 'IDR/gram',
      sma20: Math.round((p?.technical_indicators?.momentum?.sma_20 || 4115.04) * antamRatio),
      ema50: Math.round((p?.technical_indicators?.momentum?.ema_50 || 4268.93) * antamRatio),
      rsi: p?.technical_indicators?.momentum?.rsi_14 || 25.1,
      s1: Math.round((p?.technical_indicators?.support_resistance?.S1 || 3819.73) * antamRatio),
      s2: Math.round((p?.technical_indicators?.support_resistance?.S2 || 3740.57) * antamRatio),
      r1: Math.round((p?.technical_indicators?.support_resistance?.R1 || 4037.63) * antamRatio),
      r2: Math.round((p?.technical_indicators?.support_resistance?.R2 || 4176.37) * antamRatio),
    },
  };
}
