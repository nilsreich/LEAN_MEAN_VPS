import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants } from 'node:zlib';

const brotli = promisify(brotliCompress);

const DIST_DIR = 'dist';
const ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.xml',
  '.svg',
  '.txt',
  '.wasm',
  '.map',
  '.webmanifest'
]);

async function walk(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function compressFile(filePath: string) {
  const ext = extname(filePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return;

  // Skip if it's already a compressed file (though logic above handles extensions)
  if (filePath.endsWith('.br')) return;

  try {
    const content = await readFile(filePath);
    // Skip empty files
    if (content.length === 0) return;

    const compressed = await brotli(content, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      },
    });

    await writeFile(`${filePath}.br`, compressed);
    // console.log(`Compressed: ${filePath} -> ${filePath}.br`);
    return {
      original: content.length,
      compressed: compressed.length,
    };
  } catch (error) {
    console.error(`Error compressing ${filePath}:`, error);
  }
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`Directory ${DIST_DIR} not found. Run build first.`);
    process.exit(1);
  }

  console.log('Starting Brotli compression...');
  const start = performance.now();
  const files = await walk(DIST_DIR);

  let processed = 0;
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  const results = await Promise.all(files.map(async (file) => {
    const result = await compressFile(file);
    if (result) {
      processed++;
      return result;
    }
    return null;
  }));

  for (const result of results) {
    if (result) {
      totalOriginalSize += result.original;
      totalCompressedSize += result.compressed;
    }
  }

  const end = performance.now();
  const duration = (end - start).toFixed(2);
  const savings = totalOriginalSize > 0
    ? ((1 - totalCompressedSize / totalOriginalSize) * 100).toFixed(2)
    : '0';

  console.log('Compression complete!');
  console.log(`Files processed: ${processed}`);
  console.log(`Time taken: ${duration}ms`);
  console.log(`Total size: ${(totalOriginalSize / 1024).toFixed(2)} KB -> ${(totalCompressedSize / 1024).toFixed(2)} KB`);
  console.log(`Savings: ${savings}%`);
}

main().catch(console.error);
