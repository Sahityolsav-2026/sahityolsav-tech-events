import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hashPassword, requireAdmin } from '$lib/server/auth';
import { runRepositoryReview } from '$lib/server/ai-review';
import { atOrAfter } from '$lib/server/deadlines';
import { getAiSettings, getDb, getSettings } from '$lib/server/db';
import { parseGitHubRepositoryUrl } from '$lib/server/github';
import { MIN_PASSWORD_LENGTH, text } from '$lib/server/validation';

interface TeamDetail {
  id: number;
  user_id: number;
  name: string;
  leader_name: string;
  members: string;
  created_at: string;
  email: string;
  role: string;
}

interface AiReviewRow {
  id: number;
  submission_id: number;
  status: 'running' | 'completed' | 'failed';
  report: string | null;
  files_inspected: string;
  endpoint: string;
  model: string;
  commit_sha: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
  repository_full_name: string;
  turns: number;
  files_bytes: number;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
}

export const load: PageServerLoad = async ({ locals, platform, params }) => {
  requireAdmin(locals);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) error(404, 'Team not found');
  const db = getDb(platform);
  const [team, idea, submission, eventSettings, aiSettings] = await Promise.all([
    db.prepare(`SELECT t.*, u.email, u.role FROM teams t JOIN users u ON u.id=t.user_id WHERE t.id=?`).bind(id).first<TeamDetail>(),
    db.prepare('SELECT * FROM ideas WHERE team_id=?').bind(id).first<Record<string, string | number>>(),
    db.prepare('SELECT * FROM submissions WHERE team_id=?').bind(id).first<Record<string, string | number | null>>(),
    getSettings(db),
    getAiSettings(db)
  ]);
  if (!team) error(404, 'Team not found');
  const review = submission
    ? await db.prepare('SELECT * FROM ai_reviews WHERE submission_id=?').bind(submission.id)
      .first<AiReviewRow>()
    : null;
  return {
    team: { ...team, members: JSON.parse(String(team.members)) as string[] },
    idea,
    submission,
    review: review ? {
      ...review,
      files_inspected: JSON.parse(String(review.files_inspected)) as string[]
    } : null,
    reviewAllowed: atOrAfter(eventSettings.submission_deadline),
    aiConfigured: Boolean(aiSettings.enabled && aiSettings.endpoint && aiSettings.model && aiSettings.api_key)
  };
};

export const actions: Actions = {
  password: async ({ locals, platform, params, request }) => {
    requireAdmin(locals);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) error(404, 'Team not found');
    const password = text(await request.formData(), 'password');
    if (password.length < MIN_PASSWORD_LENGTH) return fail(400, { passwordMessage: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    const db = getDb(platform);
    const team = await db.prepare('SELECT user_id FROM teams WHERE id=?').bind(id).first<{ user_id: number }>();
    if (!team) error(404, 'Team not found');
    const result = await hashPassword(password);
    await db.batch([
      db.prepare('UPDATE users SET password_hash=?, password_salt=? WHERE id=?').bind(result.hash, result.salt, team.user_id),
      db.prepare('DELETE FROM sessions WHERE user_id=?').bind(team.user_id)
    ]);
    return { passwordSuccess: true };
  },
  review: async ({ locals, platform, params }) => {
    requireAdmin(locals);
    const id = Number(params.id);
    if (!Number.isInteger(id) || id < 1) error(404, 'Team not found');
    if (!platform) return fail(500, { reviewMessage: 'Cloudflare platform bindings are unavailable.' });
    const db = getDb(platform);
    const [eventSettings, aiSettings, team, idea, submission] = await Promise.all([
      getSettings(db),
      getAiSettings(db),
      db.prepare('SELECT name, leader_name, members FROM teams WHERE id=?').bind(id)
        .first<{ name: string; leader_name: string; members: string }>(),
      db.prepare('SELECT * FROM ideas WHERE team_id=?').bind(id).first<Record<string, string | number>>(),
      db.prepare('SELECT * FROM submissions WHERE team_id=?').bind(id)
        .first<Record<string, string | number | null> & {
          id: number;
          repository_full_name: string | null;
          repository_verified_at: string | null;
          commit_sha: string;
          fork_status: string;
          fork_url: string | null;
        }>()
    ]);
    if (!team) error(404, 'Team not found');
    if (!atOrAfter(eventSettings.submission_deadline)) {
      return fail(403, { reviewMessage: 'AI reviews become available after the final submission deadline.' });
    }
    if (!aiSettings.enabled || !aiSettings.endpoint || !aiSettings.model || !aiSettings.api_key) {
      return fail(400, { reviewMessage: 'Configure and enable AI reviews first.' });
    }
    if (!submission) return fail(400, { reviewMessage: 'This team has no final submission.' });
    if (!submission.repository_full_name || !submission.repository_verified_at) {
      return fail(400, { reviewMessage: 'This submission does not have a verified public repository.' });
    }
    let reviewRepository = submission.repository_full_name;
    if (submission.fork_status === 'archived' && submission.fork_url) {
      const archived = parseGitHubRepositoryUrl(submission.fork_url);
      if (archived) reviewRepository = `${archived.owner}/${archived.name}`;
    }

    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    await db.prepare(`INSERT INTO ai_reviews
      (submission_id, status, report, files_inspected, endpoint, model, commit_sha, started_at, completed_at, error,
       repository_full_name, turns, files_bytes, input_tokens, output_tokens, duration_ms)
      VALUES (?, 'running', NULL, '[]', ?, ?, ?, ?, NULL, NULL, ?, 0, 0, 0, 0, 0)
      ON CONFLICT(submission_id) DO UPDATE SET status='running', report=NULL, files_inspected='[]',
      endpoint=excluded.endpoint, model=excluded.model, commit_sha=excluded.commit_sha,
      started_at=excluded.started_at, completed_at=NULL, error=NULL,
      repository_full_name=excluded.repository_full_name, turns=0, files_bytes=0,
      input_tokens=0, output_tokens=0, duration_ms=0`)
      .bind(submission.id, aiSettings.endpoint, aiSettings.model, submission.commit_sha, startedAt, reviewRepository).run();

    try {
      const result = await runRepositoryReview(platform.env, aiSettings, {
        team,
        idea: idea ?? null,
        submission: {
          ...submission,
          repository_full_name: reviewRepository
        }
      });
      const completedAt = new Date().toISOString();
      await db.prepare(`UPDATE ai_reviews SET status='completed', report=?, files_inspected=?,
        completed_at=?, error=NULL, turns=?, files_bytes=?, input_tokens=?, output_tokens=?,
        duration_ms=? WHERE submission_id=?`)
        .bind(
          result.report,
          JSON.stringify(result.filesInspected),
          completedAt,
          result.turns,
          result.filesBytes,
          result.inputTokens,
          result.outputTokens,
          result.durationMs,
          submission.id
        ).run();
      return { reviewSuccess: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message.slice(0, 1000) : 'The AI review failed.';
      await db.prepare(`UPDATE ai_reviews SET status='failed', completed_at=?, error=?,
        duration_ms=? WHERE submission_id=?`)
        .bind(new Date().toISOString(), message, Date.now() - startedAtMs, submission.id).run();
      return fail(502, { reviewMessage: message });
    }
  }
};
