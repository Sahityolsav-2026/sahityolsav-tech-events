import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireTeam } from '$lib/server/auth';
import { atOrAfter, before } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';
import { GitHubApiError, verifyPublicRepository } from '$lib/server/github';
import { required, text, validUrl } from '$lib/server/validation';

const fields = ['project_name', 'description', 'repository_url', 'commit_sha', 'application_type', 'application_url', 'test_instructions', 'ai_tools', 'preexisting_assets', 'member_contributions', 'limitations'] as const;
type SubmissionValues = Record<(typeof fields)[number], string>;

export const load: PageServerLoad = async ({ locals, platform }) => {
  const team = requireTeam(locals);
  const db = getDb(platform);
  const settings = await getSettings(db);
  const now = new Date();
  const submission = await db.prepare('SELECT * FROM submissions WHERE team_id = ?').bind(team.id)
    .first<SubmissionValues & {
      submitted_at: string;
      updated_at: string;
      repository_full_name: string | null;
      repository_verified_at: string | null;
      fork_url: string | null;
      fork_status: string;
      fork_error: string | null;
    }>();
  return {
    submission,
    available: atOrAfter(settings.development_deadline, now),
    locked: !before(settings.submission_deadline, now),
    developmentDeadline: settings.development_deadline,
    deadline: settings.submission_deadline,
    onTime: submission ? Date.parse(submission.submitted_at) <= Date.parse(settings.submission_deadline) : null
  };
};

export const actions: Actions = {
  default: async ({ locals, platform, request }) => {
    const team = requireTeam(locals);
    const db = getDb(platform);
    const settings = await getSettings(db);
    const nowDate = new Date();
    if (!atOrAfter(settings.development_deadline, nowDate)) return fail(403, { message: 'Final submission is not open yet.' });
    if (!before(settings.submission_deadline, nowDate)) return fail(403, { message: 'Final submission is locked because the deadline has passed.' });
    const form = await request.formData();
    const values = Object.fromEntries(fields.map((field) => [field, text(form, field)])) as SubmissionValues;
    const missing = required(Object.fromEntries(fields.map((field) => [field.replaceAll('_', ' '), values[field]])));
    if (missing) return fail(400, { message: missing, values });
    if (!validUrl(values.repository_url)) return fail(400, { message: 'Enter a valid repository URL.', values });
    if (!validUrl(values.application_url)) return fail(400, { message: 'Enter a valid application or APK download URL.', values });
    if (!/^[0-9a-fA-F]{40}$/.test(values.commit_sha)) return fail(400, { message: 'Git commit SHA must be exactly 40 hexadecimal characters.', values });
    if (values.application_type !== 'Web' && values.application_type !== 'Mobile') return fail(400, { message: 'Choose Web or Mobile.', values });
    if (form.get('confirmed') !== 'yes') return fail(400, { message: 'You must confirm that the submitted information is accurate.', values });
    if (!platform) return fail(500, { message: 'Repository verification is temporarily unavailable. Please try again.', values });
    let verified;
    try {
      verified = await verifyPublicRepository(platform.env, values.repository_url, values.commit_sha);
    } catch (cause) {
      const message = cause instanceof GitHubApiError ? cause.message : 'GitHub verification failed. Please try again.';
      const status = cause instanceof GitHubApiError && cause.status < 500 ? 400 : 502;
      return fail(status, { message, values });
    }
    values.repository_url = verified.canonicalUrl;
    const now = nowDate.toISOString();
    await db.prepare(`INSERT INTO submissions (team_id, project_name, description, repository_url, commit_sha, application_type,
      application_url, test_instructions, ai_tools, preexisting_assets, member_contributions, limitations, confirmed, submitted_at, updated_at,
      repository_id, repository_full_name, repository_verified_at, fork_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'not_started')
      ON CONFLICT(team_id) DO UPDATE SET project_name=excluded.project_name, description=excluded.description,
      repository_url=excluded.repository_url, commit_sha=excluded.commit_sha, application_type=excluded.application_type,
      application_url=excluded.application_url, test_instructions=excluded.test_instructions, ai_tools=excluded.ai_tools,
      preexisting_assets=excluded.preexisting_assets, member_contributions=excluded.member_contributions,
      limitations=excluded.limitations, confirmed=1, updated_at=excluded.updated_at,
      repository_id=excluded.repository_id, repository_full_name=excluded.repository_full_name,
      repository_verified_at=excluded.repository_verified_at, fork_url=NULL, fork_status='not_started',
      forked_at=NULL, fork_error=NULL`)
      .bind(team.id, ...fields.map((field) => values[field]), now, now, verified.id, verified.fullName, now).run();
    return { success: true, verifiedRepository: verified.fullName };
  }
};
