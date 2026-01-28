
import { unlink } from "node:fs/promises";
import { sql, lt } from "drizzle-orm";
import { getDb } from "../app/core/db";
import { sessions, type SessionData } from "../app/core/auth/schema";

const DB_FILENAME = "data/bench_sessions.db";
process.env.DB_FILENAME = DB_FILENAME;

const SESSION_COUNT = 10000;
const EXPIRED_COUNT = 1000;

async function prepare() {
  const db = await getDb();
  // Clear existing data instead of deleting file to preserve connection
  await db.delete(sessions);

  console.log(`Generating ${SESSION_COUNT} sessions (${EXPIRED_COUNT} expired)...`);

  const values = [];
  const now = Date.now();

  for (let i = 0; i < SESSION_COUNT; i++) {
    const isExpired = i < EXPIRED_COUNT;
    const expiresAt = isExpired
      ? new Date(now - 100000).toISOString()
      : new Date(now + 100000).toISOString();

    const sessionData: SessionData = {
      userId: i,
      csrfToken: "token" + i,
      expiresAt: expiresAt,
      createdAt: new Date().toISOString(),
      user: { id: i, username: "user" + i }
    };

    values.push({
      key: crypto.randomUUID(),
      value: sessionData,
      expiresAt: expiresAt
    });
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < values.length; i += batchSize) {
    await db.insert(sessions).values(values.slice(i, i + batchSize));
  }

  console.log("Database prepared.");
}

async function benchmarkOld() {
  await prepare();
  const db = await getDb();

  console.log("Running OLD cleanup (json_extract)...");
  const nowStr = new Date().toISOString();

  const start = performance.now();

  // This is the query from the existing middleware (Old version)
  await db.delete(sessions).where(sql`json_extract(${sessions.value}, '$.expiresAt') < ${nowStr}`);

  const end = performance.now();
  console.log(`OLD cleanup took: ${(end - start).toFixed(2)}ms`);

  // Verify deletion
  const remaining = await db.select({ count: sql`count(*)` }).from(sessions);
  // @ts-ignore
  console.log(`Remaining sessions: ${remaining[0].count} (Expected: ${SESSION_COUNT - EXPIRED_COUNT})`);
  return end - start;
}

async function benchmarkNew() {
    await prepare();
    const db = await getDb();

    console.log("Running NEW cleanup (indexed column)...");
    const nowStr = new Date().toISOString();

    const start = performance.now();

    try {
        await db.delete(sessions).where(lt(sessions.expiresAt, nowStr));

        const end = performance.now();
        console.log(`NEW cleanup took: ${(end - start).toFixed(2)}ms`);

         // Verify deletion
        const remaining = await db.select({ count: sql`count(*)` }).from(sessions);
        // @ts-ignore
        console.log(`Remaining sessions: ${remaining[0].count} (Expected: ${SESSION_COUNT - EXPIRED_COUNT})`);

        return end - start;
    } catch (e) {
        console.log("NEW cleanup failed:", e);
        return null;
    }
}

async function run() {
    const timeOld = await benchmarkOld();
    console.log('--------------------------------------------------');
    const timeNew = await benchmarkNew();

    if (timeNew !== null) {
        const improvement = ((timeOld - timeNew) / timeOld) * 100;
        console.log(`--------------------------------------------------`);
        console.log(`Improvement: ${improvement.toFixed(2)}%`);
    }
}

run();
