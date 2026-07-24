import { error } from '@sveltejs/kit';

export const MAX_APK_BYTES = 90 * 1024 * 1024;

export async function validateApk(file: File): Promise<string | null> {
  if (!file.name.toLowerCase().endsWith('.apk')) return 'Choose an APK file.';
  if (!file.size) return 'The APK file is empty.';
  if (file.size > MAX_APK_BYTES) return 'The APK must be 90 MB or smaller.';
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const zipSignature = signature[0] === 0x50 && signature[1] === 0x4b
    && signature[2] === 0x03 && signature[3] === 0x04;
  return zipSignature ? null : 'The selected file is not a valid APK.';
}

function downloadName(value: string): string {
  const cleaned = value.normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\/]/g, '_')
    .trim();
  return cleaned.toLowerCase().endsWith('.apk') ? cleaned : 'application.apk';
}

export async function serveApk(bucket: R2Bucket, key: string, filename: string): Promise<Response> {
  const object = await bucket.get(key);
  if (!object) error(404, 'APK not found');
  const headers = new Headers();
  headers.set('content-type', 'application/vnd.android.package-archive');
  headers.set('content-disposition', `attachment; filename="${downloadName(filename)}"`);
  headers.set('content-length', String(object.size));
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(object.body, { headers });
}
