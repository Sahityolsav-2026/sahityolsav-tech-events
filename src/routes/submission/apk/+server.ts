import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireTeam } from '$lib/server/auth';
import { serveApk } from '$lib/server/apk';
import { getDb } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals, platform }) => {
  const team = requireTeam(locals);
  if (!platform) error(500, 'The service is temporarily unavailable');
  const submission = await getDb(platform).prepare(
    'SELECT apk_object_key, apk_filename FROM submissions WHERE team_id=? AND application_type=?'
  ).bind(team.id, 'Mobile').first<{ apk_object_key: string | null; apk_filename: string | null }>();
  if (!submission?.apk_object_key || !submission.apk_filename) error(404, 'APK not found');
  return serveApk(platform.env.APKS, submission.apk_object_key, submission.apk_filename);
};
