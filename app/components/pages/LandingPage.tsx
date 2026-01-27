import AuthIsland from '../../core/auth/island';
import type { Dictionary } from '../../core/i18n/types';

export const LandingPage = ({ dict }: { dict: Dictionary }) => {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-radial-[at_50%_0%] from-primary/10 to-transparent">
      {/* Language Detection & Persistence */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
        (function() {
          try {
            var path = window.location.pathname;
            // Detect and redirect only at root and if no preference stored
            if (path === '/' && !localStorage.getItem('lang')) {
              var lang = navigator.language || navigator.userLanguage;
              if (lang && lang.startsWith('en')) {
                window.location.href = '/en';
                return;
              }
            }

            // Store preference based on current URL
            if (path.startsWith('/en')) {
              localStorage.setItem('lang', 'en');
            } else if (path === '/' || path.startsWith('/de')) {
              localStorage.setItem('lang', 'de');
            }
          } catch (e) {}
        })();
      `,
        }}
      />

      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gradient animate-in zoom-in slide-in-from-top-12 duration-1000">
          {dict.landing.hero.title}
        </h1>
        <div className="flex items-center justify-center gap-3">
          <div className="h-[2px] w-12 bg-primary/30" />
          <p className="text-text-muted text-sm md:text-base font-black uppercase tracking-[0.3em] opacity-90">
            {dict.landing.hero.subtitle}
          </p>
          <div className="h-[2px] w-12 bg-primary/30" />
        </div>
      </div>

      {/* Auth Interface */}
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
        {/* @ts-expect-error - HonoX Client-Side Directive & Props not yet typed in Island */}
        <AuthIsland dict={dict.auth} $client:load />
      </div>

      {/* Footer / Info */}
      <footer className="mt-20 flex flex-col items-center gap-4 text-text-muted/40 text-[10px] uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-4">
          <span>{dict.landing.footer.ram}</span>
          <span>•</span>
          <span>{dict.landing.footer.auth}</span>
          <span>•</span>
          <span>{dict.landing.footer.ssg}</span>
        </div>
        <p>{dict.landing.footer.copyright}</p>
      </footer>
    </main>
  );
};
