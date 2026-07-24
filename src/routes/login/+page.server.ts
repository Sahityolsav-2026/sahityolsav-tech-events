import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession, verifyPassword } from '$lib/server/auth';
import { getDb } from '$lib/server/db';
import { normalizeEmail, text } from '$lib/server/validation';

export const load: PageServerLoad = ({ locals }) => {
  if (locals.user) redirect(303, locals.user.role === 'admin' ? '/admin' : '/dashboard');
};

export const actions: Actions = {
  default: async ({ request, platform, cookies, url }) => {
    const form = await request.formData();
    const email = normalizeEmail(text(form, 'email'));
    const password = text(form, 'password');
    const db = getDb(platform);
    const user = await db.prepare('SELECT id, password_hash, password_salt, role FROM users WHERE email = ?')
      .bind(email).first<{ id: number; password_hash: string; password_salt: string; role: 'team' | 'admin' }>();
    if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
      return fail(400, { message: 'Invalid email or password.', email });
    }
    await createSession(db, cookies, user.id, url.protocol === 'https:' && url.hostname !== 'localhost');
    redirect(303, user.role === 'admin' ? '/admin' : '/dashboard');
  }
};
