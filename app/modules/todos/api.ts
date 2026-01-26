/**
 * ============================================================================
 * LEAN MEAN VPS - Todos Resource API
 * ============================================================================
 *
 * WAS:
 * RESTful Endpunkte für die Verwaltung von Aufgaben (Todos).
 *
 * WIE:
 * 1. Zod-Validierung: Nutzt 'zValidator' für JSON-Bodys und URL-Parameter.
 * 2. Atomarität: 'toggle' nutzt SQL-Expressions statt Read-Modify-Write.
 * 3. Scope-Isolierung: Jede Query prüft die 'userId' direkt im WHERE-Clause.
 *
 * WARUM:
 * Atomare Updates verhindern Race-Conditions und reduzieren die Anzahl der
 * Datenbank-Roundtrips, was die Performance auf Low-End VPS verbessert.
 *
 * @version 2.3.0
 * ============================================================================
 */

import { zValidator } from '@hono/zod-validator';
import { and, eq, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../core/db';
import { todos } from './schema';
import { numericIdSchema, todoSchema } from '../../core/lib/validation';
import { authMiddleware, csrfMiddleware, type Env } from '../../core/auth/middleware';

const api = new Hono<Env>();

// Middleware: Erzwingt Auth für alle Todos
api.use('*', authMiddleware);

/**
 * Listet alle Todos des aktuellen Nutzers auf.
 * @route GET /api/todos
 */
api.get('/', async (c) => {
  const user = c.get('user');
  const items = await db.query.todos.findMany({
    where: eq(todos.userId, user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return c.json({ success: true, data: items });
});

/**
 * Erstellt ein neues Todo.
 * @route POST /api/todos
 */
api.post('/', csrfMiddleware, zValidator('json', todoSchema), async (c) => {
  const user = c.get('user');
  const { content } = c.req.valid('json');

  const [newItem] = await db
    .insert(todos)
    .values({
      userId: user.id,
      content,
    })
    .returning();

  return c.json({ success: true, data: newItem });
});

/**
 * Todo Status umschalten (Toggle).
 * Optimiert: Single atomic query statt Read-Modify-Write.
 * @route PATCH /api/todos/:id/toggle
 */
api.patch('/:id/toggle', csrfMiddleware, zValidator('param', numericIdSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  const [updated] = await db
    .update(todos)
    .set({
      // Atomarer Toggle via SQL Expression
      completed: sql`NOT ${todos.completed}`,
    })
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
    .returning();

  if (!updated) {
    return c.json({ success: false, error: 'Nicht gefunden oder keine Berechtigung' }, 404);
  }

  return c.json({ success: true, data: updated });
});

/**
 * Todo löschen.
 * @route DELETE /api/todos/:id
 */
api.delete('/:id', csrfMiddleware, zValidator('param', numericIdSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  const [deleted] = await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, user.id)))
    .returning();

  if (!deleted) return c.json({ success: false, error: 'Nicht gefunden' }, 404);

  return c.json({ success: true });
});

export default api;
