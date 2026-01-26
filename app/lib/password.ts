/**
 * ============================================================================
 * LEAN MEAN VPS - Passwort Security (Argon2id)
 * ============================================================================
 *
 * WAS:
 * Hilfsfunktionen zum Hashen und Verifizieren von Passwörtern.
 *
 * WIE:
 * Nutzt `Bun.password`, welches intern Argon2id verwendet (der aktuelle Goldstandard).
 *
 * WARUM:
 * Passwörter dürfen niemals im Klartext gespeichert werden. Argon2id ist resistent
 * gegen GPU-Brute-Force Angriffe.
 *
 * @version 2.0.0
 * ============================================================================
 */

/**
 * Erstellt einen sicheren Hash.
 * Optimiert für einen 512MB RAM VPS:
 * Wir nutzen Argon2id mit 32MB Memory-Cost. Das ist sicher gegen GPUs,
 * verhindert aber OOM-Abstürze bei parallelen Logins.
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 32768, // 32MB (Sicher & RAM-schonend für 512MB VPS)
    timeCost: 3, // 3 Iterationen
  });
}

/**
 * Überprüft ein Passwort gegen einen Hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
