/**
 * ============================================================================
 * LEAN MEAN VPS - Dashboard Route (SSG)
 * ============================================================================
 *
 * WAS:
 * Die primäre Dashboard-Seite für authentifizierte Benutzer.
 *
 * WIE:
 * 1. SSG-First: Das Grundlayout wird statisch generiert für sofortige Ladezeiten.
 * 2. Islands Integration:
 *    - 'DashboardIsland': Session-Management und User-Status.
 *    - 'TodoIsland': Task-Management via API-Interaktion.
 *    - 'UploadIsland': Dateiverwaltung (Multipart).
 * 3. Responsive Layout: Nutzt Tailwind 4 Grid-System für mobile & desktop Optimierung.
 *
 * WARUM:
 * Demonstriert die Skalierbarkeit des Templates: Komplexe App-Logic wird in
 * isolierte Islands gekapselt, während das Frame statisch bleibt, um RAM
 * auf dem VPS zu sparen.
 *
 * @version 2.1.0
 * ============================================================================
 */

import { createRoute } from 'honox/factory';
import DashboardIsland from '../islands/DashboardIsland';
import TodoIsland from '../islands/TodoIsland';
import UploadIsland from '../islands/UploadIsland';

export default createRoute(async (c) => {
  return c.render(
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Upper Navigation / Status Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gradient uppercase tracking-tight">
            System Core
          </h1>
          <p className="text-text-muted font-medium">Betriebsbereit. Alle Subsysteme nominal.</p>
        </div>

        <div className="flex items-center">
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <DashboardIsland $client:load />
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Module A: Task Management */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <h2 className="text-lg font-bold uppercase tracking-widest text-text-muted">
              Task Management
            </h2>
          </div>
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <TodoIsland $client:load />
        </section>

        {/* Module B: Security Storage */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <h2 className="text-lg font-bold uppercase tracking-widest text-text-muted">
              Encrypted Storage
            </h2>
          </div>
          {/* @ts-expect-error - HonoX Client-Side Directive */}
          <UploadIsland $client:load />
        </section>
      </div>
    </main>,
    // @ts-expect-error - HonoX Renderer Props
    { title: 'Dashboard | LEAN MEAN VPS' },
  );
});
