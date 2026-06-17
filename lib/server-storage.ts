import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Use Vercel Blob when either a classic read-write token is configured, or the
// project is connected to a Blob store via OIDC (BLOB_STORE_ID + the runtime
// VERCEL_OIDC_TOKEN). The @vercel/blob SDK resolves OIDC credentials itself.
function useBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function readJson<T>(file: string, fallback: T, userId = 'default'): Promise<T> {
  if (useBlob()) {
    // Private-store blobs can't be fetched anonymously — use the SDK's get(),
    // which authenticates with the same (OIDC) credentials as put().
    const { get } = await import('@vercel/blob');
    try {
      const res = await get(`users/${userId}/${file}`, { access: 'private' });
      if (res && res.statusCode === 200 && res.stream) {
        const text = await new Response(res.stream).text();
        return JSON.parse(text) as T;
      }
    } catch {
      // blob not found or read error → fall back
    }
    return fallback;
  }

  try {
    const filePath = path.join(DATA_DIR, userId, file);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: unknown, userId = 'default'): Promise<void> {
  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    await put(`users/${userId}/${file}`, JSON.stringify(data), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
    });
    return;
  }

  const dir = path.join(DATA_DIR, userId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), JSON.stringify(data, null, 2), 'utf-8');
}
