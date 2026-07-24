import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireTeam } from '$lib/server/auth';
import { validateApk } from '$lib/server/apk';
import { before } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';
import { GitHubApiError, verifyPublicRepository } from '$lib/server/github';
import { required, text, validUrl } from '$lib/server/validation';

const fields = ['project_name', 'description', 'repository_url', 'application_type', 'application_url', 'test_instructions', 'ai_tools', 'preexisting_assets', 'member_contributions', 'limitations'] as const;
type SubmissionValues = Record<(typeof fields)[number], string>;

interface StoredApk {
  apk_object_key: string | null;
  apk_filename: string | null;
  apk_size: number | null;
  apk_uploaded_at: string | null;
}

export const load: PageServerLoad = async ({ locals, platform }) => {
  const team = requireTeam(locals);
  const db = getDb(platform);
  const settings = await getSettings(db);
  const now = new Date();
  const submission = await db.prepare(`SELECT project_name, description, repository_url, application_type, application_url,
      test_instructions, ai_tools, preexisting_assets, member_contributions, limitations,
      submitted_at, updated_at, repository_full_name, repository_verified_at,
      fork_url, fork_status, fork_error, apk_object_key, apk_filename, apk_size, apk_uploaded_at
      FROM submissions WHERE team_id = ?`).bind(team.id)
    .first<SubmissionValues & {
      submitted_at: string;
      updated_at: string;
      repository_full_name: string | null;
      repository_verified_at: string | null;
      fork_url: string | null;
      fork_status: string;
      fork_error: string | null;
      apk_object_key: string | null;
      apk_filename: string | null;
      apk_size: number | null;
      apk_uploaded_at: string | null;
    }>();
  return {
    submission,
    locked: !before(settings.submission_deadline, now),
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
    if (!before(settings.submission_deadline, nowDate)) return fail(403, { message: 'Final submission is locked because the deadline has passed.' });
    const form = await request.formData();
    const values = Object.fromEntries(fields.map((field) => [field, text(form, field)])) as SubmissionValues;
    const missing = required({
      'Project name': values.project_name,
      Description: values.description,
      'Repository URL': values.repository_url,
      'Application type': values.application_type,
      'Testing instructions': values.test_instructions,
      'AI tools': values.ai_tools,
      'Pre-existing assets': values.preexisting_assets,
      'Member contributions': values.member_contributions,
      Limitations: values.limitations
    });
    if (missing) return fail(400, { message: missing, values });
    if (!validUrl(values.repository_url)) return fail(400, { message: 'Enter a valid repository URL.', values });
    if (values.application_type !== 'Web' && values.application_type !== 'Mobile') return fail(400, { message: 'Choose Web or Mobile.', values });
    if (values.application_type === 'Web' && values.application_url && !validUrl(values.application_url)) {
      return fail(400, { message: 'Enter a valid live application URL.', values });
    }
    if (form.get('confirmed') !== 'yes') return fail(400, { message: 'You must confirm that the submitted information is accurate.', values });
    if (!platform) return fail(500, { message: 'Submission storage is temporarily unavailable. Please try again.', values });
    const existing = await db.prepare(
      'SELECT apk_object_key, apk_filename, apk_size, apk_uploaded_at FROM submissions WHERE team_id=?'
    ).bind(team.id).first<StoredApk>();
    const apkEntry = form.get('apk');
    const apk = apkEntry instanceof File && apkEntry.size ? apkEntry : null;
    if (values.application_type === 'Mobile' && apk) {
      const apkError = await validateApk(apk);
      if (apkError) return fail(400, { message: apkError, values });
    }
    let verified;
    try {
      verified = await verifyPublicRepository(platform.env, values.repository_url);
    } catch (cause) {
      const message = cause instanceof GitHubApiError ? cause.message : 'GitHub verification failed. Please try again.';
      const status = cause instanceof GitHubApiError && cause.status < 500 ? 400 : 502;
      return fail(status, { message, values });
    }
    values.repository_url = verified.canonicalUrl;
    if (values.application_type === 'Mobile') values.application_url = '';
    const now = nowDate.toISOString();
    let apkKey = values.application_type === 'Mobile' ? existing?.apk_object_key ?? null : null;
    let apkFilename = values.application_type === 'Mobile' ? existing?.apk_filename ?? null : null;
    let apkSize = values.application_type === 'Mobile' ? existing?.apk_size ?? null : null;
    let apkUploadedAt = values.application_type === 'Mobile' ? existing?.apk_uploaded_at ?? null : null;
    let newApkKey: string | null = null;
    if (values.application_type === 'Mobile' && apk) {
      newApkKey = `apks/${team.id}/${crypto.randomUUID()}.apk`;
      try {
        await platform.env.APKS.put(newApkKey, apk, {
          httpMetadata: {
            contentType: 'application/vnd.android.package-archive',
            contentDisposition: 'attachment'
          },
          customMetadata: {
            teamId: String(team.id),
            originalFilename: apk.name
          }
        });
      } catch (cause) {
        console.error(JSON.stringify({ event: 'apk_upload_failed', teamId: team.id, cause: String(cause) }));
        return fail(502, { message: 'The APK could not be uploaded. Please try again.', values });
      }
      apkKey = newApkKey;
      apkFilename = apk.name;
      apkSize = apk.size;
      apkUploadedAt = now;
    }
    try {
      await db.prepare(`INSERT INTO submissions (team_id, project_name, description, repository_url, commit_sha, application_type,
        application_url, test_instructions, ai_tools, preexisting_assets, member_contributions, limitations, confirmed, submitted_at, updated_at,
        repository_id, repository_full_name, repository_verified_at, fork_status, repository_branch,
        apk_object_key, apk_filename, apk_size, apk_uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'not_started', ?, ?, ?, ?, ?)
        ON CONFLICT(team_id) DO UPDATE SET project_name=excluded.project_name, description=excluded.description,
        repository_url=excluded.repository_url, commit_sha=excluded.commit_sha, application_type=excluded.application_type,
        application_url=excluded.application_url, test_instructions=excluded.test_instructions, ai_tools=excluded.ai_tools,
        preexisting_assets=excluded.preexisting_assets, member_contributions=excluded.member_contributions,
        limitations=excluded.limitations, confirmed=1, updated_at=excluded.updated_at,
        repository_id=excluded.repository_id, repository_full_name=excluded.repository_full_name,
        repository_verified_at=excluded.repository_verified_at, repository_branch=excluded.repository_branch,
        apk_object_key=excluded.apk_object_key, apk_filename=excluded.apk_filename,
        apk_size=excluded.apk_size, apk_uploaded_at=excluded.apk_uploaded_at,
        fork_url=NULL, fork_status='not_started', forked_at=NULL, fork_error=NULL`)
        .bind(
          team.id,
          values.project_name,
          values.description,
          values.repository_url,
          verified.commitSha,
          values.application_type,
          values.application_url,
          values.test_instructions,
          values.ai_tools,
          values.preexisting_assets,
          values.member_contributions,
          values.limitations,
          now,
          now,
          verified.id,
          verified.fullName,
          now,
          verified.defaultBranch,
          apkKey,
          apkFilename,
          apkSize,
          apkUploadedAt
        ).run();
    } catch (cause) {
      if (newApkKey) await platform.env.APKS.delete(newApkKey);
      console.error(JSON.stringify({ event: 'submission_save_failed', cause: String(cause) }));
      return fail(500, { message: 'The submission could not be saved. Please try again.', values });
    }
    if (existing?.apk_object_key && existing.apk_object_key !== apkKey) {
      try {
        await platform.env.APKS.delete(existing.apk_object_key);
      } catch (cause) {
        console.error(JSON.stringify({ event: 'old_apk_cleanup_failed', teamId: team.id, cause: String(cause) }));
      }
    }
    return { success: true };
  }
};
