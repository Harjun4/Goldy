import { supabase } from '../config';

export function getNextBusinessDay(fromYMD: string, offsetBusinessDays: number): string {
  const [y, m, d] = fromYMD.split('-').map(Number);
  const cur = new Date(y, m - 1, d);
  let added = 0;
  while (added < offsetBusinessDays) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  const yyyy = cur.getFullYear();
  const mm = String(cur.getMonth() + 1).padStart(2, '0');
  const dd = String(cur.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function syncSupabaseWithLatestData(payload: any, candles: any[]) {
  if (!supabase) return;
  try {
    const recentCandles = candles.slice(-60);
    const antamRatio =
      payload.current_data.antam_idr.price_per_gram / payload.current_data.xau_usd.price;

    const latestCandle = recentCandles[recentCandles.length - 1];
    const baseDate =
      latestCandle?.time || payload.chart_series?.projection_path?.[0]?.time || '2026-10-30';
    const basePriceUsd = payload.current_data.xau_usd.price;
    const basePriceAntam = payload.current_data.antam_idr.price_per_gram;

    const h1TargetDate =
      payload.chart_series?.projection_path?.[1]?.time || getNextBusinessDay(baseDate, 1);
    const h7TargetDate =
      payload.chart_series?.projection_path?.[2]?.time || getNextBusinessDay(baseDate, 5);
    const h30TargetDate =
      payload.chart_series?.projection_path?.[3]?.time || getNextBusinessDay(baseDate, 22);

    const buildSignal = (retPct: number) =>
      retPct > 0.2 ? 'BUY' : retPct < -0.2 ? 'SELL' : 'HOLD';

    const engineName = payload.model_metadata?.architecture || 'Goldy Multi-Horizon RF Core';
    const nowIso = new Date().toISOString();

    const targetPredictions = [
      // XAU/USD
      {
        base_date: baseDate,
        target_date: h1TargetDate,
        horizon: 'H1',
        asset: 'XAU/USD',
        base_price: basePriceUsd,
        predicted_price: payload.projections.H1.target_price_usd_base,
        predicted_return_pct: payload.projections.H1.return_pct_base,
        signal: payload.ai_recommendation.signal,
        confidence_score: payload.projections.H1.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
      {
        base_date: baseDate,
        target_date: h7TargetDate,
        horizon: 'H7',
        asset: 'XAU/USD',
        base_price: basePriceUsd,
        predicted_price: payload.projections.H7.target_price_usd_base,
        predicted_return_pct: payload.projections.H7.return_pct_base,
        signal: buildSignal(payload.projections.H7.return_pct_base),
        confidence_score: payload.projections.H7.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
      {
        base_date: baseDate,
        target_date: h30TargetDate,
        horizon: 'H30',
        asset: 'XAU/USD',
        base_price: basePriceUsd,
        predicted_price: payload.projections.H30.target_price_usd_base,
        predicted_return_pct: payload.projections.H30.return_pct_base,
        signal: buildSignal(payload.projections.H30.return_pct_base),
        confidence_score: payload.projections.H30.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
      // ANTAM
      {
        base_date: baseDate,
        target_date: h1TargetDate,
        horizon: 'H1',
        asset: 'ANTAM',
        base_price: basePriceAntam,
        predicted_price: payload.projections.H1.target_price_antam_base,
        predicted_return_pct: payload.projections.H1.return_pct_base,
        signal: payload.ai_recommendation.signal,
        confidence_score: payload.projections.H1.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
      {
        base_date: baseDate,
        target_date: h7TargetDate,
        horizon: 'H7',
        asset: 'ANTAM',
        base_price: basePriceAntam,
        predicted_price: payload.projections.H7.target_price_antam_base,
        predicted_return_pct: payload.projections.H7.return_pct_base,
        signal: buildSignal(payload.projections.H7.return_pct_base),
        confidence_score: payload.projections.H7.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
      {
        base_date: baseDate,
        target_date: h30TargetDate,
        horizon: 'H30',
        asset: 'ANTAM',
        base_price: basePriceAntam,
        predicted_price: payload.projections.H30.target_price_antam_base,
        predicted_return_pct: payload.projections.H30.return_pct_base,
        signal: buildSignal(payload.projections.H30.return_pct_base),
        confidence_score: payload.projections.H30.confidence_score,
        engine_name: engineName,
        status: 'PENDING',
        run_timestamp: nowIso,
      },
    ];

    // Fetch existing predictions for this baseDate
    const { data: existingRows } = await supabase
      .from('goldy_predictions')
      .select('id, base_date, horizon, asset')
      .eq('base_date', baseDate);

    const existingMap = new Map<string, string>();
    if (existingRows) {
      for (const r of existingRows) {
        existingMap.set(`${r.base_date}|${r.horizon}|${r.asset}`, r.id);
      }
    }

    for (const item of targetPredictions) {
      const key = `${item.base_date}|${item.horizon}|${item.asset}`;
      const existingId = existingMap.get(key);
      if (existingId) {
        await supabase
          .from('goldy_predictions')
          .update({
            ...item,
            updated_at: nowIso,
          })
          .eq('id', existingId);
      } else {
        await supabase.from('goldy_predictions').insert({
          ...item,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }

    // Evaluate any pending logs that have reached or passed their target date
    const { data: pendingLogs } = await supabase
      .from('goldy_predictions')
      .select('*')
      .eq('status', 'PENDING')
      .lte('target_date', baseDate);

    if (pendingLogs && pendingLogs.length > 0) {
      const candleMap = new Map<string, any>();
      for (const c of candles) {
        candleMap.set(c.time, c);
      }

      for (const log of pendingLogs) {
        const actualCandle = candleMap.get(log.target_date);
        if (actualCandle) {
          const isXau = log.asset === 'XAU/USD';
          const actualPrice = isXau
            ? Number(actualCandle.close)
            : Math.round(Number(actualCandle.close) * antamRatio);
          const basePrice = Number(log.base_price);
          const predPrice = Number(log.predicted_price);

          const actualReturnPct = Number((((actualPrice - basePrice) / basePrice) * 100).toFixed(2));
          const errorAbs = isXau
            ? Number(Math.abs(predPrice - actualPrice).toFixed(2))
            : Math.round(Math.abs(predPrice - actualPrice));
          const errorPct = Number(((Math.abs(predPrice - actualPrice) / actualPrice) * 100).toFixed(2));

          const predRet = Number(log.predicted_return_pct);
          const directionHit =
            (predRet > 0.2 && actualReturnPct > 0) ||
            (predRet < -0.2 && actualReturnPct < 0) ||
            (Math.abs(predRet) <= 0.2 && Math.abs(actualReturnPct) <= 0.45);

          await supabase
            .from('goldy_predictions')
            .update({
              actual_price: actualPrice,
              actual_return_pct: actualReturnPct,
              error_abs: errorAbs,
              error_pct: errorPct,
              direction_hit: directionHit,
              status: 'EVALUATED',
              evaluated_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', log.id);
        }
      }
    }
  } catch (err: any) {
    console.warn('[Supabase Sync Warning]:', err?.message || err);
  }
}

