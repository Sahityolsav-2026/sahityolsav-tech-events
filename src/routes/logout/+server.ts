import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteSession } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

export const POST: RequestHandler = async ({ platform, cookies }) => {
  await deleteSession(getDb(platform), cookies);
  redirect(303, '/login');
};
