import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { authMiddleware } from '../../core/auth/middleware';
import { db } from '../../core/db';
import { analyticsVisits } from './schema';

const app = new Hono();

// Security: Alle Endpunkte schützen
app.use('*', authMiddleware);

app.get('/dashboard-stats', async (c) => {
  const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

  // Aggregation direkt in der DB für minimale Payload
  const [referrers, devices] = await Promise.all([
    // Top 5 Referrers
    db
      .select({
        name: analyticsVisits.referrer,
        value: sql<number>`count(*)`,
      })
      .from(analyticsVisits)
      .where(sql`${analyticsVisits.timestamp} > ${oneDayAgo}`)
      .groupBy(analyticsVisits.referrer)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    // Device Distribution
    db
      .select({
        name: analyticsVisits.device,
        value: sql<number>`count(*)`,
      })
      .from(analyticsVisits)
      .where(sql`${analyticsVisits.timestamp} > ${oneDayAgo}`)
      .groupBy(analyticsVisits.device),
  ]);

  return c.json({
    referrers,
    devices,
  });
});

export default app;
