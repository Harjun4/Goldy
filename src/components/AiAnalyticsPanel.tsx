import React from 'react';
import { AssetAnalysisData } from '../types';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Target, 
  ShieldCheck, 
  Activity, 
  Layers, 
  Clock, 
  ChevronRight,
  Compass
} from 'lucide-react';

interface AiAnalyticsPanelProps {
  data: AssetAnalysisData;
  onAskGoldy: (question: string) => void;
  onOpenModeB: () => void;
}

export const AiAnalyticsPanel: React.FC<AiAnalyticsPanelProps> = ({
  data,
  onAskGoldy,
  onOpenModeB,
}) => {
  const isXau = data.currency === 'USD';

  const formatVal = (v: number) => {
    if (isXau) return `$${v.toFixed(2)}`;
    return `Rp ${Math.round(v).toLocaleString('id-ID')}`;
  };

  const getSignalBadge = () => {
    switch (data.signal) {
      case 'BUY':
        return {
          label: data.signalLabel || 'BUY (SINYAL BELI) ↗',
          desc: 'Proyeksi H+1 > (Harga Saat Ini + 0.2%)',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <ArrowUpRight className="w-5 h-5 text-emerald-400" aria-hidden="true" />,
        };
      case 'SELL':
        return {
          label: data.signalLabel || 'SELL (SINYAL JUAL / TUNGGU) ↘',
          desc: 'Proyeksi H+1 < (Harga Saat Ini - 0.2%)',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
          icon: <ArrowDownRight className="w-5 h-5 text-rose-400" aria-hidden="true" />,
        };
      default:
        return {
          label: data.signalLabel || 'HOLD (SINYAL TAHAN) ↔',
          desc: 'Perubahan harga berada dalam toleransi -0.2% s/d +0.2%',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
          icon: <Minus className="w-5 h-5 text-amber-400" aria-hidden="true" />,
        };
    }
  };

  const signalMeta = getSignalBadge();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Target className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                AI Analytics Panel ({data.metrics.engineName || 'Multi-Horizon Core'})
              </h2>
              <p className="text-xs text-gray-400">
                {data.metrics.modelType}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Akurasi: {data.metrics.accuracyRate}
          </span>
        </div>

        <div className={`mt-4 rounded-xl border p-4 ${signalMeta.bg} relative overflow-hidden transition-all`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 pr-2">
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${signalMeta.dot}`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rekomendasi Utama
                </span>
              </div>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight font-mono">
                  {signalMeta.label}
                </span>
                {signalMeta.icon}
              </div>
              <p className="text-xs mt-1.5 text-gray-200 leading-relaxed font-medium">
                {data.signalReason}
              </p>

              {data.contextNote && (
                <div className="mt-2.5 p-2 rounded-lg bg-gray-950/70 border border-gray-800/80 text-[11px] text-gray-300 flex items-start gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-amber-300">Konteks Aset: </strong>
                    {isXau ? data.contextNote.xauTrading : data.contextNote.antamPhysical}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenModeB}
              className="min-h-[44px] text-xs font-mono font-medium px-3 py-2 rounded-xl bg-gray-950/80 hover:bg-gray-950 text-gray-300 hover:text-white border border-gray-700 transition-colors shrink-0 cursor-pointer"
              title="Lihat payload JSON sinyal ini untuk API Frontend"
            >
              Payload JSON
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-700/40 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Ambang: BUY (&gt; {data.thresholdBuy || '+0.20%'}) | SELL (&lt; {data.thresholdSell || '-0.20%'})</span>
            <span>Toleransi: ±0.20%</span>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            Estimasi Harga Target Multi-Horizon
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl p-3.5 hover:border-amber-500/60 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">{data.predictions.h1.label}</span>
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  data.predictions.h1.changePct >= 0 
                    ? 'text-emerald-400 bg-emerald-500/15' 
                    : 'text-rose-400 bg-rose-500/15'
                }`}>
                  {data.predictions.h1.changePct >= 0 ? '+' : ''}{data.predictions.h1.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h1.targetPrice)}
              </div>
              {data.predictions.h1.conservativePrice && (
                <div className="mt-1 text-[10px] text-gray-400 flex justify-between">
                  <span>Konservatif:</span>
                  <span className="font-mono font-semibold text-amber-300">{formatVal(data.predictions.h1.conservativePrice)}</span>
                </div>
              )}
              <div className="mt-1 text-[11px] text-gray-400 flex justify-between">
                <span>Confidence:</span>
                <span className="text-gray-200 font-semibold font-mono">{data.predictions.h1.confidence}%</span>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/35 rounded-xl p-3.5 hover:border-cyan-500/60 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">{data.predictions.h7.label}</span>
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  data.predictions.h7.changePct >= 0 
                    ? 'text-emerald-400 bg-emerald-500/15' 
                    : 'text-rose-400 bg-rose-500/15'
                }`}>
                  {data.predictions.h7.changePct >= 0 ? '+' : ''}{data.predictions.h7.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h7.targetPrice)}
              </div>
              {data.predictions.h7.conservativePrice && (
                <div className="mt-1 text-[10px] text-gray-400 flex justify-between">
                  <span>Konservatif:</span>
                  <span className="font-mono font-semibold text-cyan-300">{formatVal(data.predictions.h7.conservativePrice)}</span>
                </div>
              )}
              <div className="mt-1 text-[11px] text-gray-400 flex justify-between">
                <span>Confidence:</span>
                <span className="text-gray-200 font-semibold font-mono">{data.predictions.h7.confidence}%</span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-xl p-3.5 hover:border-emerald-500/60 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">{data.predictions.h30.label}</span>
                <span className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                  data.predictions.h30.changePct >= 0 
                    ? 'text-emerald-400 bg-emerald-500/15' 
                    : 'text-rose-400 bg-rose-500/15'
                }`}>
                  {data.predictions.h30.changePct >= 0 ? '+' : ''}{data.predictions.h30.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h30.targetPrice)}
              </div>
              {data.predictions.h30.conservativePrice && (
                <div className="mt-1 text-[10px] text-gray-400 flex justify-between">
                  <span>Konservatif:</span>
                  <span className="font-mono font-semibold text-emerald-300">{formatVal(data.predictions.h30.conservativePrice)}</span>
                </div>
              )}
              <div className="mt-1 text-[11px] text-gray-400 flex justify-between">
                <span>Confidence:</span>
                <span className="text-gray-200 font-semibold font-mono">{data.predictions.h30.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-950/60 border border-gray-850 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              Tingkat Akurasi Backtest:
            </span>
            <span className="font-mono font-bold text-emerald-400">{data.metrics.accuracyRate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              Toleransi Risiko Error (RMSE):
            </span>
            <span className="font-mono font-semibold text-cyan-400">
              {isXau && data.metrics.riskRmseOz ? data.metrics.riskRmseOz : `±${formatVal(data.metrics.rmse)} / ${data.unit}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              Arsitektur Machine Learning:
            </span>
            <span className="font-mono font-semibold text-amber-300 text-[11px]">{data.metrics.modelType}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800">
        <button
          id="btn-ask-goldy-action"
          type="button"
          onClick={() => onAskGoldy(`Bagaimana proyeksi teknikal dan makroekonomi untuk target H+1 ${data.asset} berdasarkan model ${data.metrics.engineName || 'Goldy Core'}?`)}
          className="min-h-[44px] w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm group cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span>Minta Analisis Lengkap ke Goldy</span>
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
