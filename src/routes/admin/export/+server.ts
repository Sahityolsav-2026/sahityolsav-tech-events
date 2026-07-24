import type { RequestHandler } from './$types';
import { formatIstDateTime } from '$lib/date';
import { requireAdmin } from '$lib/server/auth';
import { getDb } from '$lib/server/db';

function csv(value: unknown): string {
  const string = value == null ? '' : String(value);
  return `"${string.replaceAll('"', '""')}"`;
}

export const GET: RequestHandler = async ({ locals, platform, url }) => {
  requireAdmin(locals);
  const result = await getDb(platform).prepare(`SELECT t.id AS team_id, t.name, t.leader_name, u.email, t.members,
    i.title, i.problem, s.repository_url, s.commit_sha, s.application_type, s.application_url, s.apk_object_key,
    CASE WHEN s.id IS NULL THEN 'Not submitted' ELSE 'Submitted' END AS submission_status, s.submitted_at
    FROM teams t JOIN users u ON u.id=t.user_id LEFT JOIN ideas i ON i.team_id=t.id
    LEFT JOIN submissions s ON s.team_id=t.id ORDER BY t.name`).all<Record<string, unknown>>();
  const headers = ['Team name','Leader name','Email','Team members','Idea title','Problem','Repository URL','Commit SHA','Application or APK URL','Submission status','Submission time'];
  const keys = ['name','leader_name','email','members','title','problem','repository_url','commit_sha','delivery_url','submission_status','submitted_at'];
  const lines = [headers.map(csv).join(',')];
  for (const row of result.results) {
    const normalized: Record<string, unknown> = {
      ...row,
      members: JSON.parse(String(row.members ?? '[]')).join('; '),
      delivery_url: row.application_type === 'Mobile' && row.apk_object_key
        ? `${url.origin}/admin/teams/${row.team_id}/apk`
        : row.application_url,
      submitted_at: row.submitted_at ? formatIstDateTime(String(row.submitted_at)) : ''
    };
    lines.push(keys.map((key) => csv(normalized[key])).join(','));
  }
  return new Response(`${lines.join('\r\n')}\r\n`, { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="sahityolsav-teams.csv"', 'cache-control': 'no-store' } });
};
