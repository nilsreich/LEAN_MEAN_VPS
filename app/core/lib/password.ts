/**
 * ============================================================================
 * LEAN MEAN VPS - Passwort Security (Argon2id)
 * ============================================================================
 *
 * WAS:
 * Hilfsfunktionen zum Hashen und Verifizieren von Passwörtern.
 *
 * WIE:
 * Nutzt `Bun.password` (Argon2id) geschützt durch eine `p-limit` Queue.
 *
 * WARUM:
 * Argon2id mit 32MB Memory-Cost ist sicher, aber speicherintensiv.
 * Auf einem 512MB VPS würden 10-15 parallele Logins (15 * 32MB = 480MB)
 * zum OOM-Crash führen. Die Queue limitiert dies auf 2 gleichzeitige Prozesse.
 *
 * @version 2.1.0
 * ============================================================================
 */

import pLimit from 'p-limit';

// Globaler Limiter: Max 2 parallele Hashing-Operationen (64MB RAM Nutzung)
const limit = pLimit(2);

/**
 * Erstellt einen sicheren Hash.
 * Optimiert für einen 512MB RAM VPS:
 * Wir nutzen Argon2id mit 32MB Memory-Cost.
 */
export async function hashPassword(password: string): Promise<string> {
  return limit(() => Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 32768, // 32MB (Sicher & RAM-schonend für 512MB VPS)
    timeCost: 3, // 3 Iterationen
  }));
}

/**
 * Überprüft ein Passwort gegen einen Hash.
 * Ebenfalls limitiert, da verify genauso viel RAM braucht wie hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return limit(() => Bun.password.verify(password, hash));
}
