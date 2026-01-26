/**
 * ============================================================================
 * LEAN MEAN VPS - Todo Island
 * ============================================================================
 *
 * WAS:
 * Interaktive Aufgabenverwaltung (CRUD) für den angemeldeten Benutzer.
 *
 * WIE:
 * 1. Datenfluss: Nutzt Fetch-API mit CSRF-Protection für alle Mutationen.
 * 2. Real-time Feedback: Optimistische UI-Updates (Local State) kombinierte mit
 *    serverseitiger Validierung.
 * 3. Accessibility: Vollständig tastaturbedienbar inklusive ARIA-Labels für
 *    Screenreader-Kompatibilität.
 * 4. Kompakter Code: Verzicht auf schwere State-Libraries wie Redux zugunsten
 *    von nativem Hono 'useState' und 'useEffect'.
 *
 * WARUM:
 * Zeigt die nahtlose Integration von HonoX Islands mit einer SQLite-Backing-DB
 * über eine RESTful API, während die Ressourcenbelastung minimal bleibt.
 *
 * @version 1.1.0
 * ============================================================================
 */

import { useEffect, useState } from 'hono/jsx';
import { Badge, Button, Card, Input } from '../../../core/ui';
import { connectivity, mutationQueue } from '../../../core/lib/offline';
import { notify } from '../../../islands/ToastIsland';

interface Todo {
  id: number;
  content: string;
  completed: boolean;
  createdAt: string;
}

export default function TodoIsland() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Lädt die Todos initial vom Server.
   */
  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const result = await res.json();
        // Erwartet { success: true, data: Todo[] }
        setTodos(result.data || []);
      }
    } catch (_e) {
      if (!connectivity.isOnline()) {
        notify('Offline: Lade lokale Daten (falls vorhanden)', 'info');
      }
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  /**
   * Erstellt ein neues Todo. Sendet den CSRF-Token im Header mit.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Hono JSX type mismatch
  const addTodo = async (e: any) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const body = JSON.stringify({ content: newTodo });
    setLoading(true);

    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body,
      });

      if (res.ok) {
        setNewTodo('');
        fetchTodos();
      } else {
        throw new Error('Server error');
      }
    } catch (_e) {
      if (!connectivity.isOnline()) {
        mutationQueue.add({ url: '/api/todos', method: 'POST', body });
        notify('Änderung lokal gespeichert (Offline)', 'warning');

        // Optimistic Update: Temporär in die Liste aufnehmen
        const optimisticId = Date.now();
        setTodos((prev) => [
          ...prev,
          {
            id: optimisticId,
            content: newTodo,
            completed: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setNewTodo('');
      } else {
        notify('Fehler beim Hinzufügen des Todos.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Aktualisiert den Status eines Todos (Toggle Completed).
   * Nutzt den neuen optimierten /toggle Endpunkt.
   */
  const toggleTodo = async (id: number) => {
    const url = `/api/todos/${id}/toggle`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'X-CSRF-Token': getCsrfToken(),
        },
      });
      if (res.ok) {
        fetchTodos();
      } else {
        throw new Error('Server error');
      }
    } catch (_e) {
      if (!connectivity.isOnline()) {
        mutationQueue.add({ url, method: 'PATCH' });
        notify('Status-Änderung lokal gespeichert', 'warning');

        // Optimistic Update
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
      }
    }
  };

  /**
   * Hilfsfunktion zum Auslesen des CSRF-Tokens aus den Cookies.
   */
  const getCsrfToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrf_token=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text">Meine Aufgaben</h3>
        <Badge color="primary">{todos.length} Todos</Badge>
      </div>

      <form onSubmit={addTodo} className="flex gap-2 mb-6">
        <Input
          value={newTodo}
          // biome-ignore lint/suspicious/noExplicitAny: Hono JSX type mismatch
          onChange={(e: any) => setNewTodo(e.target.value)}
          placeholder="Was gibt es zu tun?"
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? '...' : 'Hinzufügen'}
        </Button>
      </form>

      <div className="space-y-3">
        {todos.length === 0 && (
          <p className="text-center text-text-muted py-8 italic">Keine Aufgaben vorhanden.</p>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
          >
            <button
              type="button"
              onClick={() => toggleTodo(todo.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                todo.completed
                  ? 'bg-primary border-primary text-white'
                  : 'border-white/20 hover:border-primary/50'
              }`}
              aria-label={todo.completed ? 'Als unerledigt markieren' : 'Als erledigt markieren'}
            >
              {todo.completed && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Erledigt</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <span className={`flex-1 text-text ${todo.completed ? 'line-through opacity-50' : ''}`}>
              {todo.content}
            </span>
            <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(todo.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
