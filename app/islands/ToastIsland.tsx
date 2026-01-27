/**
 * ============================================================================
 * LEAN MEAN VPS - Toast Notification Island
 * ============================================================================
 *
 * WAS:
 * Globales Benachrichtigungssystem, das auch den Offline-Status überwacht.
 *
 * WIE:
 * 1. Event-basiert: Bietet eine globale 'notify' Funktion.
 * 2. Connectivity: Integriert 'connectivity.onStatusChange' zur Echtzeit-Anzeige.
 * 3. Sync: Triggered die 'syncEngine.process()' bei Wiederverbindung.
 *
 * WARUM:
 * Verbessert die UX durch direktes Feedback bei Netzwerkänderungen und
 * Hintergrundprozessen ohne Blocking-UI.
 *
 * @version 1.0.0
 * ============================================================================
 */

import { useEffect, useState } from 'hono/jsx';
import { t } from '../core/i18n/client';
import { connectivity, syncEngine } from '../core/lib/offline';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

// Globaler Emitter für die Island
let toastFn: (msg: string, type: ToastType) => void;

/**
 * Löst eine Benachrichtigung von überall im Client-Code aus.
 */
export const notify = (msg: string, type: ToastType = 'info') => {
  if (toastFn) toastFn(msg, type);
};

export default function ToastIsland() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // 1. Toast-Funktion registrieren
    toastFn = (text, type) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, text, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    // 2. Connectivity Überwachung
    const unsubscribe = connectivity.onStatusChange(async (isOnline) => {
      if (isOnline) {
        notify(t('toast.online'), 'success');
        const result = await syncEngine.process();
        if (result.success > 0) {
          notify(t('toast.synced', { count: String(result.success) }), 'success');
        }
        if (result.failed > 0) {
          notify(t('toast.syncFailed', { count: String(result.failed) }), 'error');
        }
      } else {
        notify(t('toast.offline'), 'warning');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-5 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold animate-slide-in pointer-events-auto border backdrop-blur-md flex items-center gap-3
            ${
              t.type === 'error'
                ? 'bg-red-500/90 border-red-400'
                : t.type === 'warning'
                  ? 'bg-amber-500/90 border-amber-400'
                  : t.type === 'success'
                    ? 'bg-primary/90 border-primary-light'
                    : 'bg-zinc-800/90 border-zinc-700'
            }
          `}
        >
          <div className="flex-1">{t.text}</div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="opacity-50 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
