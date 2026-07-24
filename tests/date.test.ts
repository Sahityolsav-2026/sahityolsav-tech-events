import assert from 'node:assert/strict';
import test from 'node:test';
import { EVENT_TIMEZONE, formatIstDateTime } from '../src/lib/date.ts';

test('formats every visible event timestamp in IST', () => {
  assert.equal(EVENT_TIMEZONE, 'Asia/Kolkata');
  assert.match(formatIstDateTime('2026-07-24T00:00:00.000Z'), /24 Jul 2026, 5:30 am IST/i);
});
