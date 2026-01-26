/**
 * ============================================================================
 * LEAN MEAN VPS - System Events API (SSE)
 * ============================================================================
 *
 * WAS:
 * Real-time Stream für System-Metriken und Benachrichtigungen.
 *
 * WIE:
 * 1. Server-Sent Events (SSE): Hono's 'streamSSE' API für eine persistente
 *    Einweg-Verbindung zum Client.
 * 2. System-Stats: Periodisches Auslesen von Speicher- und CPU-Informationen
 *    via Bun-nativen Funktionen (Bun.nanoseconds, etc.).
 *
 * WARUM:
 * SSE ist ressourcenschonender als WebSockets für reine Monitoring-Zwecke
 * und passt perfekt in das LEAN-Konzept für 512MB VPS.
 *
 * @version 1.0.0
 * ============================================================================
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { authMiddleware, type Env } from '../../middleware/auth';

const api = new Hono<Env>();

// Auth Pflicht für Monitoring-Events
api.use('*', authMiddleware);

/**
 * System Status Stream via SSE.
 * @route GET /api/events/stats
 */
api.get('/stats', async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const stats = {
        time: new Date().toLocaleTimeString(),
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.round(process.uptime())}s`,
      };

      await stream.writeSSE({
        data: JSON.stringify(stats),
        event: 'system-stats',
        id: String(Date.now()),
      });

      // Intervall: 5 Sekunden (LEAN: Nicht zu oft pollen)
      await stream.sleep(5000);
    }
  });
});

export default api;
