/**
 * ============================================================================
 * LEAN MEAN VPS - PWA Client Entry & Service Worker Registration
 * ============================================================================
 *
 * DATEI-ZWECK:
 * Dies ist der Einstiegspunkt für den Browser-Teil der Anwendung.
 * Initialisiert die HonoX Islands und den PWA Service Worker.
 *
 * @author LEAN_MEAN_VPS
 * @version 2.0.0
 * ============================================================================
 */

import { createClient } from 'honox/client';

/**
 * HonoX Client-Hydrierung starten
 * Aktiviert interaktive Komponenten (Islands) im Browser.
 */
createClient();

// i18n helper
// biome-ignore lint/suspicious/noExplicitAny: Global injection
const dict = (window as any).__I18N_CLIENT__ || {
  updateAvailable: 'Neue Version verfügbar!',
  updateNow: 'Jetzt aktualisieren',
  offlineReady: 'App ist bereit für den Offline-Betrieb.',
};

/**
 * SERVICE WORKER REGISTRIERUNG
 * Nutzt das Vite-PWA Plugin für Offline-Support.
 */
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        showUpdateBanner(updateSW);
      },
      onOfflineReady() {
        console.log(dict.offlineReady);
      },
    });
  });
}

/**
 * showUpdateBanner
 * Informiert den Benutzer, dass eine neue Version der App verfügbar ist.
 */
function showUpdateBanner(updateFn: (reloadPage?: boolean) => Promise<void>): void {
  const banner = document.createElement('div');
  banner.className =
    'fixed bottom-4 left-4 right-4 p-4 glass-card bg-primary text-bg-dark z-50 flex justify-between items-center shadow-2xl';
  banner.innerHTML = `
    <span class="font-bold">${dict.updateAvailable}</span>
    <button id="sw-update-btn" class="px-4 py-2 bg-white/20 rounded-lg font-black hover:bg-white/40 transition-colors">${dict.updateNow}</button>
  `;
  document.body.appendChild(banner);

  const btn = document.getElementById('sw-update-btn');
  if (btn) {
    btn.onclick = () => {
      updateFn(true);
    };
  }
}

/**
 * GLOBAL EVENT LISTENERS
 */
window.addEventListener('online', () => {
  console.log('Verbindung wiederhergestellt.');
});

window.addEventListener('offline', () => {
  console.warn('Eingeschränkte Funktionalität: Du bist offline.');
});
