/**
 * ============================================================================
 * LEAN MEAN VPS - Development & Build Server (HonoX)
 * ============================================================================
 *
 * WAS:
 * Zentraler Einstiegspunkt für das HonoX-Framework während der Entwicklung
 * und des statischen Site-Generierungsprozesses (SSG).
 *
 * WIE:
 * 1. createApp(): Initialisiert die HonoX-Instanz, die Routen aus dem
 *    'routes/'-Verzeichnis automatisch einliest.
 * 2. Middleware-Chain:
 *    - CORS: Ermöglicht Cross-Origin Requests (wichtig für Dev-Tools).
 * 3. SSG-Engine: HonoX nutzt diese Datei als Basis, um zur Build-Zeit
 *    HTML-Dateien für jede Route zu generieren.
 *
 * WARUM:
 * Trennung von Build-Logistik (HonoX) und Performance-Runtime (api-server.ts),
 * um maximale Optimierung bei minimalem Ressourcenverbrauch zu erreichen.
 *
 * @version 2.1.0
 * ============================================================================
 */

import { cors } from 'hono/cors';
import { createApp } from 'honox/server';

/**
 * HonoX Instanz
 */
const app = createApp();

/**
 * Global Middlewares
 * ⚠️ DEV / BUILD ONLY - Dieses Middleware-Setup wird nur während der
 * Entwicklung (Vite) und des SSG-Prozesses genutzt.
 */
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
  }),
);

export default app;
