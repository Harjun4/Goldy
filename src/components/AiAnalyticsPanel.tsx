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
  Info
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
          label: 'BUY (SINYAL BELI)',
          desc: 'Proyeksi H+1 > (Harga Saat Ini + 0.2%)',
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          icon: <ArrowUpRight className="w-5 h-5 text-emerald-400" />,
        };
      case 'SELL':
        return {
          label: 'SELL (SINYAL JUAL)',
          desc: 'Proyeksi H+1 < (Harga Saat Ini - 0.2%)',
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
          icon: <ArrowDownRight className="w-5 h-5 text-rose-400" />,
        };
      default:
        return {
          label: 'HOLD (SINYAL TAHAN)',
          desc: 'Perubahan harga berada dalam toleransi -0.2% s/d +0.2%',
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
          icon: <Minus className="w-5 h-5 text-amber-400" />,
        };
    }
  };

  const signalMeta = getSignalBadge();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
      
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                AI Analytics Panel (LSTM Core)
              </h2>
              <p className="text-xs text-gray-400">
                Deep Learning Model dengan sliding window 60 hari
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
            Akurasi: {data.metrics.accuracyRate}
          </span>
        </div>

        {/* Primary Signal Badge Callout */}
        <div className={`mt-4 rounded-xl border p-4 ${signalMeta.bg} relative overflow-hidden transition-all`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full ${signalMeta.dot} animate-ping`} />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Rekomendasi Utama
                </span>
              </div>
              <div className="mt-1 flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight font-mono">
                  {signalMeta.label}
                </span>
                {signalMeta.icon}
              </div>
              <p className="text-xs mt-1 text-gray-300">
                {data.signalReason}
              </p>
            </div>

            <button
              onClick={onOpenModeB}
              className="text-[11px] font-mono font-medium px-2.5 py-1.5 rounded-lg bg-gray-950/60 hover:bg-gray-950 text-gray-300 hover:text-white border border-gray-700 transition-colors"
              title="Lihat payload JSON sinyal ini untuk API Frontend"
            >
              Payload JSON
            </button>
          </div>

          {/* Rule Legend */}
          <div className="mt-3 pt-2.5 border-t border-gray-700/40 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Ambang Sinyal: BUY (&gt; +0.20%) | SELL (&lt; -0.20%)</span>
            <span>Toleransi: ±0.20%</span>
          </div>
        </div>

        {/* Target Horizon Matrix: H+1, H+7, H+30 */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Estimasi Harga Target Berdasarkan Horizon Waktu
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* H+1 */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">H+1 (Besok)</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +{data.predictions.h1.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h1.targetPrice)}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Rentang (RMSE):</span>
                <span className="text-gray-400 font-mono">±{formatVal(data.metrics.rmse)}</span>
              </div>
            </div>

            {/* H+7 */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">H+7 (1 Minggu)</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +{data.predictions.h7.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h7.targetPrice)}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Confidence:</span>
                <span className="text-gray-400 font-mono">{data.predictions.h7.confidence}%</span>
              </div>
            </div>

            {/* H+30 */}
            <div className="bg-gray-950 border border-gray-800 rounded-xl p-3.5 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">H+30 (1 Bulan)</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +{data.predictions.h30.changePct}%
                </span>
              </div>
              <div className="mt-2 text-lg font-bold font-mono text-white">
                {formatVal(data.predictions.h30.targetPrice)}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 flex justify-between">
                <span>Confidence:</span>
                <span className="text-gray-400 font-mono">{data.predictions.h30.confidence}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Metrics Bar */}
        <div className="mt-4 bg-gray-950/60 border border-gray-850 rounded-xl p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tingkat Akurasi Evaluasi Backtest:
            </span>
            <span className="font-mono font-bold text-emerald-400">{data.metrics.accuracyRate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Rentang Toleransi Risiko (RMSE):
            </span>
            <span className="font-mono text-gray-200">
              ±{formatVal(data.metrics.rmse)} / {data.unit}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Arsitektur Neural Network:
            </span>
            <span className="font-mono text-gray-300">Bi-LSTM (Lookback: 60 Hari)</span>
          </div>
        </div>
      </div>

      {/* Quick Action Prompt to AI Analyst */}
      <div className="mt-4 pt-3 border-t border-gray-800">
        <button
          id="btn-ask-goldy-action"
          onClick={() => onAskGoldy(`Bagaimana proyeksi teknikal dan makroekonomi untuk target H+1 ${data.asset}?`)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 group"
        >
          <span className="flex items-center gap-2">
            <span>Minta Analisis Lengkap ke Goldy</span>
          </span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
};
