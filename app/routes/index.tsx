/**
 * ============================================================================
 * LEAN MEAN VPS - Landing Page (SSG)
 * ============================================================================
 *
 * WAS:
 * Einstiegspunkt der Applikation und Authentifizierungs-Schnittstelle.
 *
 * WIE:
 * 1. SSG: Die Seite wird vollständig statisch generiert für maximale Lade-
 *    geschwindigkeit und minimale Serverlast.
 * 2. AuthIsland: Interaktive Komponente für Login/Registrierung, die erst
 *    auf dem Client hydriert wird.
 * 3. OKLCH Design: Verwendet modernste CSS-Farbraumdefinitionen für hohe
 *    Farbtreue bei gleichzeitig geringem Code-Gewicht.
 *
 * WARUM:
 * Eine statische Landing-Page reduziert die Angriffsfläche und spart wertvolle
 * RAM-Ressourcen auf dem VPS, da der Webserver lediglich Dateien ausliefern muss.
 *
 * @version 2.1.0
 * ============================================================================
 */

import { createRoute } from 'honox/factory';
import AuthIsland from '../core/auth/island';

export default createRoute((c) => {
  return c.render(
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-[at_50%_0%] from-primary/10 to-transparent">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gradient animate-in zoom-in slide-in-from-top-12 duration-1000">
          LEAN MEAN
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-[2px] w-12 bg-primary/30" />
          <p className="text-text-muted text-sm md:text-base font-black uppercase tracking-[0.3em] opacity-90">
            BUN • HONO • SQLITE
          </p>
          <div className="h-[2px] w-12 bg-primary/30" />
        </div>
      </div>

      {/* Auth Interface */}
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        {/* @ts-expect-error - HonoX Client-Side Directive */}
        <AuthIsland $client:load />
      </div>

      {/* Footer / Info */}
      <footer className="mt-20 flex flex-col items-center gap-4 text-text-muted/40 text-[10px] uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-4">
          <span>512MB RAM OPTIMIZED</span>
          <span>•</span>
          <span>ARGON2ID AUTH</span>
          <span>•</span>
          <span>SSG READY</span>
        </div>
        <p>© 2026 LEAN MEAN TEMPLATE</p>
      </footer>
    </main>,
    // @ts-expect-error - HonoX Renderer Props
    { title: 'Welcome | LEAN MEAN VPS' },
  );
});
