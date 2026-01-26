/**
 * ============================================================================
 * LEAN MEAN VPS - Standalone Production API Server
 * ============================================================================
 *
 * WAS:
 * Der primäre Runtime-Prozess für die Auslieferung der Applikation unter Bun.
 *
 * WIE:
 * 1. API Mounting: Bindet spezialisierte API-Router ein.
 * 2. Static Delivery: Nutzt 'hono/bun' serveStatic für SSG-HTML und Assets.
 * 3. Path Isolation: Verhindert, dass API-Anfragen im statischen Fallback landen.
 *
 * WARUM:
 * Bun's native HTTP-Engine kombiniert mit Hono bietet maximale Performance
 * bei minimalem Overhead (Zero-Bloat Prinzip).
 *
 * @version 2.2.0
 * ============================================================================
 */

import { existsSync, mkdirSync } from 'node:fs';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

import auth from './core/auth/api';
import events from './modules/system/api';
import storage from './modules/storage/api';
import todos from './modules/todos/api';

// Sicherstellen, dass das Upload-Verzeichnis existiert
if (!existsSync('data/uploads')) {
  mkdirSync('data/uploads', { recursive: true });
}

const app = new Hono();

/**
 * API Routing
 * Evaluierung erfolgt VOR dem statischen Fallback.
 */
app.route('/api/auth', auth);
app.route('/api/todos', todos);
app.route('/api/events', events);
app.route('/api/storage', storage);

/**
 * Statische Assets & Service Worker
 */
app.use('/static/*', serveStatic({ root: './dist' }));
app.get('/manifest.webmanifest', serveStatic({ path: './dist/manifest.webmanifest' }));
app.get('/sw.js', serveStatic({ path: './dist/sw.js' }));

/**
 * SPA/SSG Fallback & Clean URLs
 */
const staticHandler = serveStatic({
  root: './dist',
  rewriteRequestPath: (path) => {
    if (path.includes('.')) return path;
    if (path === '/') return '/index.html';
    return `${path}.html`;
  },
});

app.get('*', async (c, next) => {
  // Verhindert, dass fehlende API-Endpunkte als statische Seiten (z.B. /api/foo.html) gesucht werden.
  if (c.req.path.startsWith('/api/')) {
    return c.json({ success: false, error: 'API route not found' }, 404);
  }
  return staticHandler(c, next);
});

export default {
  port: Number(process.env.PORT) || 3000,
  fetch: app.fetch,
  hostname: '0.0.0.0',
};
