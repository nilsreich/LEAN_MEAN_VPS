import { sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { analyticsVisits } from './schema';

export async function cleanupAnalytics() {
  // 7 Tage in Sekunden
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

  try {
    // Lösche alte Einträge
    await db.delete(analyticsVisits)
      .where(sql`${analyticsVisits.timestamp} < ${sevenDaysAgo}`)
      .run();

    console.log('[Analytics] Cleanup: Old records removed.');

    // PRAGMA optimize
    // Drizzle LibSQL erlaubt oft db.run(sql`...`)
    await db.run(sql`PRAGMA optimize;`);
    console.log('[Analytics] Cleanup: DB Optimized.');

  } catch (error) {
    console.error('[Analytics] Cleanup failed:', error);
  }
}
