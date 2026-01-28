import { unlink } from "node:fs/promises";
import { sql, eq, desc } from "drizzle-orm";
import { getDb } from "../app/core/db";
import { uploads } from "../app/modules/storage/schema";
import { users } from "../app/core/auth/schema";
import { createClient } from "@libsql/client";

const DB_FILENAME = "data/bench_uploads.db";
process.env.DB_FILENAME = DB_FILENAME;

const UPLOAD_COUNT = 10000;
const TEST_USER_ID = 999;

async function setupSchema() {
    const client = createClient({ url: `file:${DB_FILENAME}` });

    await client.execute(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `);

    await client.execute(`
        CREATE TABLE IF NOT EXISTS uploads (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    client.close();
}

async function prepare() {
    await setupSchema();
    const db = await getDb();

    // Clean up
    await db.delete(uploads);
    await db.delete(users);

    // Create User
    await db.insert(users).values({
        id: TEST_USER_ID,
        username: "benchuser",
        passwordHash: "dummy",
    });

    console.log(`Generating ${UPLOAD_COUNT} uploads...`);

    const values = [];
    const now = Date.now();

    for (let i = 0; i < UPLOAD_COUNT; i++) {
        values.push({
            id: crypto.randomUUID(),
            userId: TEST_USER_ID,
            filename: `file_${i}.txt`,
            size: 1024,
            mimeType: "text/plain",
            createdAt: new Date(now - i * 1000).toISOString(),
        });
    }

    // Batch insert
    const batchSize = 500;
    for (let i = 0; i < values.length; i += batchSize) {
        await db.insert(uploads).values(values.slice(i, i + batchSize));
    }

    console.log("Database prepared.");
}

async function benchmarkOld() {
    const db = await getDb();
    console.log("Running OLD (Fetch All)...");

    const start = performance.now();

    // Current implementation
    const items = await db.query.uploads.findMany({
        where: eq(uploads.userId, TEST_USER_ID),
        orderBy: (u, { desc }) => [desc(u.createdAt)],
    });

    const end = performance.now();
    console.log(`OLD fetch took: ${(end - start).toFixed(2)}ms. Items: ${items.length}`);
    return end - start;
}

async function benchmarkNew() {
    const db = await getDb();
    console.log("Running NEW (Pagination limit 20)...");

    const start = performance.now();

    // Optimized implementation (Limit + Count)
    // 1. Count
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(uploads)
        .where(eq(uploads.userId, TEST_USER_ID));

    // 2. Fetch Page
    const items = await db.query.uploads.findMany({
        where: eq(uploads.userId, TEST_USER_ID),
        orderBy: (u, { desc }) => [desc(u.createdAt)],
        limit: 20,
        offset: 0
    });

    const end = performance.now();
    console.log(`NEW fetch took: ${(end - start).toFixed(2)}ms. Items: ${items.length}, Total: ${count}`);
    return end - start;
}

async function run() {
    try {
        await prepare();

        const timeOld = await benchmarkOld();
        console.log('--------------------------------------------------');
        const timeNew = await benchmarkNew();

        const improvement = ((timeOld - timeNew) / timeOld) * 100;
        console.log(`--------------------------------------------------`);
        console.log(`Improvement: ${improvement.toFixed(2)}%`);
    } catch (e) {
        console.error(e);
    } finally {
        try {
            await unlink(DB_FILENAME);
            await unlink(`${DB_FILENAME}-wal`).catch(() => { });
            await unlink(`${DB_FILENAME}-shm`).catch(() => { });
        } catch (e) {
            // ignore
        }
    }
}

run();
