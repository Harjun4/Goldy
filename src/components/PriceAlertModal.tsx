import React, { useState } from 'react';
import { AssetType, AlertCondition, PriceAlert } from '../types';
import { 
  Bell, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  DollarSign, 
  Volume2, 
  VolumeX, 
  Plus, 
  Sparkles,
  Info
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAsset: AssetType;
  xauPrice: number;
  antamPrice: number;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  currentAsset,
  xauPrice,
  antamPrice,
  onAddAlert,
}) => {
  const [asset, setAsset] = useState<AssetType>(currentAsset);
  const [condition, setCondition] = useState<AlertCondition>('ABOVE');
  const [targetValue, setTargetValue] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  if (!isOpen) return null;

  const isXau = asset === 'XAU/USD';
  const currentPrice = isXau ? xauPrice : antamPrice;
  const currency = isXau ? 'USD' : 'IDR';

  const fmt = (val: number) => {
    if (currency === 'USD') return `$${val.toFixed(2)}`;
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  const isPercentage = condition === 'PCT_GAIN' || condition === 'PCT_DROP';

  // Calculate distance
  const numTarget = parseFloat(targetValue);
  let distanceInfo = '';
  if (!isNaN(numTarget) && numTarget > 0) {
    if (isPercentage) {
      const estimatedPrice = condition === 'PCT_GAIN' 
        ? currentPrice * (1 + numTarget / 100) 
        : currentPrice * (1 - numTarget / 100);
      distanceInfo = `Perkiraan harga eksekusi: ${fmt(estimatedPrice)}`;
    } else {
      const diff = numTarget - currentPrice;
      const diffPct = (diff / currentPrice) * 100;
      distanceInfo = `${diff >= 0 ? '+' : ''}${fmt(diff)} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(2)}% dari harga saat ini)`;
    }
  }

  const handleApplyPreset = (type: 'ABOVE' | 'BELOW' | 'PCT', val: number) => {
    if (type === 'ABOVE') {
      setCondition('ABOVE');
      setTargetValue((currentPrice * (1 + val / 100)).toFixed(isXau ? 2 : 0));
    } else if (type === 'BELOW') {
      setCondition('BELOW');
      setTargetValue((currentPrice * (1 - val / 100)).toFixed(isXau ? 2 : 0));
    } else {
      setCondition(val > 0 ? 'PCT_GAIN' : 'PCT_DROP');
      setTargetValue(Math.abs(val).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numTarget || numTarget <= 0) return;

    onAddAlert({
      asset,
      condition,
      targetValue: numTarget,
      initialPrice: currentPrice,
      active: true,
      note: note.trim() || undefined,
      soundEnabled,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-800 bg-gray-950 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Pasang Price Alert Baru
              </h3>
              <p className="text-xs text-gray-400">
                Notifikasi real-time saat harga emas menembus level target
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Asset Choice */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Pilih Aset Emas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAsset('XAU/USD');
                  setTargetValue('');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  asset === 'XAU/USD'
                    ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="block text-xs font-mono">Spot Gold</span>
                <span className="block text-sm font-bold text-amber-300">XAU/USD ({fmt(xauPrice)})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAsset('ANTAM');
                  setTargetValue('');
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  asset === 'ANTAM'
                    ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <span className="block text-xs font-mono">Logam Mulia</span>
                <span className="block text-sm font-bold text-amber-300">Emas Antam ({fmt(antamPrice)})</span>
              </button>
            </div>
          </div>

          {/* Alert Type Condition */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Kondisi Pemicu (Trigger Rule)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Naik Di Atas (&gt;)</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  condition === 'BELOW'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span>Turun Di Bawah (&lt;)</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('PCT_GAIN')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  condition === 'PCT_GAIN'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>Gain (+%)</span>
              </button>

              <button
                type="button"
                onClick={() => setCondition('PCT_DROP')}
                className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all ${
                  condition === 'PCT_DROP'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Percent className="w-4 h-4 text-rose-400" />
                <span>Drop (-%)</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
              <span>Preset Cepat:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('ABOVE', 0.5)}
                className="px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-emerald-400 font-mono transition-colors"
              >
                +0.5% Naik
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('ABOVE', 1.0)}
                className="px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-emerald-400 font-mono transition-colors"
              >
                +1.0% Naik
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('BELOW', 0.5)}
                className="px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-rose-400 font-mono transition-colors"
              >
                -0.5% Turun
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('BELOW', 1.0)}
                className="px-2.5 py-1 rounded-lg bg-gray-950 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-rose-400 font-mono transition-colors"
              >
                -1.0% Turun
              </button>
            </div>
          </div>

          {/* Target Value Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              {isPercentage ? 'Nilai Persentase Target (%)' : `Level Harga Target (${currency})`}
            </label>
            <div className="relative">
              <input
                type="number"
                step={isPercentage || isXau ? '0.01' : '100'}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={
                  isPercentage 
                    ? 'Contoh: 0.75' 
                    : isXau 
                    ? `Contoh: ${(currentPrice * 1.008).toFixed(2)}` 
                    : `Contoh: ${Math.round(currentPrice * 1.008)}`
                }
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 font-mono text-base text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">
                {isPercentage ? '%' : currency}
              </span>
            </div>
            {distanceInfo && (
              <p className="text-[11px] text-amber-400/90 font-mono mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {distanceInfo}
              </p>
            )}
          </div>

          {/* Optional Note & Sound Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-800">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Catatan / Label (Opsional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Entry Beli / TP"
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1">
                Audio Chime Alert
              </label>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition-colors ${
                  soundEnabled 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                    : 'bg-gray-950 border-gray-800 text-gray-400'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
                  <span>{soundEnabled ? 'Suara Aktif' : 'Senyap'}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500">
                  {soundEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!numTarget || numTarget <= 0}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Alert</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
