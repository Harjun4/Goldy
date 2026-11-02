import React from 'react';
import { AlertNotification } from '../types';
import { BellRing, X, ArrowRight } from 'lucide-react';

interface AlertToastProps {
  notification: AlertNotification | null;
  onDismiss: () => void;
  onViewAlerts: () => void;
}

export const AlertToast: React.FC<AlertToastProps> = ({
  notification,
  onDismiss,
  onViewAlerts,
}) => {
  if (!notification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-in slide-in-from-top duration-200"
    >
      <div className="bg-gray-950 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl text-white flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <BellRing className="w-5 h-5" aria-hidden="true" />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-300">
              {notification.title}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {notification.timestamp}
            </span>
          </div>

          <p className="text-xs text-gray-200 leading-snug font-medium">
            {notification.message}
          </p>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onViewAlerts();
                onDismiss();
              }}
              className="min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Lihat Detail Alert</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Tutup notifikasi"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
