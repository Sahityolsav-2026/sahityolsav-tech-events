import assert from 'node:assert/strict';
import test from 'node:test';
import { isoFromLocal, localFromIso } from '../src/lib/server/validation.ts';

test('converts Asia/Kolkata datetime-local values to and from UTC', () => {
  assert.equal(isoFromLocal('2026-07-25T09:00', 'Asia/Kolkata'), '2026-07-25T03:30:00.000Z');
  assert.equal(localFromIso('2026-07-25T03:30:00.000Z', 'Asia/Kolkata'), '2026-07-25T09:00');
});

test('honors daylight-saving offsets and rejects invalid local times', () => {
  assert.equal(isoFromLocal('2026-07-25T09:00', 'America/New_York'), '2026-07-25T13:00:00.000Z');
  assert.equal(isoFromLocal('2026-03-08T02:30', 'America/New_York'), null);
});

test('rejects invalid dates and timezones', () => {
  assert.equal(isoFromLocal('2026-02-30T09:00', 'Asia/Kolkata'), null);
  assert.equal(isoFromLocal('2026-07-25T09:00', 'Not/A_Timezone'), null);
});
