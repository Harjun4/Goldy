import React from 'react';
import { AssetType, ThemeMode } from '../types';
import { 
  TrendingUp, 
  Terminal, 
  MessageSquareText, 
  Layers, 
  Bell, 
  RefreshCw,
  CalendarClock,
  Sun,
  Moon,
  Coins,
  TableProperties
} from 'lucide-react';

interface HeaderProps {
  asset: AssetType;
  onSelectAsset: (asset: AssetType) => void;
  activeTab: 'dashboard' | 'comparison' | 'modeA' | 'modeB' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'comparison' | 'modeA' | 'modeB' | 'alerts') => void;
  lastPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  currency: 'USD' | 'IDR';
  signal: string;
  activeAlertsCount: number;
  onOpenCreateAlert: () => void;
  isSyncing: boolean;
  onSynchronize: () => void;
  lastDataDate?: string;
  forecastDate?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  asset,
  onSelectAsset,
  activeTab,
  setActiveTab,
  lastPrice,
  dailyChange,
  dailyChangePct,
  currency,
  signal,
  activeAlertsCount,
  onOpenCreateAlert,
  isSyncing,
  onSynchronize,
  lastDataDate,
  forecastDate,
  theme,
  onToggleTheme,
}) => {
  const isPositive = dailyChange >= 0;
  const isXau = asset === 'XAU/USD';
  const isLight = theme === 'light';

  const formatValue = (val: number) => {
    if (currency === 'USD') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2.5 sm:py-3 gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm ring-1 ring-amber-600/30 shrink-0">
                <Coins className="w-5 h-5 text-slate-950" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    Goldy
                    <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Gold Analytics Engine
                    </span>
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400 mt-0.5">
                  <span className="hidden sm:inline">Analisis & Proyeksi Kuantitatif Emas (XAU/USD & Antam)</span>
                  {lastDataDate && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 font-mono text-[10px] text-gray-300">
                      <CalendarClock className="w-3 h-3 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span>H-1: {lastDataDate}</span>
                      {forecastDate && (
                        <span className="text-emerald-400">| H+1: {forecastDate}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <div className="min-h-[44px] w-full sm:w-auto flex items-center justify-between sm:justify-start bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-1.5 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">{asset}</span>
                <span className="font-mono text-sm sm:text-base font-bold text-white">
                  {formatValue(lastPrice)}
                </span>
                <span className={`inline-flex items-center text-xs font-semibold font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <TrendingUp className={`w-3.5 h-3.5 mr-0.5 ${!isPositive ? 'rotate-180' : ''}`} aria-hidden="true" />
                  <span>{isPositive ? '+' : ''}{dailyChangePct.toFixed(2)}%</span>
                </span>
              </div>
              <div className="h-4 w-[1px] bg-gray-800 shrink-0" />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-400">Sinyal:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider ${
                  signal === 'BUY' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : signal === 'SELL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {signal}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                id="btn-synchronize-pipeline"
                type="button"
                onClick={onSynchronize}
                disabled={isSyncing}
                className={`min-h-[44px] flex items-center justify-center space-x-1.5 text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl border transition-colors cursor-pointer ${
                  isSyncing
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 cursor-wait'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300 shadow-sm'
                }`}
                title="Crawl data Yahoo Finance terbaru, jalankan cleaning & model ML Advanced RF, dan perbarui payload JSON secara asinkron"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span className="truncate">{isSyncing ? 'Syncing...' : 'Synchronize'}</span>
              </button>

              <button
                id="btn-quick-create-alert"
                type="button"
                onClick={onOpenCreateAlert}
                className="min-h-[44px] flex items-center justify-center space-x-1.5 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors cursor-pointer"
                title="Pasang Price Alert Baru"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="truncate">+ Alert</span>
              </button>

              <button
                id="btn-theme-toggle"
                type="button"
                onClick={onToggleTheme}
                aria-label={isLight ? 'Beralih ke Mode Malam (Gelap)' : 'Beralih ke Mode Siang (Terang)'}
                aria-pressed={isLight}
                title={isLight ? 'Mode Siang Aktif - Klik untuk Mode Malam' : 'Mode Malam Aktif - Klik untuk Mode Siang'}
                className={`min-h-[44px] flex items-center justify-center space-x-1.5 text-xs font-semibold px-2.5 sm:px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-700 shadow-xs'
                    : 'bg-gray-900 hover:bg-gray-800 border-gray-700 text-amber-300'
                }`}
              >
                {isLight ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                    <span className="sm:hidden">Siang</span>
                    <span className="hidden sm:inline">Mode Siang</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-300 shrink-0" aria-hidden="true" />
                    <span className="sm:hidden">Malam</span>
                    <span className="hidden sm:inline">Mode Malam</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-2 border-t border-gray-850 gap-2">
          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 w-full md:w-auto">
            <button
              id="btn-select-xau"
              type="button"
              onClick={() => onSelectAsset('XAU/USD')}
              className={`min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer text-center ${
                isXau
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Spot Gold (XAU/USD)
            </button>
            <button
              id="btn-select-antam"
              type="button"
              onClick={() => onSelectAsset('ANTAM')}
              className={`min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer text-center ${
                !isXau
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Emas Fisik Antam (LM)
            </button>
          </div>

          <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto" aria-label="Navigasi Mode Aplikasi">
            <button
              id="tab-dashboard"
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`min-h-[44px] flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-gray-800 text-white border border-gray-700 font-semibold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Dashboard & Chart</span>
            </button>

            <button
              id="tab-comparison"
              type="button"
              onClick={() => setActiveTab('comparison')}
              className={`min-h-[44px] flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <TableProperties className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Komparasi Prediksi</span>
            </button>

            <button
              id="tab-alerts"
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`min-h-[44px] flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors relative cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Price Alerts</span>
              {activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              id="tab-mode-a"
              type="button"
              onClick={() => setActiveTab('modeA')}
              className={`min-h-[44px] flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'modeA'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Mode A: Analis AI</span>
            </button>

            <button
              id="tab-mode-b"
              type="button"
              onClick={() => setActiveTab('modeB')}
              className={`min-h-[44px] flex-1 md:flex-initial flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'modeB'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 border border-transparent'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
              <span>Mode B: Dev API</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
