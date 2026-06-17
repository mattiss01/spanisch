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
    const { list } = await import('@vercel/blob');
    const blobKey = `users/${userId}/${file}`;
    const { blobs } = await list({ prefix: blobKey });
    const match = blobs.find(b => b.pathname === blobKey);
    if (!match) return fallback;
    try {
      const res = await fetch(match.downloadUrl, { cache: 'no-store' });
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
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
