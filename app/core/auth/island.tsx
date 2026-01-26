/**
 * ============================================================================
 * LEAN MEAN VPS - Auth Island
 * ============================================================================
 *
 * WAS:
 * Client-seitiges Interface für Registrierung und Login.
 *
 * WIE:
 * 1. State-Management: Nutzt Hono 'useState' für lokale UI-Zustände (loading, error).
 * 2. API-Kommunikation: Abwicklung von POST-Requests gegen /api/auth Endpunkte.
 * 3. UX: Feedback-Loops durch Loading-Spinner-Integration in Button-Komponenten.
 * 4. Error-Handling: Granulare Fehlermeldungen direkt im UI (Inline-Errors).
 *
 * WARUM:
 * Ermöglicht eine nahtlose Authentifizierung ohne Full-Page-Reload, was die
 * gefühlte Performance auf schwachen Hosting-Systemen massiv verbessert.
 *
 * @version 1.1.0
 * ============================================================================
 */

import { useState } from 'hono/jsx';
import { Button, Card, Input } from '../ui';

export default function AuthIsland() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verarbeitet das Absenden des Formulars (Login oder Register).
   */
  // biome-ignore lint/suspicious/noExplicitAny: Hono JSX type mismatch
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Direktes Lesen aus FormData ohne Zwischenvariable für erhöhte Sicherheit
        body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
      });

      const result = await res.json();

      if (res.ok) {
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Fehler beim Authentifizieren');
      }
    } catch (_err) {
      setError('Netzwerkfehler. Bitte später erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-text">
          {isLogin ? 'Willkommen zurück' : 'Account erstellen'}
        </h2>
        <p className="text-text-muted mt-2">
          {isLogin ? 'Melde dich an, um fortzufahren.' : 'Starte jetzt mit deiner VPS-App.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-muted ml-1" htmlFor="username">
            Benutzername
          </label>
          <Input name="username" id="username" required placeholder="z.B. admin" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-text-muted ml-1" htmlFor="password">
            Passwort
          </label>
          <Input
            name="password"
            id="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm animate-shake">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <title>Laden...</title>
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isLogin ? (
            'Anmelden'
          ) : (
            'Registrieren'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setIsLogin(!isLogin)}
          className="text-primary hover:underline text-sm font-medium"
        >
          {isLogin ? 'Noch keinen Account? Registrieren' : 'Bereits einen Account? Login'}
        </button>
      </div>
    </Card>
  );
}
