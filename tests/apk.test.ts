import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_APK_BYTES, validateApk } from '../src/lib/server/apk.ts';

test('accepts APK-shaped ZIP files and rejects invalid uploads', async () => {
  const apk = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x01])], 'project.apk', {
    type: 'application/vnd.android.package-archive'
  });
  assert.equal(await validateApk(apk), null);
  assert.equal(await validateApk(new File(['not an apk'], 'project.apk')), 'The selected file is not a valid APK.');
  assert.equal(await validateApk(new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04])], 'project.zip')), 'Choose an APK file.');
  assert.equal(MAX_APK_BYTES, 90 * 1024 * 1024);
});
