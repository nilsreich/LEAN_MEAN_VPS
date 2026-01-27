import type { MiddlewareHandler } from 'hono';
import { db } from '../../core/db';
import { analyticsVisits } from './schema';

const BUFFER_LIMIT = 50;
const FLUSH_INTERVAL_MS = 60_000;
type AnalyticsInsert = typeof analyticsVisits.$inferInsert;
const buffer: AnalyticsInsert[] = [];

/**
 * Persistiert gepufferte Analytics-Daten in die Datenbank.
 */
const flushBuffer = async () => {
  if (buffer.length === 0) return;

  const chunk = [...buffer];
  buffer.length = 0; // Clear buffer immediately

  try {
    await db.insert(analyticsVisits).values(chunk).run();
  } catch (err) {
    console.error('[Analytics] Batch insert failed:', err);
  }
};

// Regelmäßiger Flush um Datenverlust bei wenig Traffic zu minimieren
setInterval(() => {
  void flushBuffer();
}, FLUSH_INTERVAL_MS);

// Versuch, bei Shutdown noch zu speichern
// Hinweis: Das ist "Best Effort", da DB-Verbindungen evtl. schon geschlossen werden.
if (typeof process !== 'undefined') {
  const cleanup = () => {
    void flushBuffer();
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

export const analyticsMiddleware: MiddlewareHandler = async (c, next) => {
  // 1. Asynchronität: Erst die Request-Verarbeitung abwarten
  await next();

  const path = c.req.path;

  // 2. Filtering
  // Ignoriere Dateien (Punkte im Pfad, außer Root '/') und API-Routen
  // Anmerkung: Pfad '/' enthält keinen Punkt.
  if (path.startsWith('/api') || (path !== '/' && path.includes('.'))) {
    return;
  }

  try {
    // 3. Logic
    const headers = c.req.header();
    const userAgent = headers['user-agent'] || '';
    const referrerUrl = headers.referer;
    const ip = headers['x-forwarded-for']?.split(',')[0] || 'unknown';

    // Referrer: Nur Hostname
    let referrer = 'direct';
    if (referrerUrl) {
      try {
        referrer = new URL(referrerUrl).hostname;
      } catch {
        referrer = 'invalid';
      }
    }

    // Device Detection
    let device = 'D'; // Desktop default
    if (/bot|crawl|spider/i.test(userAgent)) {
      device = 'B';
    } else if (/mobi|android|iphone/i.test(userAgent)) {
      device = 'M';
    }

    // Language (Length 2)
    const language = (headers['accept-language'] || 'en').substring(0, 2);

    // Hash: IP + Date Salt (Daily Rotation)
    // Bun.hash returns a number (uint64)
    const salt = new Date().toDateString(); // "Fri Apr 10 2024" -> Daily Salt
    // ANONYMISIERUNG: Hash erzeugen, in Hex wandeln und auf 8 Zeichen kürzen
    const visitorHash = Bun.hash(ip + salt)
      .toString(16)
      .substring(0, 8);

    const record: AnalyticsInsert = {
      path,
      referrer,
      visitorHash,
      device,
      language,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // 4. Batching
    buffer.push(record);

    if (buffer.length >= BUFFER_LIMIT) {
      void flushBuffer();
    }
  } catch (err) {
    // Fail silent to not affect main application
    console.error('[Analytics] Middleware error:', err);
  }
};
