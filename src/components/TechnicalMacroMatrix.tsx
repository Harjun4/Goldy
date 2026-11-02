import React from 'react';
import { AssetAnalysisData } from '../types';
import { 
  Gauge, 
  TrendingUp, 
  DollarSign, 
  Landmark, 
  Globe2, 
  Scale, 
  BarChart2,
  Activity
} from 'lucide-react';

interface TechnicalMacroMatrixProps {
  data: AssetAnalysisData;
}

export const TechnicalMacroMatrix: React.FC<TechnicalMacroMatrixProps> = ({ data }) => {
  const isXau = data.currency === 'USD';
  const fmt = (val: number) => (isXau ? `$${val.toFixed(2)}` : `Rp ${Math.round(val).toLocaleString('id-ID')}`);

  const getPctDiff = (target: number) => {
    const diff = ((target - data.lastPrice) / data.lastPrice) * 100;
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  };

  const isRsiOverbought = data.technicals.rsi >= 70;
  const isRsiOversold = data.technicals.rsi <= 30;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Analisis Teknikal & Indikator Pasar
            </h3>
          </div>
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
            data.technicals.trend === 'BEARISH' 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : data.technicals.trend === 'BULLISH'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {data.technicals.trend === 'BEARISH' ? 'Koreksi Jenuh Beli' : data.technicals.trend}
          </span>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
              <span>Level Kunci Support & Resistance</span>
              <span className="text-[11px] font-mono text-gray-400">Pivot Multi-Scale</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                <span className="text-gray-400 block text-[11px] font-semibold">Resistance 2 (R2)</span>
                <span className="text-rose-400 font-bold">{fmt(data.technicals.resistance2)}</span>
                <span className="text-[10px] text-gray-400 block">{getPctDiff(data.technicals.resistance2)} dari harga</span>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                <span className="text-gray-400 block text-[11px] font-semibold">Resistance 1 (R1)</span>
                <span className="text-rose-300 font-bold">{fmt(data.technicals.resistance1)}</span>
                <span className="text-[10px] text-gray-400 block">{getPctDiff(data.technicals.resistance1)} dari harga</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-gray-400 block text-[11px] font-semibold">Support 1 (S1)</span>
                <span className="text-emerald-300 font-bold">{fmt(data.technicals.support1)}</span>
                <span className="text-[10px] text-gray-400 block">{getPctDiff(data.technicals.support1)} dari harga</span>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/30">
                <span className="text-gray-400 block text-[11px] font-semibold">Support 2 (S2)</span>
                <span className="text-emerald-400 font-bold">{fmt(data.technicals.support2)}</span>
                <span className="text-[10px] text-gray-400 block">{getPctDiff(data.technicals.support2)} dari harga</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-800">
            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">Relative Strength Index (RSI 14)</span>
                <span className={`text-sm font-bold font-mono ${
                  isRsiOverbought ? 'text-rose-400' : isRsiOversold ? 'text-emerald-400' : 'text-amber-300'
                }`}>
                  {data.technicals.rsi}
                </span>
                <span className={`text-[10px] block font-medium ${
                  isRsiOverbought ? 'text-rose-400' : isRsiOversold ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {data.technicals.rsiStatus || (isRsiOverbought ? 'Overbought (Rawan Koreksi)' : 'Zona Netral')}
                </span>
              </div>
              <Gauge className={`w-6 h-6 ${isRsiOverbought ? 'text-rose-400' : 'text-amber-400'}`} aria-hidden="true" />
            </div>

            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 font-medium block">SMA 20 vs EMA 50</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {data.technicals.maCrossStatus || 'Golden Cross'}
                </span>
                <span className="text-[10px] text-gray-400 block font-mono">SMA: {fmt(data.technicals.sma20)}</span>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Faktor Makroekonomi & Sensitivitas Sentimen
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Macro Radar
          </span>
        </div>

        <div className="mt-4 space-y-3 font-mono text-xs">
          <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-gray-200 font-sans font-semibold block">Indeks Dolar AS (DXY)</span>
                <span className="text-gray-400 text-[11px]">Korelasi negatif historis kuat dengan emas</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">{data.macro.dxyIndex}</span>
              <span className={`text-[11px] block font-medium ${
                data.macro.dxyChange > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {data.macro.dxyChange >= 0 ? '+' : ''}{data.macro.dxyChange}% ({data.macro.dxyStatus || 'Menguat'})
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Landmark className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-gray-200 font-sans font-semibold block">Imbal Hasil Obligasi AS (US 10Y)</span>
                <span className="text-gray-400 text-[11px]">Opportunity cost memegang aset non-yielding</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-amber-300 font-mono">{data.macro.us10yYield}%</span>
              <span className="text-[10px] text-gray-400 block">Yield Benchmark</span>
            </div>
          </div>

          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Scale className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-gray-200 font-sans font-semibold block">Kurs USD / IDR</span>
                <span className="text-gray-400 text-[11px]">Faktor penentu konversi Emas Antam</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">Rp {data.macro.usdIdrRate.toLocaleString('id-ID')}</span>
              <span className="text-[11px] text-emerald-400 font-medium block">{data.macro.usdIdrStatus || 'Stabil Berkelanjutan'}</span>
            </div>
          </div>

          <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <Activity className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <span className="text-gray-200 font-sans font-semibold block">Volatilitas Pasar (CBOE VIX)</span>
                <span className="text-gray-400 text-[11px]">{data.macro.vixInterpretation || 'Sentimen volatilitas pasar modal & safe-haven'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">{data.macro.vixValue || 16.01}</span>
              <span className="text-[11px] text-purple-400 font-medium block">
                {data.macro.vixStatus || 'Kondusif (Normal)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
