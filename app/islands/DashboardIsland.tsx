/**
 * ============================================================================
 * LEAN MEAN VPS - Dashboard Control Island
 * ============================================================================
 *
 * WAS:
 * Client-seitige Komponente zur Verwaltung der Benutzersitzung und des
 * globalen Dashboard-Status.
 *
 * WIE:
 * 1. Session-Check: Ruft beim Load '/api/auth/me' auf, um die Authentizität
 *    des Nutzers zu verifizieren.
 * 2. Client-Side Navigation: Leitet bei ungültiger Session sofort auf '/' um.
 * 3. Logout-Trigger: Sendet einen POST-Request an den Logout-Endpunkt und
 *    löscht die Client-seitigen Session-Cookies.
 * 4. Conditional Rendering: Verhindert Layout-Shifts durch initiales Null-Rendering.
 *
 * WARUM:
 * Da das Dashboard statisch generiert ist (SSG), benötigen wir diese Island,
 * um dynamische Nutzerinformationen anzuzeigen und die Session-Sicherheit
 * zur Laufzeit zu garantieren.
 *
 * @version 2.1.0
 * ============================================================================
 */

import { useEffect, useState } from 'hono/jsx';
import type { Dictionary } from '../core/i18n/types';
import { Button } from '../core/ui';

export default function DashboardIsland({ dict }: { dict: Dictionary['dashboard']['user'] }) {
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    // Initialer Check der Identität
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
        } else {
          window.location.href = '/';
        }
      })
      .catch(() => {
        window.location.href = '/';
      });
  }, []);

  /**
   * Führt den Logout-Prozess durch.
   */
  const handleLogout = async () => {
    try {
      const getCsrfToken = () => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; csrf_token=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
        return '';
      };

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      });
      if (res.ok) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback: Einfach umleiten
      window.location.href = '/';
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="hidden md:block text-right">
        <p className="text-sm font-bold text-text-primary capitalize">{user.username}</p>
        <p className="text-[10px] text-primary font-black uppercase tracking-tighter opacity-80">
          {dict.role}
        </p>
      </div>

      <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />

      <Button
        onClick={handleLogout}
        variant="outline"
        className="text-xs py-1.5 px-4 font-bold uppercase tracking-widest border-white/20 hover:border-primary/50 transition-all duration-300"
      >
        {dict.logout}
      </Button>
    </div>
  );
}
