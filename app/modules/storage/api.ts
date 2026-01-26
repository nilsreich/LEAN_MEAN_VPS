/**
 * ============================================================================
 * LEAN MEAN VPS - File Storage API
 * ============================================================================
 *
 * WAS:
 * Endpunkte für das Hochladen, Auflisten, Herunterladen und Löschen von Dateien.
 *
 * WIE:
 * 1. Zod-Validierung: Nutzt 'zValidator' für Form-Data und UUID-Parameter.
 * 2. Streaming: Dateien werden beim Download gestreamt (Memory-effizient).
 * 3. Sicherheit: Unlink zum echten Löschen, Rate-Limits für Uploads,
 *    Sanitized Filenames gegen Header-Injection.
 *
 * WARUM:
 * In einer 512MB RAM Umgebung ist RAM-Management (Streaming) kritisch.
 * Echter Dateisystem-Cleanup verhindert Speicherplatz-Lecks.
 *
 * @version 2.3.0
 * ============================================================================
 */

import { existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../../core/db';
import { uploads } from './schema';
import { uploadSchema, uuidParamSchema } from '../../core/lib/validation';
import { authMiddleware, csrfMiddleware, type Env } from '../../core/auth/middleware';
import { rateLimiter } from '../../core/middleware/rateLimit';

const api = new Hono<Env>();

// Auth Pflicht für alle Storage-Endpunkte
api.use('*', authMiddleware);

/**
 * Hilfsfunktion: Stellt sicher, dass das Upload-Verzeichnis existiert.
 */
const ensureUploadDir = () => {
  const dir = 'data/uploads';
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

/**
 * Upload einer Datei.
 * @route POST /api/storage/upload
 */
api.post(
  '/upload',
  rateLimiter({ maxRequests: 10, windowSizeSeconds: 60 }), // Schutz gegen DoS
  csrfMiddleware,
  zValidator('form', uploadSchema),
  async (c) => {
    const { file } = c.req.valid('form');
    const user = c.get('user');

    ensureUploadDir();
    const fileId = crypto.randomUUID();

    try {
      // Bun.write ist effizient für kleine/mittlere Files
      await Bun.write(`data/uploads/${fileId}`, await file.arrayBuffer());

      await db.insert(uploads).values({
        id: fileId,
        userId: user.id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });

      return c.json({ success: true, id: fileId });
    } catch (error) {
      console.error('[STORAGE] Upload failed:', error);
      return c.json({ success: false, error: 'Upload fehlgeschlagen' }, 500);
    }
  },
);

/**
 * Listet alle Uploads des aktuellen Nutzers auf.
 * @route GET /api/storage/list
 */
api.get('/list', async (c) => {
  const user = c.get('user');
  const items = await db.query.uploads.findMany({
    where: eq(uploads.userId, user.id),
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
  return c.json({ success: true, data: items });
});

/**
 * Download einer Datei via Streaming.
 * @route GET /api/storage/download/:id
 */
api.get('/download/:id', zValidator('param', uuidParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  const meta = await db.query.uploads.findFirst({
    where: and(eq(uploads.id, id), eq(uploads.userId, user.id)),
  });

  if (!meta) return c.json({ success: false, error: 'Nicht gefunden' }, 404);

  const file = Bun.file(`data/uploads/${id}`);
  if (!(await file.exists())) {
    return c.json({ success: false, error: 'Datei physikalisch nicht vorhanden' }, 404);
  }

  // Header-Injection Schutz: Filename sanitizen (Anführungszeichen entfernen/ersetzen)
  const safeFilename = meta.filename.replace(/[\\"]/g, '_');

  c.header('Content-Type', meta.mimeType);
  c.header('Content-Disposition', `attachment; filename="${safeFilename}"`);

  // Streaming statt arrayBuffer() prevntiert RAM-Overload auf 512MB VPS
  return c.body(file.stream());
});

/**
 * Löschen einer Datei (DB + Dateisystem).
 * @route DELETE /api/storage/:id
 */
api.delete('/:id', csrfMiddleware, zValidator('param', uuidParamSchema), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  // Transaktionell: Erst DB, dann FS
  const [deleted] = await db
    .delete(uploads)
    .where(and(eq(uploads.id, id), eq(uploads.userId, user.id)))
    .returning();

  if (!deleted) return c.json({ success: false, error: 'Nicht gefunden' }, 404);

  try {
    // Echter Unlink statt nur Überschreiben
    await unlink(`data/uploads/${id}`);
  } catch (error) {
    // Loggen, aber Request erfolgreich (DB ist sauber)
    console.warn(`[STORAGE] Cleanup failed for file ${id}:`, error);
  }

  return c.json({ success: true });
});

export default api;
