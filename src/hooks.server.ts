import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { readSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.team = null;
  const db = getDb(event.platform);
  event.locals.user = await readSession(db, event.cookies);
  if (event.locals.user?.role === 'team') {
    event.locals.team = await db.prepare('SELECT id, name FROM teams WHERE user_id = ?')
      .bind(event.locals.user.id).first<{ id: number; name: string }>();
  }
  return resolve(event);
};
