import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

/** Pure-JS base64 → Uint8Array (no Buffer, no atob needed) */
function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = base64.replace(/=+$/, '');
  const len   = clean.length;
  const bytes = new Uint8Array(Math.floor(len * 3 / 4));
  let p = 0;

  for (let i = 0; i < len; i += 4) {
    const a = lookup[clean.charCodeAt(i)];
    const b = lookup[clean.charCodeAt(i + 1)];
    const c = lookup[clean.charCodeAt(i + 2)];
    const d = lookup[clean.charCodeAt(i + 3)];
    bytes[p++] = (a << 2) | (b >> 4);
    if (i + 2 < len) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < len) bytes[p++] = ((c & 3)  << 6) | (d & 63);
  }

  return bytes.slice(0, p);
}

/**
 * Upload a local image URI to a Supabase storage bucket.
 * Returns the public URL, or throws on failure.
 */
export async function uploadImageToSupabase(
  localUri: string,
  bucket: string,
  path: string,
): Promise<string> {
  const ext    = localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
  const mime   = `image/${ext}`;
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = base64ToBytes(base64);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mime, upsert: true });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
