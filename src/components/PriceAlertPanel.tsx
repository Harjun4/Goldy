import React from 'react';
import { PriceAlert, AlertNotification, AssetType } from '../types';
import { 
  Bell, 
  BellRing, 
  Trash2, 
  Power, 
  Plus, 
  CheckCircle2, 
  Volume2, 
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
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BellRing className="w-5 h-5" aria-hidden="true" />
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
          type="button"
          onClick={onOpenCreateModal}
          className="min-h-[44px] flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Buat Alert Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-400" aria-hidden="true" />
                Daftar Alert Aktif ({activeAlerts.length})
              </h3>
              <span className="text-[11px] font-mono text-gray-400">
                Tick Scan Real-Time
              </span>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-gray-950/40">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-gray-300 font-medium">Belum ada price alert yang aktif.</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Pasang level harga target untuk mendapatkan notifikasi instan saat harga terpenuhi.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="min-h-[44px] mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-xs text-amber-300 font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Tambah Alert Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => {
                  const isXau = alert.asset === 'XAU/USD';
                  const curPrice = isXau ? xauPrice : antamPrice;

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
                              <span title="Audio Chime Aktif" aria-label="Audio Chime Aktif">
                                <Volume2 className="w-3.5 h-3.5 text-amber-400/80" aria-hidden="true" />
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400 font-mono">
                            <span>Harga Saat Dibuat: {fmtPrice(alert.asset, alert.initialPrice)}</span>
                            <span>•</span>
                            <span className="text-amber-400">Harga Sekarang: {fmtPrice(alert.asset, curPrice)}</span>
                          </div>

                          {alert.note && (
                            <p className="text-[11px] text-gray-400 italic mt-0.5">
                              Catatan: "{alert.note}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => onTestTrigger(alert)}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 hover:text-amber-300 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Simulasi Uji Pemicu Alert"
                          >
                            <Play className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                            <span>Tes Pemicu</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleAlert(alert.id)}
                            aria-label={alert.active ? `Nonaktifkan alert ${alert.asset}` : `Aktifkan alert ${alert.asset}`}
                            aria-pressed={alert.active}
                            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                              alert.active
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
                            }`}
                            title={alert.active ? 'Nonaktifkan' : 'Aktifkan'}
                          >
                            <Power className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteAlert(alert.id)}
                            aria-label={`Hapus alert ${alert.asset}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-gray-900 hover:bg-rose-500/20 border border-gray-800 hover:border-rose-500/40 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Alert"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {triggeredAlerts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                Riwayat Alert Terpicu ({triggeredAlerts.length})
              </h3>

              <div className="space-y-2.5">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-xl bg-gray-950 border border-emerald-500/30 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          TERPICU
                        </span>
                        <span className="font-bold text-gray-200">
                          {alert.asset}: {getConditionLabel(alert)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono flex flex-wrap items-center gap-2">
                        <span>Terpicu pada harga: {fmtPrice(alert.asset, alert.triggeredPrice || alert.targetValue)}</span>
                        <span>•</span>
                        <span>{alert.triggeredAt || 'Baru saja'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteAlert(alert.id)}
                      aria-label={`Hapus riwayat alert ${alert.asset}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-gray-400 hover:text-rose-400 hover:bg-gray-900 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                Notification Center
              </h3>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={onClearNotifications}
                  className="min-h-[44px] px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-200 underline cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
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
                        <Bell className="w-3 h-3 text-amber-400" aria-hidden="true" />
                        {n.title}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{n.timestamp}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] leading-relaxed">
                      {n.message}
                    </p>
                    <div className="text-[10px] font-mono text-gray-400">
                      Level: {fmtPrice(n.asset, n.price)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-950 border border-gray-850 rounded-2xl p-4 text-xs text-gray-400 space-y-2">
            <h4 className="font-bold text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" aria-hidden="true" />
              Ketentuan Engine Notifikasi:
            </h4>
            <p className="text-[11px] leading-relaxed">
              Price alerts dievaluasi secara asinkron setiap ada perubahan tick harga baru atau pergeseran sinyal. Saat harga menembus target, audio chime akan berbunyi dan banner notifikasi muncul di bagian atas aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
