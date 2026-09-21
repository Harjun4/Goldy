import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetType, TimeframeType, PriceAlert, AlertNotification } from './types';
import { createAssetData } from './data/goldData';
import { Header } from './components/Header';
import { TradingViewChart } from './components/TradingViewChart';
import { AiAnalyticsPanel } from './components/AiAnalyticsPanel';
import { TechnicalMacroMatrix } from './components/TechnicalMacroMatrix';
import { ModeAChat } from './components/ModeAChat';
import { ModeBExplorer } from './components/ModeBExplorer';
import { PriceAlertModal } from './components/PriceAlertModal';
import { PriceAlertPanel } from './components/PriceAlertPanel';
import { AlertToast } from './components/AlertToast';
import { playAlertChime } from './utils/audioAlert';
import { ShieldCheck, Database, Cpu } from 'lucide-react';

const LOCAL_STORAGE_KEY_ALERTS = 'goldy_price_alerts_v1';
const LOCAL_STORAGE_KEY_NOTIFS = 'goldy_alert_notifs_v1';

// Starter alerts for immediate out-of-the-box experience
const DEFAULT_ALERTS: PriceAlert[] = [
  {
    id: 'alert-xau-breakout',
    asset: 'XAU/USD',
    condition: 'ABOVE',
    targetValue: 2515.00,
    initialPrice: 2510.45,
    createdAt: new Date().toLocaleTimeString('id-ID'),
    triggered: false,
    active: true,
    note: 'Breakout Resistance Terdekat ($2515)',
    soundEnabled: true,
  },
  {
    id: 'alert-antam-target',
    asset: 'ANTAM',
    condition: 'ABOVE',
    targetValue: 1490000,
    initialPrice: 1485000,
    createdAt: new Date().toLocaleTimeString('id-ID'),
    triggered: false,
    active: true,
    note: 'Level Akumulasi Buyback Emas Antam',
    soundEnabled: true,
  },
  {
    id: 'alert-xau-pct',
    asset: 'XAU/USD',
    condition: 'PCT_GAIN',
    targetValue: 0.5,
    initialPrice: 2510.45,
    createdAt: new Date().toLocaleTimeString('id-ID'),
    triggered: false,
    active: true,
    note: 'Trigger Kenaikan Momentum Harian +0.50%',
    soundEnabled: true,
  }
];

export default function App() {
  const [asset, setAsset] = useState<AssetType>('XAU/USD');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modeA' | 'modeB' | 'alerts'>('dashboard');
  const [timeframe, setTimeframe] = useState<TimeframeType>('1D');
  const [priceOffset, setPriceOffset] = useState<number>(0);
  const [liveUpdating, setLiveUpdating] = useState<boolean>(true);
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  // Price Alert & Notification States
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<AlertNotification | null>(null);

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ALERTS;
  });

  const [notifications, setNotifications] = useState<AlertNotification[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error(e);
    }
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  // Generate current market snapshot for selected asset and timeframe
  const currentData = createAssetData(asset, priceOffset, timeframe);
  
  // Calculate live prices for both assets
  const xauData = createAssetData('XAU/USD', priceOffset, '1D');
  const antamData = createAssetData('ANTAM', priceOffset, '1D');

  // Live tick simulator (micro-fluctuations every 4 seconds when active)
  useEffect(() => {
    if (!liveUpdating) return;
    const interval = setInterval(() => {
      setPriceOffset((prev) => {
        const delta = (Math.random() - 0.49) * (asset === 'XAU/USD' ? 0.45 : 600);
        return prev + delta;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [liveUpdating, asset]);

  // Alert Scanner Engine: evaluate active alerts against current prices
  useEffect(() => {
    alerts.forEach((alert) => {
      if (!alert.active || alert.triggered) return;

      const curPrice = alert.asset === 'XAU/USD' ? xauData.lastPrice : antamData.lastPrice;
      let isTriggered = false;
      let triggerReason = '';

      if (alert.condition === 'ABOVE' && curPrice >= alert.targetValue) {
        isTriggered = true;
        triggerReason = `Harga ${alert.asset} telah menembus target NAIK ${alert.asset === 'XAU/USD' ? '$' + alert.targetValue : 'Rp ' + alert.targetValue.toLocaleString('id-ID')} (Harga saat ini: ${alert.asset === 'XAU/USD' ? '$' + curPrice.toFixed(2) : 'Rp ' + Math.round(curPrice).toLocaleString('id-ID')}).`;
      } else if (alert.condition === 'BELOW' && curPrice <= alert.targetValue) {
        isTriggered = true;
        triggerReason = `Harga ${alert.asset} telah turun di bawah target ${alert.asset === 'XAU/USD' ? '$' + alert.targetValue : 'Rp ' + alert.targetValue.toLocaleString('id-ID')} (Harga saat ini: ${alert.asset === 'XAU/USD' ? '$' + curPrice.toFixed(2) : 'Rp ' + Math.round(curPrice).toLocaleString('id-ID')}).`;
      } else if (alert.condition === 'PCT_GAIN') {
        const gainPct = ((curPrice - alert.initialPrice) / alert.initialPrice) * 100;
        if (gainPct >= alert.targetValue) {
          isTriggered = true;
          triggerReason = `Harga ${alert.asset} naik +${gainPct.toFixed(2)}% (Target: +${alert.targetValue}%).`;
        }
      } else if (alert.condition === 'PCT_DROP') {
        const dropPct = ((alert.initialPrice - curPrice) / alert.initialPrice) * 100;
        if (dropPct >= alert.targetValue) {
          isTriggered = true;
          triggerReason = `Harga ${alert.asset} turun -${dropPct.toFixed(2)}% (Target: -${alert.targetValue}%).`;
        }
      }

      if (isTriggered) {
        // Trigger alert!
        const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Play audio chime
        if (alert.soundEnabled) {
          playAlertChime(alert.condition === 'ABOVE' || alert.condition === 'PCT_GAIN' ? 'BULLISH' : 'BEARISH');
        }

        // Update alert item
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alert.id
              ? {
                  ...a,
                  triggered: true,
                  triggeredAt: timestamp,
                  triggeredPrice: curPrice,
                }
              : a
          )
        );

        // Add to notifications
        const notif: AlertNotification = {
          id: `notif-${Date.now()}-${alert.id}`,
          alertId: alert.id,
          asset: alert.asset,
          title: `🔔 Price Alert Terpicu: ${alert.asset}`,
          message: triggerReason,
          timestamp,
          price: curPrice,
          read: false,
          type: 'ALERT_TRIGGERED',
        };

        setNotifications((prev) => [notif, ...prev]);
        setActiveToast(notif);
      }
    });
  }, [xauData.lastPrice, antamData.lastPrice, alerts]);

  // Alert Actions
  const handleAddAlert = (newAlertData: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const newAlert: PriceAlert = {
      ...newAlertData,
      id: `alert-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      triggered: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleTestTrigger = (alert: PriceAlert) => {
    const curPrice = alert.asset === 'XAU/USD' ? xauData.lastPrice : antamData.lastPrice;
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (alert.soundEnabled) {
      playAlertChime(alert.condition === 'ABOVE' || alert.condition === 'PCT_GAIN' ? 'BULLISH' : 'BEARISH');
    }

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? {
              ...a,
              triggered: true,
              triggeredAt: `${timestamp} (Tes Simulasi)`,
              triggeredPrice: curPrice,
            }
          : a
      )
    );

    const testNotif: AlertNotification = {
      id: `test-notif-${Date.now()}`,
      alertId: alert.id,
      asset: alert.asset,
      title: `🔔 [Uji Simulasi] Price Alert Terpicu: ${alert.asset}`,
      message: `Simulasi pemicu berhasil: Level target ${alert.condition} ${alert.targetValue} terdeteksi aktif pada harga live.`,
      timestamp,
      price: curPrice,
      read: false,
      type: 'ALERT_TRIGGERED',
    };

    setNotifications((prev) => [testNotif, ...prev]);
    setActiveToast(testNotif);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Reset offset when switching assets
  const handleSelectAsset = (newAsset: AssetType) => {
    setAsset(newAsset);
    setPriceOffset(0);
  };

  const handleAskGoldy = (question: string) => {
    setChatPrompt(question);
    setActiveTab('modeA');
  };

  const activeAlertsCount = alerts.filter((a) => a.active && !a.triggered).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300">
      
      {/* Top Sticky Header */}
      <Header
        asset={asset}
        onSelectAsset={handleSelectAsset}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'modeA') setChatPrompt(undefined);
        }}
        lastPrice={currentData.lastPrice}
        dailyChange={currentData.dailyChange}
        dailyChangePct={currentData.dailyChangePct}
        currency={currentData.currency}
        liveUpdating={liveUpdating}
        onToggleLive={() => setLiveUpdating(!liveUpdating)}
        signal={currentData.signal}
        activeAlertsCount={activeAlertsCount}
        onOpenCreateAlert={() => setIsAlertModalOpen(true)}
      />

      {/* Interactive Trigger Toast */}
      <AlertToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewAlerts={() => setActiveTab('alerts')}
      />

      {/* Price Alert Creation Modal */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentAsset={asset}
        xauPrice={xauData.lastPrice}
        antamPrice={antamData.lastPrice}
        onAddAlert={handleAddAlert}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Primary Dashboard & Interactive TradingView Charts */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top Grid: TradingView Chart + AI Analytics Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Interactive TradingView Chart (7 cols on XL) */}
              <div className="xl:col-span-7 flex flex-col">
                <TradingViewChart
                  candles={currentData.historicalCandles}
                  predictions={currentData.predictions}
                  asset={currentData.displayName}
                  currency={currentData.currency}
                  signal={currentData.signal}
                  timeframe={timeframe}
                  onTimeframeChange={(tf) => setTimeframe(tf)}
                />
              </div>

              {/* Right Column: AI Analytics Panel (5 cols on XL) */}
              <div className="xl:col-span-5 flex flex-col">
                <AiAnalyticsPanel
                  data={currentData}
                  onAskGoldy={handleAskGoldy}
                  onOpenModeB={() => setActiveTab('modeB')}
                />
              </div>

            </div>

            {/* Second Row: Technical & Macroeconomic Matrix */}
            <TechnicalMacroMatrix data={currentData} />

            {/* Third Row: Architecture & Model Specs */}
            <div className="bg-gray-950/80 border border-gray-850 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Deep Learning LSTM Architecture & Sourcing
                    </h3>
                    <p className="text-xs text-gray-400">
                      Model Bi-Directional LSTM dengan Sliding Window 60-hari melacak pola non-linear time-series
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    Supabase PostgreSQL (Time-Series DB)
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Yahoo Finance & GoldAPI Feeds
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-850 text-xs">
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px]">Metode Sliding Window</span>
                  <span className="text-gray-200 font-mono font-bold">60 Hari Historis</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Setiap observasi H+1 dikalkulasi dari vektor bar sekuensial 60 hari terakhir.
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px]">Ambang Batas Sinyal Perdagangan</span>
                  <span className="text-emerald-400 font-mono font-bold">&gt; +0.20% (BUY) / &lt; -0.20% (SELL)</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Toleransi fluktuasi netral -0.20% hingga +0.20% menghasilkan sinyal HOLD.
                  </p>
                </div>
                <div className="bg-gray-900 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block text-[11px]">Validasi Backtest Model</span>
                  <span className="text-cyan-400 font-mono font-bold">RMSE: ±{currentData.metrics.rmse} {currentData.unit}</span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Evaluasi error rendah mengindikasikan deviasi prediksi yang terkontrol.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Real-Time Price Alert Manager */}
        {activeTab === 'alerts' && (
          <PriceAlertPanel
            alerts={alerts}
            notifications={notifications}
            onOpenCreateModal={() => setIsAlertModalOpen(true)}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            onTestTrigger={handleTestTrigger}
            onClearNotifications={handleClearNotifications}
            xauPrice={xauData.lastPrice}
            antamPrice={antamData.lastPrice}
          />
        )}

        {/* Tab 3: Mode A: Analis Pasar & Edukasi Pengguna */}
        {activeTab === 'modeA' && (
          <ModeAChat
            data={currentData}
            initialQuestion={chatPrompt}
          />
        )}

        {/* Tab 4: Mode B: Developer API / JSON Output Generator */}
        {activeTab === 'modeB' && (
          <ModeBExplorer
            currentAsset={asset}
            lastPrice={currentData.lastPrice}
          />
        )}

      </main>

      {/* Mandatory Financial Disclaimer Footer */}
      <footer className="mt-auto border-t border-gray-850 bg-gray-950/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-300 block mb-0.5">
                Financial Risk Disclaimer
              </span>
              <p>
                <em>
                  "Disclaimer: Analisis dan proyeksi harga yang diberikan oleh Goldy merupakan hasil olahan model machine learning (LSTM) sebagai alat bantu keputusan. Ini bukan merupakan jaminan atau ajakan mutlak untuk membeli/menjual aset finansial. Selalu lakukan riset mandiri (DYOR) sebelum berinvestasi."
                </em>
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-gray-500 font-mono gap-2">
            <span>Goldy Analytics Engine • Powered by LSTM Deep Learning & Gemini 3.8 Flash</span>
            <span>Ticker Global: GC=F (XAU/USD) • Logam Mulia Antam (IDR/gr)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
