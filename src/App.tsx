import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AssetType, TimeframeType, PriceAlert, AlertNotification, ThemeMode } from './types';
import { 
  MASTER_PAYLOAD,
  createAssetData, 
  setRuntimeGoldData, 
  getLatestHistoricalDate, 
  getForecastH1Date 
} from './data/goldData';
import { Header } from './components/Header';
import { TradingViewChart } from './components/TradingViewChart';
import { AiAnalyticsPanel } from './components/AiAnalyticsPanel';
import { TechnicalMacroMatrix } from './components/TechnicalMacroMatrix';
import { ModeAChat } from './components/ModeAChat';
import { ModeBExplorer } from './components/ModeBExplorer';
import { PriceAlertModal } from './components/PriceAlertModal';
import { PriceAlertPanel } from './components/PriceAlertPanel';
import { PredictionComparisonTable } from './components/PredictionComparisonTable';
import { AlertToast } from './components/AlertToast';
import { playAlertChime } from './utils/audioAlert';
import { ShieldCheck, Database, Cpu, ChevronRight } from 'lucide-react';

const LOCAL_STORAGE_KEY_ALERTS = 'goldy_price_alerts_v4';
const LOCAL_STORAGE_KEY_NOTIFS = 'goldy_alert_notifs_v4';
const LOCAL_STORAGE_KEY_THEME = 'goldy_theme_v1';

function buildDefaultAlerts(): PriceAlert[] {
  const xauPrice = MASTER_PAYLOAD.current_data.xau_usd.price;
  const antamPrice = MASTER_PAYLOAD.current_data.antam_idr.price_per_gram;
  const ratio = antamPrice / xauPrice;
  const r1Xau = MASTER_PAYLOAD.technical_indicators.support_resistance.R1;
  const s1Xau = MASTER_PAYLOAD.technical_indicators.support_resistance.S1;
  const s1Antam = Math.round(s1Xau * ratio);
  const createdAt = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return [
    {
      id: 'alert-xau-resistance',
      asset: 'XAU/USD',
      condition: 'ABOVE',
      targetValue: r1Xau,
      initialPrice: xauPrice,
      createdAt,
      triggered: false,
      active: true,
      note: `Uji Breakout Plafon Resistance R1 ($${r1Xau.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
      soundEnabled: true,
    },
    {
      id: 'alert-xau-pullback',
      asset: 'XAU/USD',
      condition: 'BELOW',
      targetValue: s1Xau,
      initialPrice: xauPrice,
      createdAt,
      triggered: false,
      active: true,
      note: `Target Pullback Support S1 ($${s1Xau.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
      soundEnabled: true,
    },
    {
      id: 'alert-antam-dca',
      asset: 'ANTAM',
      condition: 'BELOW',
      targetValue: s1Antam,
      initialPrice: antamPrice,
      createdAt,
      triggered: false,
      active: true,
      note: `Area Akumulasi DCA Antam Fisik (Support S1 Rp ${s1Antam.toLocaleString('id-ID')})`,
      soundEnabled: true,
    },
  ];
}

function getExpectedSettledTradingDate(): string {
  const now = new Date();
  const day = now.getDay();
  const target = new Date(now);
  if (day === 1) {
    target.setDate(now.getDate() - 3);
  } else if (day === 0) {
    target.setDate(now.getDate() - 2);
  } else {
    target.setDate(now.getDate() - 1);
  }
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });
  const [asset, setAsset] = useState<AssetType>('XAU/USD');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'modeA' | 'modeB' | 'alerts'>('dashboard');
  const [timeframe, setTimeframe] = useState<TimeframeType>('1D');
  const priceOffset = 0;
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_THEME, theme);
    } catch (e) {}
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncRevision, setSyncRevision] = useState<number>(0);
  const hasCheckedDailySyncRef = useRef<boolean>(false);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<AlertNotification | null>(null);

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY_ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return buildDefaultAlerts();
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

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const handleSynchronize = useCallback(async (isAutoBackground: boolean = false) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await fetch('/api/goldy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        throw new Error(data.message || 'Gagal menjalankan sinkronisasi pipeline.');
      }

      setRuntimeGoldData(data.payload, data.candles);
      setSyncRevision((r) => r + 1);

      const summary = data.summary || {};
      const lastDate = summary.current_last_date || getLatestHistoricalDate();
      const forecastDate = summary.forecast_h1_date || getForecastH1Date();
      const durationSec = summary.duration_ms ? (summary.duration_ms / 1000).toFixed(1) : '3.8';
      const newBars = summary.new_bars_added ?? 0;
      const xauPrice = summary.last_price_usd ?? data.payload?.current_data?.xau_usd?.price ?? MASTER_PAYLOAD.current_data.xau_usd.price;
      const targetH1 = summary.target_h1_usd ?? data.payload?.projections?.H1?.target_price_usd_base ?? MASTER_PAYLOAD.projections.H1.target_price_usd_base;
      const sig = summary.signal ?? data.payload?.ai_recommendation?.signal ?? 'HOLD';

      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      playAlertChime(sig === 'SELL' ? 'BEARISH' : 'BULLISH');

      const syncNotif: AlertNotification = {
        id: `sync-${Date.now()}`,
        asset: 'XAU/USD',
        title: isAutoBackground
          ? `Auto-Sync Harian Selesai (${lastDate})`
          : `Sinkronisasi Data & ML Selesai (${durationSec}s)`,
        message: `Data pasar hingga ${lastDate} (${newBars > 0 ? `+${newBars} bar baru` : 'terkini'}) & prediksi Advanced RF untuk besok (${forecastDate}) berhasil dimuat. XAU/USD: $${Number(xauPrice).toFixed(2)} -> Target H+1: $${Number(targetH1).toFixed(2)} (${sig}).`,
        timestamp,
        price: Number(xauPrice),
        read: false,
        type: 'DATA_SYNC',
      };

      setNotifications((prev) => [syncNotif, ...prev]);
      setActiveToast(syncNotif);
    } catch (err: any) {
      console.error('[Goldy Sync Error]:', err);
      if (!isAutoBackground) {
        const timestamp = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const errNotif: AlertNotification = {
          id: `sync-err-${Date.now()}`,
          asset: 'XAU/USD',
          title: 'Sinkronisasi Pipeline Gagal',
          message: err?.message || 'Tidak dapat terhubung ke endpoint /api/goldy/sync.',
          timestamp,
          price: MASTER_PAYLOAD.current_data.xau_usd.price,
          read: false,
          type: 'DATA_SYNC',
        };
        setNotifications((prev) => [errNotif, ...prev]);
        setActiveToast(errNotif);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    if (hasCheckedDailySyncRef.current) return;
    hasCheckedDailySyncRef.current = true;

    (async () => {
      try {
        const res = await fetch('/api/goldy/payload?include_candles=true');
        if (res.ok) {
          const data = await res.json();
          if (data.payload) {
            setRuntimeGoldData(data.payload, data.candles);
            setSyncRevision((r) => r + 1);
          }
        }
      } catch (err) {}

      const latestBarDate = getLatestHistoricalDate();
      const expectedH1SettledDate = getExpectedSettledTradingDate();
      if (latestBarDate && latestBarDate < expectedH1SettledDate) {
        handleSynchronize(true);
      }
    })();
  }, [handleSynchronize]);

  const currentData = createAssetData(asset, priceOffset, timeframe);
  const xauData = createAssetData('XAU/USD', priceOffset, '1D');
  const antamData = createAssetData('ANTAM', priceOffset, '1D');

  const lastDataDate = getLatestHistoricalDate();
  const forecastH1Date = getForecastH1Date();

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
                  triggeredAt: timestamp,
                  triggeredPrice: curPrice,
                }
              : a
          )
        );

        const notif: AlertNotification = {
          id: `notif-${Date.now()}-${alert.id}`,
          alertId: alert.id,
          asset: alert.asset,
          title: `Price Alert Terpicu: ${alert.asset}`,
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
      title: `[Uji Simulasi] Price Alert Terpicu: ${alert.asset}`,
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

  const handleSelectAsset = (newAsset: AssetType) => {
    setAsset(newAsset);
  };

  const handleAskGoldy = (question: string) => {
    setChatPrompt(question);
    setActiveTab('modeA');
  };

  const activeAlertsCount = alerts.filter((a) => a.active && !a.triggered).length;
  const isXauCurrent = currentData.currency === 'USD';
  const rmseDisplay = isXauCurrent && currentData.metrics.riskRmseOz
    ? currentData.metrics.riskRmseOz
    : `RMSE: ±Rp ${Math.round(currentData.metrics.rmse).toLocaleString('id-ID')} / ${currentData.unit}`;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'light'
        ? 'bg-[#f4efe6] text-slate-900 selection:bg-amber-500/20 selection:text-amber-900'
        : 'bg-gray-900 text-gray-100 selection:bg-amber-500/30 selection:text-amber-300'
    }`}>
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
        signal={currentData.signal}
        activeAlertsCount={activeAlertsCount}
        onOpenCreateAlert={() => setIsAlertModalOpen(true)}
        isSyncing={isSyncing}
        onSynchronize={() => handleSynchronize(false)}
        lastDataDate={lastDataDate}
        forecastDate={forecastH1Date}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <AlertToast
        notification={activeToast}
        onDismiss={() => setActiveToast(null)}
        onViewAlerts={() => setActiveTab('alerts')}
      />

      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        currentAsset={asset}
        xauPrice={xauData.lastPrice}
        antamPrice={antamData.lastPrice}
        onAddAlert={handleAddAlert}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
              <div className="xl:col-span-7 flex flex-col">
                <TradingViewChart
                  candles={currentData.historicalCandles}
                  predictions={currentData.predictions}
                  asset={currentData.displayName}
                  currency={currentData.currency}
                  signal={currentData.signal}
                  timeframe={timeframe}
                  onTimeframeChange={(tf) => setTimeframe(tf)}
                  theme={theme}
                />
              </div>

              <div className="xl:col-span-5 flex flex-col">
                <AiAnalyticsPanel
                  data={currentData}
                  onAskGoldy={handleAskGoldy}
                  onOpenModeB={() => setActiveTab('modeB')}
                />
              </div>
            </div>

            <TechnicalMacroMatrix data={currentData} />

            <div className="bg-gray-950/80 border border-gray-850 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Cpu className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      {currentData.metrics.engineName || 'Goldy Multi-Horizon Core'} & Architecture
                    </h3>
                    <p className="text-xs text-gray-400">
                      {currentData.metrics.modelType} melacak pola non-linear time-series & sensitivitas makro
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800">
                    <Database className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    Dataset Historis: {lastDataDate} (4,225 Bar)
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Yahoo Finance & Advanced RF Pipeline
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-850 text-xs">
                <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/30">
                  <span className="text-gray-400 font-medium block text-[11px]">Metode Lookback Multi-Scale</span>
                  <span className="text-amber-300 font-mono font-bold">1D s/d 60D Historis</span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Vektor 17 fitur multi-horizon dengan lag pergerakan harga dan 8 instrumen makroekonomi.
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-gray-400 font-medium block text-[11px]">Ambang Batas Sinyal Perdagangan</span>
                  <span className="text-emerald-400 font-mono font-bold">&gt; +0.20% (BUY) / &lt; -0.20% (SELL)</span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Toleransi fluktuasi netral -0.20% hingga +0.20% menghasilkan sinyal HOLD.
                  </p>
                </div>
                <div className="bg-cyan-500/10 p-3 rounded-xl border border-cyan-500/30">
                  <span className="text-gray-400 font-medium block text-[11px]">Validasi Backtest Model</span>
                  <span className="text-cyan-400 font-mono font-bold">{rmseDisplay}</span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Akurasi historis evaluasi model: {currentData.metrics.accuracyRate}.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-850 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm group cursor-pointer"
                >
                  <span>Lihat Riwayat & Tabel Komparasi Prediksi vs Aktual</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <PredictionComparisonTable
            key={`${asset}-${syncRevision}`}
            currentAsset={asset}
            theme={theme}
          />
        )}

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

        {activeTab === 'modeA' && (
          <ModeAChat
            data={currentData}
            initialQuestion={chatPrompt}
          />
        )}

        {activeTab === 'modeB' && (
          <ModeBExplorer
            currentAsset={asset}
            lastPrice={currentData.lastPrice}
          />
        )}
      </main>

      <footer className="mt-auto border-t border-gray-850 bg-gray-950/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-gray-300 block mb-0.5">
                Financial Risk Disclaimer
              </span>
              <p>
                <em>
                  "Disclaimer: Analisis dan proyeksi harga yang diberikan oleh Goldy merupakan hasil olahan model machine learning ({currentData.metrics.modelType}) sebagai alat bantu keputusan. Ini bukan merupakan jaminan atau ajakan mutlak untuk membeli/menjual aset finansial. Selalu lakukan riset mandiri (DYOR) sebelum berinvestasi."
                </em>
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-gray-400 font-mono gap-2">
            <span>Goldy Analytics Engine • Powered by {currentData.metrics.engineName || 'Multi-Horizon Core'} & Google Gemini</span>
            <span>
              Ticker Global: GC=F (XAU/USD: ${xauData.lastPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) • Logam Mulia Antam (Rp {Math.round(antamData.lastPrice).toLocaleString('id-ID')}/gr). Riwayat harga Antam diturunkan dari XAU/USD dengan rasio harga terkini, bukan data Antam historis.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
