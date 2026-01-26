/**
 * ============================================================================
 * LEAN MEAN VPS - Rate Limiting (In-Memory)
 * ============================================================================
 *
 * WAS:
 * Schützt Endpunkte vor Brute-Force und DDoS-Angriffen.
 *
 * WIE:
 * Nutzt einen In-Memory Sliding Window Counter. Einträge werden alle 60 Sek.
 * bereinigt, um den RAM-Verbrauch minimal zu halten.
 *
 * WARUM:
 * In-Memory ist extrem schnell und verursacht keine Datenbank-Last (LEAN).
 *
 * @version 2.0.0
 * ============================================================================
 */

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

interface RateLimitEntry {
  count: number;
  expires: number;
}
const store = new Map<string, RateLimitEntry>();

// Cleanup Intervall
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expires < now) store.delete(key);
  }
}, 60000);

export const rateLimiter = (options: { maxRequests: number; windowSizeSeconds: number }) => {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || 'unknown';
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();
    const entry = store.get(key);

    if (entry) {
      if (entry.expires < now) {
        store.set(key, { count: 1, expires: now + options.windowSizeSeconds * 1000 });
      } else {
        entry.count++;
        if (entry.count > options.maxRequests) {
          throw new HTTPException(429, { message: 'Zu viele Anfragen. Bitte warten.' });
        }
      }
    } else {
      store.set(key, { count: 1, expires: now + options.windowSizeSeconds * 1000 });
    }

    await next();
  });
};
