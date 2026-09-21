import React from 'react';
import { PriceAlert, AlertNotification, AssetType } from '../types';
import { 
  Bell, 
  BellRing, 
  Trash2, 
  Power, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Play,
  History,
  ShieldAlert
} from 'lucide-react';

interface PriceAlertPanelProps {
  alerts: PriceAlert[];
  notifications: AlertNotification[];
  onOpenCreateModal: () => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onTestTrigger: (alert: PriceAlert) => void;
  onClearNotifications: () => void;
  xauPrice: number;
  antamPrice: number;
}

export const PriceAlertPanel: React.FC<PriceAlertPanelProps> = ({
  alerts,
  notifications,
  onOpenCreateModal,
  onToggleAlert,
  onDeleteAlert,
  onTestTrigger,
  onClearNotifications,
  xauPrice,
  antamPrice,
}) => {
  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const fmtPrice = (asset: AssetType, val: number) => {
    if (asset === 'XAU/USD') return `$${val.toFixed(2)}`;
    return `Rp ${Math.round(val).toLocaleString('id-ID')}`;
  };

  const getConditionLabel = (alert: PriceAlert) => {
    const isXau = alert.asset === 'XAU/USD';
    const currency = isXau ? 'USD' : 'IDR';

    switch (alert.condition) {
      case 'ABOVE':
        return `Harga Naik Di Atas ${fmtPrice(alert.asset, alert.targetValue)}`;
      case 'BELOW':
        return `Harga Turun Di Bawah ${fmtPrice(alert.asset, alert.targetValue)}`;
      case 'PCT_GAIN':
        return `Kenaikan Harga >= +${alert.targetValue}%`;
      case 'PCT_DROP':
        return `Penurunan Harga <= -${alert.targetValue}%`;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Quick Action */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Sistem Real-Time Price Alert
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {activeAlerts.filter(a => a.active).length} Aktif Dipantau
              </span>
            </h2>
            <p className="text-xs text-gray-400">
              Notifikasi otomatis ketika pergerakan pasar atau proyeksi harga mencapai level target
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Alert Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Column: Active & Triggered Alert Rules (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Alerts Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                Daftar Alert Aktif ({activeAlerts.length})
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                Tick Scan Real-Time
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/40">
                <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">Belum ada price alert yang aktif.</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  Pasang level harga target untuk mendapatkan notifikasi instan saat harga terpenuhi.
                </p>
                <button
                  onClick={onOpenCreateModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-amber-300 font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Alert Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const isXau = alert.asset === 'XAU/USD';
                  const curPrice = isXau ? xauPrice : antamPrice;
                  
                  let progressPct = 0;
                  if (alert.condition === 'ABOVE') {
                    progressPct = Math.min(100, Math.max(0, (curPrice / alert.targetValue) * 100));
                  } else if (alert.condition === 'BELOW') {
                    progressPct = Math.min(100, Math.max(0, ((alert.initialPrice - curPrice) / (alert.initialPrice - alert.targetValue)) * 100));
                  }

                  return (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border transition-all ${
                        alert.active 
                          ? 'bg-gray-950 border-gray-800 hover:border-gray-700' 
                          : 'bg-gray-950/40 border-gray-850 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-amber-300">
                              {alert.asset}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {getConditionLabel(alert)}
                            </span>
                            {alert.soundEnabled && (
                              <span title="Audio Chime Aktif">
                                <Volume2 className="w-3.5 h-3.5 text-amber-400/80" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3 text-[11px] text-gray-400 font-mono">
                            <span>Harga Saat Dibuat: {fmtPrice(alert.asset, alert.initialPrice)}</span>
                            <span>•</span>
                            <span className="text-amber-400">Harga Sekarang: {fmtPrice(alert.asset, curPrice)}</span>
                          </div>

                          {alert.note && (
                            <p className="text-[11px] text-gray-500 italic mt-0.5">
                              Catatan: "{alert.note}"
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center">
                          {/* Test Trigger Button */}
                          <button
                            onClick={() => onTestTrigger(alert)}
                            className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[11px] text-gray-300 hover:text-amber-300 font-mono flex items-center gap-1 transition-colors"
                            title="Simulasi Uji Pemicu Alert"
                          >
                            <Play className="w-3 h-3 text-amber-400" />
                            <span>Tes Pemicu</span>
                          </button>

                          {/* Power Toggle */}
                          <button
                            onClick={() => onToggleAlert(alert.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              alert.active
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                            }`}
                            title={alert.active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-rose-500/20 border border-gray-800 hover:border-rose-500/40 text-gray-500 hover:text-rose-400 transition-colors"
                            title="Hapus Alert"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Triggered Alerts History */}
          {triggeredAlerts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Riwayat Alert Terpicu ({triggeredAlerts.length})
              </h3>

              <div className="space-y-2.5">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-gray-950 border border-emerald-500/30 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          TERPICU
                        </span>
                        <span className="font-bold text-gray-200">
                          {alert.asset}: {getConditionLabel(alert)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                        <span>Terpicu pada harga: {fmtPrice(alert.asset, alert.triggeredPrice || alert.targetValue)}</span>
                        <span>•</span>
                        <span>{alert.triggeredAt || 'Baru saja'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-900 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Notification Log Center (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                Notification Center
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-[11px] text-gray-400 hover:text-gray-200 underline"
                >
                  Bersihkan
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                Belum ada log notifikasi sistem.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-gray-950 border border-gray-800 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-amber-400" />
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">{n.timestamp}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] font-mono text-gray-500">
                      Level: {fmtPrice(n.asset, n.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick guide card */}
          <div className="bg-gray-950 border border-gray-850 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
            <h4 className="font-bold text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Ketentuan Engine Notifikasi:
            </h4>
            <p className="text-[11px] leading-relaxed">
              Price alerts dievaluasi secara asinkron setiap ada perubahan tick harga baru atau pergeseran sinyal LSTM. Saat harga menembus target, audio chime akan berbunyi dan banner notifikasi muncul di bagian atas aplikasi.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
