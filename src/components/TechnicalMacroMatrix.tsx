import React from 'react';
import { AssetAnalysisData } from '../types';
import { 
  Gauge, 
  TrendingUp, 
  DollarSign, 
  Landmark, 
  Globe2, 
  ShieldAlert, 
  Scale, 
  BarChart2 
} from 'lucide-react';

interface TechnicalMacroMatrixProps {
  data: AssetAnalysisData;
}

export const TechnicalMacroMatrix: React.FC<TechnicalMacroMatrixProps> = ({ data }) => {
  const isXau = data.currency === 'USD';
  const fmt = (val: number) => (isXau ? `$${val.toFixed(2)}` : `Rp ${Math.round(val).toLocaleString('id-ID')}`);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* 1. Technical Analysis Matrix */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Analisis Teknikal & Indikator Pasar
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {data.technicals.trend}
          </span>
        </div>

        <div className="mt-4 space-y-3.5">
          {/* Support & Resistance Table */}
          <div>
            <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center justify-between">
              <span>Level Kunci Support & Resistance</span>
              <span className="text-[11px] font-mono text-gray-500">Pivot Time-Series</span>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-850">
                <span className="text-gray-500 block text-[11px]">Resistance 2 (R2)</span>
                <span className="text-rose-400 font-bold">{fmt(data.technicals.resistance2)}</span>
                <span className="text-[10px] text-gray-500 block">+2.4% dari harga</span>
              </div>
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-850">
                <span className="text-gray-500 block text-[11px]">Resistance 1 (R1)</span>
                <span className="text-rose-300 font-bold">{fmt(data.technicals.resistance1)}</span>
                <span className="text-[10px] text-gray-500 block">+1.1% dari harga</span>
              </div>
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-850">
                <span className="text-gray-500 block text-[11px]">Support 1 (S1)</span>
                <span className="text-emerald-300 font-bold">{fmt(data.technicals.support1)}</span>
                <span className="text-[10px] text-gray-500 block">-0.8% dari harga</span>
              </div>
              <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-850">
                <span className="text-gray-500 block text-[11px]">Support 2 (S2)</span>
                <span className="text-emerald-400 font-bold">{fmt(data.technicals.support2)}</span>
                <span className="text-[10px] text-gray-500 block">-1.9% dari harga</span>
              </div>
            </div>
          </div>

          {/* RSI & Moving Averages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-800">
            <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Relative Strength Index (RSI 14)</span>
                <span className="text-sm font-bold font-mono text-amber-300">
                  {data.technicals.rsi}
                </span>
                <span className="text-[10px] text-gray-500 block">Zona Akumulasi Sehat</span>
              </div>
              <Gauge className="w-6 h-6 text-amber-400/70" />
            </div>

            <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">SMA 20 vs EMA 50</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  Golden Cross
                </span>
                <span className="text-[10px] text-gray-500 block">SMA20: {fmt(data.technicals.sma20)}</span>
              </div>
              <TrendingUp className="w-6 h-6 text-emerald-400/70" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Macroeconomic & Sensitivity Radar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Faktor Makroekonomi & Sensitivitas Sentimen
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Macro Live
          </span>
        </div>

        <div className="mt-4 space-y-3 font-mono text-xs">
          {/* DXY Index */}
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-cyan-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-300 font-sans font-medium block">Indeks Dolar AS (DXY)</span>
                <span className="text-gray-500 text-[11px]">Korelasi negatif historis kuat dengan emas</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">{data.macro.dxyIndex}</span>
              <span className="text-[11px] text-emerald-400 block">
                {data.macro.dxyChange}% (Melemah)
              </span>
            </div>
          </div>

          {/* Suku Bunga The Fed */}
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-amber-400">
                <Landmark className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-300 font-sans font-medium block">Suku Bunga The Fed & Imbal Hasil</span>
                <span className="text-gray-500 text-[11px]">US 10Y Yield: {data.macro.us10yYield}%</span>
              </div>
            </div>
            <div className="text-right max-w-[160px]">
              <span className="text-[11px] text-amber-300 font-sans font-medium leading-tight block">
                {data.macro.fedRateExpectation}
              </span>
            </div>
          </div>

          {/* Kurs USD / IDR */}
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-emerald-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-300 font-sans font-medium block">Kurs USD / IDR (Bank Indonesia)</span>
                <span className="text-gray-500 text-[11px]">Faktor penentu utama harga Emas Antam</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">Rp {data.macro.usdIdrRate.toLocaleString('id-ID')}</span>
              <span className="text-[11px] text-gray-400 block">Stabil Berkelanjutan</span>
            </div>
          </div>

          {/* Geopolitik Risk */}
          <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-gray-300 font-sans font-medium block">Sentimen Geopolitik & Safe Haven</span>
                <span className="text-gray-500 text-[11px]">Ketegangan global memicu lindung nilai</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[11px]">
              Tinggi (Safe Haven On)
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
