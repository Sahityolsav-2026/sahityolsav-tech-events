import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { EVENT_TIMEZONE } from '$lib/date';
import { requireAdmin } from '$lib/server/auth';
import { getDb, getSettings } from '$lib/server/db';
import { isoFromLocal, localFromIso, required, text } from '$lib/server/validation';

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireAdmin(locals);
  const settings = await getSettings(getDb(platform));
  return {
    settings: {
      ...settings,
      timezone: EVENT_TIMEZONE,
      registration_deadline: localFromIso(settings.registration_deadline, EVENT_TIMEZONE),
      idea_deadline: localFromIso(settings.idea_deadline, EVENT_TIMEZONE),
      development_deadline: localFromIso(settings.development_deadline, EVENT_TIMEZONE),
      submission_deadline: localFromIso(settings.submission_deadline, EVENT_TIMEZONE)
    }
  };
};

export const actions: Actions = {
  default: async ({ locals, platform, request }) => {
    requireAdmin(locals);
    const form = await request.formData();
    const values = {
      event_name: text(form, 'event_name'), timezone: EVENT_TIMEZONE, registration_deadline: text(form, 'registration_deadline'),
      idea_deadline: text(form, 'idea_deadline'), development_deadline: text(form, 'development_deadline'),
      submission_deadline: text(form, 'submission_deadline')
    };
    const missing = required(values);
    if (missing) return fail(400, { message: missing, values });
    const dates = [
      values.registration_deadline,
      values.idea_deadline,
      values.development_deadline,
      values.submission_deadline
    ].map((value) => isoFromLocal(value, values.timezone));
    if (dates.some((date) => !date)) return fail(400, { message: 'All deadlines must be valid IST dates and times.', values });
    const times = dates.map((date) => Date.parse(date!));
    if (!(times[0] < times[1] && times[1] < times[2] && times[2] < times[3])) return fail(400, { message: 'Deadlines must be in chronological order.', values });
    await getDb(platform).prepare(`UPDATE event_settings SET event_name=?, timezone=?, registration_deadline=?, idea_deadline=?,
      development_deadline=?, submission_deadline=?, updated_at=? WHERE id=1`)
      .bind(values.event_name, values.timezone, ...dates, new Date().toISOString()).run();
    return { success: true };
  }
};
