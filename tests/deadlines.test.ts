import test from 'node:test';
import assert from 'node:assert/strict';
import { eventPhase } from '../src/lib/server/deadlines.ts';
import type { EventSettings } from '../src/lib/server/db.ts';

const settings: EventSettings = {
  id: 1,
  event_name: 'Test',
  timezone: 'Asia/Kolkata',
  registration_deadline: '2026-01-01T01:00:00.000Z',
  idea_deadline: '2026-01-01T02:00:00.000Z',
  development_deadline: '2026-01-01T03:00:00.000Z',
  submission_deadline: '2026-01-01T04:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z'
};

test('calculates every event phase and relevant countdown deadline', () => {
  const cases = [
    ['2026-01-01T00:30:00.000Z', 'Registration', settings.registration_deadline],
    ['2026-01-01T01:30:00.000Z', 'Idea declaration', settings.idea_deadline],
    ['2026-01-01T02:30:00.000Z', 'Development', settings.development_deadline],
    ['2026-01-01T03:30:00.000Z', 'Final submission', settings.submission_deadline],
    ['2026-01-01T04:00:00.000Z', 'Event closed', null]
  ] as const;
  for (const [now, phase, deadline] of cases) {
    assert.deepEqual(eventPhase(settings, new Date(now)), { phase, deadline });
  }
});
