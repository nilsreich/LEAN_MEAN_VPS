/**
 * ============================================================================
 * LEAN MEAN VPS - Document Renderer
 * ============================================================================
 *
 * WAS:
 * Zentraler HTML-Wrapper für alle Server-seitig gerenderten Seiten.
 *
 * WIE:
 * 1. JSX Renderer: Nutzt Honos 'jsxRenderer' zur Definition der HTML-Struktur.
 * 2. Tailwind 4: Bindet die kompilierte CSS-Datei ('/app/styles.css') ein.
 * 3. Polyfills & Meta: Konzipiert für modernes Webbrowsing (Viewport, Charset).
 * 4. Islands-Hydration: Injektiert das 'client.ts' Script zur Aktivierung
 *    interaktiver Komponenten auf dem Client.
 *
 * WARUM:
 * Ein einheitlicher Renderer garantiert Konsistenz im Design (Tailwind) und
 * ermöglicht effizientes SEO durch SSR/SSG, während Islands die Dynamik liefern.
 *
 * @version 2.1.0
 * ============================================================================
 */

import { jsxRenderer } from 'hono/jsx-renderer';
import { Script } from 'honox/server';
import ToastIsland from '../islands/ToastIsland';

export default jsxRenderer(({ children, ...props }) => {
  const title = (props as { title?: string }).title;
  return (
    <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'LEAN MEAN VPS'}</title>

        {/* TailwindCSS v4 Output */}
        <link rel="stylesheet" href="/app/styles.css" />

        {/* Favicon & PWA App Icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#10b981" />
      </head>
      <body className="antialiased selection:bg-primary/30 selection:text-primary">
        <main className="min-h-screen">{children}</main>

        {/* Global UI Islands */}
        <ToastIsland />

        {/* HonoX Hydration Script */}
        <Script src="/app/client.ts" />
      </body>
    </html>
  );
});
