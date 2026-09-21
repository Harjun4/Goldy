import React from 'react';
import { AssetType } from '../types';
import { 
  Sparkles, 
  TrendingUp, 
  Radio, 
  Terminal, 
  MessageSquareText, 
  Layers, 
  Bell, 
  Plus
} from 'lucide-react';

interface HeaderProps {
  asset: AssetType;
  onSelectAsset: (asset: AssetType) => void;
  activeTab: 'dashboard' | 'modeA' | 'modeB' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'modeA' | 'modeB' | 'alerts') => void;
  lastPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  currency: 'USD' | 'IDR';
  liveUpdating: boolean;
  onToggleLive: () => void;
  signal: string;
  activeAlertsCount: number;
  onOpenCreateAlert: () => void;
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
  liveUpdating,
  onToggleLive,
  signal,
  activeAlertsCount,
  onOpenCreateAlert,
}) => {
  const isPositive = dailyChange >= 0;
  const isXau = asset === 'XAU/USD';

  const formatValue = (val: number) => {
    if (currency === 'USD') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-1 ring-amber-300/30">
              <Sparkles className="w-5 h-5 text-gray-950 fill-gray-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Goldy
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    LSTM Engine
                  </span>
                </h1>
              </div>
              <p className="text-xs text-gray-400">
                AI Assistant & Analytics Engine Emas (XAU/USD & Antam)
              </p>
            </div>
          </div>

          {/* Quick Price & Signal Pill & Alert CTA */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Price badge */}
            <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 space-x-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">{asset}</span>
                <span className="font-mono text-base font-bold text-white">
                  {formatValue(lastPrice)}
                </span>
              </div>
              <div className={`flex items-center text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                <TrendingUp className={`w-3.5 h-3.5 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                <span>{isPositive ? '+' : ''}{dailyChangePct.toFixed(2)}%</span>
              </div>
              <div className="h-4 w-[1px] bg-gray-800" />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-gray-400">Sinyal:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono tracking-wider ${
                  signal === 'BUY' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : signal === 'SELL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {signal}
                </span>
              </div>
            </div>

            {/* Price Alert Quick Trigger Button */}
            <button
              id="btn-quick-create-alert"
              onClick={onOpenCreateAlert}
              className="flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-colors"
              title="Pasang Price Alert Baru"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Alert</span>
            </button>

            {/* Live Feed Toggle */}
            <button
              id="btn-live-feed"
              onClick={onToggleLive}
              className={`flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                liveUpdating
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
              title="Simulasi real-time tick market"
            >
              <Radio className={`w-3.5 h-3.5 ${liveUpdating ? 'animate-pulse text-emerald-400' : 'text-gray-500'}`} />
              <span>{liveUpdating ? 'Live Tick' : 'Paused'}</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-Bar: Asset Switcher & Mode Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 border-t border-gray-850 gap-2">
          
          {/* Asset Selection Buttons */}
          <div className="flex items-center space-x-1.5 bg-gray-900 p-1 rounded-lg border border-gray-800 self-start">
            <button
              id="btn-select-xau"
              onClick={() => onSelectAsset('XAU/USD')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isXau
                  ? 'bg-amber-500 text-gray-950 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Spot Gold (XAU/USD)
            </button>
            <button
              id="btn-select-antam"
              onClick={() => onSelectAsset('ANTAM')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isXau
                  ? 'bg-amber-500 text-gray-950 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Emas Fisik Antam (LM)
            </button>
          </div>

          {/* Navigation Modes */}
          <nav className="flex items-center space-x-1 overflow-x-auto">
            <button
              id="tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard & Chart</span>
            </button>

            <button
              id="tab-alerts"
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors relative ${
                activeTab === 'alerts'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Price Alerts</span>
              {activeAlertsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-gray-950 font-mono text-[10px] font-bold flex items-center justify-center">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              id="tab-mode-a"
              onClick={() => setActiveTab('modeA')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'modeA'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode A: Analis AI</span>
            </button>

            <button
              id="tab-mode-b"
              onClick={() => setActiveTab('modeB')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'modeB'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mode B: Dev API</span>
            </button>
          </nav>
        </div>

      </div>
    </header>
  );
};
