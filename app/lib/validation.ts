/**
 * ============================================================================
 * LEAN MEAN VPS - Typsichere Validierungsschicht (Zod)
 * ============================================================================
 *
 * WAS:
 * Zentrale Definition aller Datenstrukturen und Validierungsregeln.
 *
 * WIE:
 * Nutzt 'zod' zur Definition von Schemas für JSON, Form-Data und URL-Parameter.
 * Diese Schemas dienen als Single-Source-of-Truth für Laufzeitprüfung und Types.
 *
 * WARUM:
 * Vermeidet redundante Validierungslogik in den Controllern und garantiert,
 * dass nur bereinigte (sanitized) Daten die Business-Logik erreichen.
 *
 * @version 2.2.0
 * ============================================================================
 */

import { z } from 'zod';

/**
 * AUTHENTIFIZIERUNG
 */
export const loginSchema = z.object({
  username: z.string().min(3, 'Nutzername zu kurz').max(30).trim(),
  password: z.string().min(8, 'Passwort zu kurz').max(100),
});

export const registerSchema = loginSchema;

/**
 * AUFGABEN (TODOS)
 */
export const todoSchema = z.object({
  content: z.string().min(1, 'Inhalt darf nicht leer sein').max(500),
});

/**
 * DATEIVERWALTUNG (STORAGE)
 */
export const uploadSchema = z.object({
  file: z.instanceof(File).refine((f) => f.size <= 10 * 1024 * 1024, 'Datei zu groß (max 10MB)'),
});

/**
 * GEMEINSAME PARAMETER
 */
export const numericIdSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().positive()),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Ungültige Identifikationsnummer'),
});
