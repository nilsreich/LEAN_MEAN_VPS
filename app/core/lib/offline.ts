/**
 * ============================================================================
 * LEAN MEAN VPS - PWA & Offline Utilities (Client-Side)
 * ============================================================================
 *
 * WAS:
 * Hilfsfunktionen für den Betrieb der App unter instabilen Netzwerk-
 * bedingungen oder im Offline-Modus.
 *
 * WIE:
 * 1. Connectivity-Check: Überwacht den `navigator.onLine` Status der App.
 * 2. Offline-Queue: Sammelt API-Anfragen, die während eines Verbindungsabbruchs
 *    getätigt wurden, und sendet diese automatisch bei Wiederverbindung (Re-Sync).
 *
 * WARUM:
 * Eine PWA sollte sich wie eine native App anfühlen. Durch diese Utilities
 * können wir dem Benutzer auch im Tunnel oder Flugmodus eine funktionierende
 * UI präsentieren und Datenverlust bei Verbindungsabbrüchen vermeiden.
 *
 * @version 1.1.0
 * ============================================================================
 */

/**
 * ============================================================
 * MUTATION QUEUE
 * ============================================================
 * Speichert fehlgeschlagene Mutationen für Offline-Sync
 */
interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body?: string;
  timestamp: number;
}

export const mutationQueue = {
  KEY: 'mutation_queue',

  /**
   * Fügt eine Mutation zur Queue hinzu
   */
  add(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>): void {
    const queue = this.getAll();
    queue.push({
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(this.KEY, JSON.stringify(queue));
  },

  /**
   * Holt alle gespeicherten Mutationen
   */
  getAll(): QueuedMutation[] {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Entfernt eine Mutation nach erfolgreichem Sync
   */
  remove(id: string): void {
    const queue = this.getAll().filter((m) => m.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(queue));
  },

  /**
   * Bereinigt die gesamte Queue
   */
  clear(): void {
    localStorage.removeItem(this.KEY);
  },
};

/**
 * ============================================================
 * SYNC ENGINE
 * ============================================================
 * Verarbeitet die Queue sequenziell (FIFO)
 */

const MAX_MUTATION_AGE_MS = 1000 * 60 * 60 * 24; // 24 Stunden

export const syncEngine = {
  /**
   * Hilfsfunktion zum Abrufen des aktuellen CSRF-Tokens
   */
  getCsrfToken(): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  },

  /**
   * Verarbeitet alle anstehenden Mutationen
   */
  async process(): Promise<{ success: number; failed: number; skipped: number }> {
    const queue = mutationQueue.getAll();
    if (queue.length === 0) return { success: 0, failed: 0, skipped: 0 };

    let success = 0;
    let failed = 0;
    let skipped = 0;

    const now = Date.now();

    for (const task of queue) {
      // 1. MaxAge Check
      if (now - task.timestamp > MAX_MUTATION_AGE_MS) {
        if (
          !confirm(`Die Aktion "${task.method} ${task.url}" ist über 24h alt. Trotzdem ausführen?`)
        ) {
          mutationQueue.remove(task.id);
          skipped++;
          continue;
        }
      }

      // 2. Request Ausführung
      try {
        const response = await fetch(task.url, {
          method: task.method,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.getCsrfToken(), // Token bei jedem Request erneuern
          },
          body: task.body,
        });

        if (response.ok) {
          mutationQueue.remove(task.id);
          success++;
        } else {
          // Bei Server-Fehler (4xx/5xx) stoppen wir, um FIFO-Integrität zu wahren
          console.error(`Sync failed for task ${task.id}: ${response.status}`);
          failed = queue.length - success - skipped;
          break;
        }
      } catch (err) {
        console.error('Network error during sync:', err);
        failed = queue.length - success - skipped;
        break; // Stop bei Netzwerkfehler
      }
    }

    return { success, failed, skipped };
  },
};

/**
 * ============================================================
 * CONNECTIVITY MONITOR
 * ============================================================
 */
export const connectivity = {
  /**
   * Prüft den aktuellen Online-Status
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  },

  /**
   * Registriert Event-Listener für Status-Änderungen
   */
  onStatusChange(callback: (online: boolean) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },
};
