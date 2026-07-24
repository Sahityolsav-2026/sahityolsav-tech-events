import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, hashPassword } from '$lib/server/auth';
import { before } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';
import { MIN_PASSWORD_LENGTH, normalizeEmail, required, text, validEmail } from '$lib/server/validation';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (locals.user) redirect(303, locals.user.role === 'admin' ? '/admin' : '/dashboard');
  const settings = await getSettings(getDb(platform));
  return { open: before(settings.registration_deadline), deadline: settings.registration_deadline, eventName: settings.event_name };
};

export const actions: Actions = {
  default: async ({ request, platform, cookies, url }) => {
    const db = getDb(platform);
    const settings = await getSettings(db);
    if (!before(settings.registration_deadline)) return fail(403, { message: 'Registration is closed.' });
    const form = await request.formData();
    const values = {
      teamName: text(form, 'teamName'), leaderName: text(form, 'leaderName'), members: text(form, 'members'),
      email: normalizeEmail(text(form, 'email'))
    };
    const password = text(form, 'password');
    const confirmPassword = text(form, 'confirmPassword');
    const missing = required({ 'Team name': values.teamName, 'Team leader name': values.leaderName, 'Team members': values.members, Email: values.email });
    if (missing) return fail(400, { message: missing, values });
    if (!validEmail(values.email)) return fail(400, { message: 'Enter a valid email address.', values });
    if (password.length < MIN_PASSWORD_LENGTH) return fail(400, { message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, values });
    if (password !== confirmPassword) return fail(400, { message: 'Passwords do not match.', values });
    const members = values.members.split(/\r?\n/).map((member) => member.trim()).filter(Boolean);
    if (!members.length) return fail(400, { message: 'Enter at least one team member.', values });
    const now = new Date().toISOString();
    const passwordData = await hashPassword(password);
    try {
      await db.batch([
        db.prepare('INSERT INTO users (email, password_hash, password_salt, role, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(values.email, passwordData.hash, passwordData.salt, 'team', now),
        db.prepare(`INSERT INTO teams (user_id, name, leader_name, members, created_at)
          SELECT id, ?, ?, ?, ? FROM users WHERE email = ?`)
          .bind(values.teamName, values.leaderName, JSON.stringify(members), now, values.email)
      ]);
    } catch (cause) {
      console.error(JSON.stringify({ event: 'registration_failed', cause: String(cause) }));
      return fail(409, { message: 'An account with that email already exists.', values });
    }
    const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(values.email).first<{ id: number }>();
    if (!user) return fail(500, { message: 'Registration could not be completed.', values });
    await createSession(db, cookies, user.id, url.protocol === 'https:' && url.hostname !== 'localhost');
    redirect(303, '/dashboard');
  }
};
