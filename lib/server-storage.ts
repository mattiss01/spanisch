import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Use Vercel Blob when either a classic read-write token is configured, or the
// project is connected to a Blob store via OIDC (BLOB_STORE_ID + the runtime
// VERCEL_OIDC_TOKEN). The @vercel/blob SDK resolves OIDC credentials itself.
function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

function isNotFound(e: unknown): boolean {
  const name = (e as { name?: string })?.name ?? '';
  const code = (e as { code?: string })?.code ?? '';
  const msg = e instanceof Error ? e.message : String(e);
  return code === 'ENOENT' || /not.?found/i.test(name) || /not.?found/i.test(msg);
}

export async function readJson<T>(file: string, fallback: T, userId = 'default'): Promise<T> {
  if (useBlob()) {
    // Read via the SDK's get(), which constructs the URL from the store id and
    // handles credentials. Works for both public and private stores.
    const { get } = await import('@vercel/blob');
    try {
      const res = await get(`users/${userId}/${file}`, { access: 'public' });
      if (res && res.statusCode === 200 && res.stream) {
        const text = await new Response(res.stream).text();
        return JSON.parse(text) as T;
      }
      // null / 304 → blob genuinely doesn't exist yet
      return fallback;
    } catch (e) {
      // CRITICAL: only an actual "not found" may be treated as empty. Any other
      // read error must propagate — returning `fallback` here would let a caller
      // overwrite the whole file with empty data and wipe real progress.
      if (isNotFound(e)) return fallback;
      throw e;
    }
  }

  try {
    const filePath = path.join(DATA_DIR, userId, file);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (e) {
    if (isNotFound(e)) return fallback;
    throw e;
  }
}

export async function writeJson(file: string, data: unknown, userId = 'default'): Promise<void> {
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(`users/${userId}/${file}`, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0, // don't let the CDN serve a stale copy on the next read
    });
    return;
  }

  const dir = path.join(DATA_DIR, userId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), JSON.stringify(data, null, 2), 'utf-8');
}
