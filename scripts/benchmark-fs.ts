import { existsSync, mkdirSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const TEST_DIR = 'data/bench_test';
const TEST_FILE = join(TEST_DIR, 'test.txt');
const ITERATIONS_HOT = 5000;
const ITERATIONS_COLD = 50;

const content = "x".repeat(1024); // 1KB

async function prepare() {
  if (existsSync(TEST_DIR)) {
    await rm(TEST_DIR, { recursive: true, force: true });
  }
  await mkdir(TEST_DIR, { recursive: true });
}

async function cleanup() {
    if (existsSync(TEST_DIR)) {
        await rm(TEST_DIR, { recursive: true, force: true });
    }
}

// Case 1: Hot Path (Dir exists) - Current Sync Check
async function benchHotSync() {
    await prepare();
    const start = performance.now();
    for (let i = 0; i < ITERATIONS_HOT; i++) {
        if (!existsSync(TEST_DIR)) {
            mkdirSync(TEST_DIR, { recursive: true });
        }
        await Bun.write(TEST_FILE, content);
    }
    const end = performance.now();
    return end - start;
}

// Case 2: Hot Path (Dir exists) - Native (No Check)
async function benchHotNative() {
    await prepare();
    const start = performance.now();
    for (let i = 0; i < ITERATIONS_HOT; i++) {
        // No check
        await Bun.write(TEST_FILE, content);
    }
    const end = performance.now();
    return end - start;
}

// Case 3: Cold Path (Dir missing) - Current Sync Check
async function benchColdSync() {
    await cleanup();
    const start = performance.now();
    for (let i = 0; i < ITERATIONS_COLD; i++) {
        if (!existsSync(TEST_DIR)) {
            mkdirSync(TEST_DIR, { recursive: true });
        }
        await Bun.write(TEST_FILE, content);
        await rm(TEST_DIR, { recursive: true, force: true }); // Reset
    }
    const end = performance.now();
    return end - start;
}

// Case 4: Cold Path (Dir missing) - Native
async function benchColdNative() {
    await cleanup();
    const start = performance.now();
    for (let i = 0; i < ITERATIONS_COLD; i++) {
        await Bun.write(TEST_FILE, content);
        await rm(TEST_DIR, { recursive: true, force: true }); // Reset
    }
    const end = performance.now();
    return end - start;
}

async function run() {
    console.log(`Running Benchmark: FS Operations`);
    console.log(`Hot Path (Dir exists): ${ITERATIONS_HOT} iterations`);
    console.log(`Cold Path (Dir missing): ${ITERATIONS_COLD} iterations`);
    console.log('--------------------------------------------------');

    const hotSync = await benchHotSync();
    console.log(`Hot Sync Check: ${hotSync.toFixed(2)}ms (${(ITERATIONS_HOT / hotSync * 1000).toFixed(0)} ops/s)`);

    const hotNative = await benchHotNative();
    console.log(`Hot Native    : ${hotNative.toFixed(2)}ms (${(ITERATIONS_HOT / hotNative * 1000).toFixed(0)} ops/s)`);

    const improvementHot = ((hotSync - hotNative) / hotSync) * 100;
    console.log(`>> Improvement: ${improvementHot.toFixed(2)}%`);

    console.log('--------------------------------------------------');

    const coldSync = await benchColdSync();
    console.log(`Cold Sync Check: ${coldSync.toFixed(2)}ms`);

    const coldNative = await benchColdNative();
    console.log(`Cold Native    : ${coldNative.toFixed(2)}ms`);

    await cleanup();
}

run();
