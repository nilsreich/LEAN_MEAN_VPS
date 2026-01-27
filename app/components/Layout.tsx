import type { FC, PropsWithChildren } from 'hono/jsx';

/**
 * Globales Layout für SSR-Seiten.
 * Trennt strukturelles Markup von Feature-Logik.
 */
export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      <header className="fixed top-0 w-full border-b border-white/10 bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold tracking-tighter text-xl">
            LEAN <span className="text-emerald-500">MEAN</span> VPS
          </div>
          <nav className="flex gap-4 text-sm font-medium text-zinc-400">
            <a href="/" className="hover:text-white transition-colors">
              Home
            </a>
            <a href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </a>
          </nav>
        </div>
      </header>

      <main className="pt-24 pb-12 max-w-7xl mx-auto px-6">
        {title && <h1 className="text-3xl font-black tracking-tight mb-8">{title}</h1>}
        {children}
      </main>
    </div>
  );
};
