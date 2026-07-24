import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { atOrAfter } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';
import { forkAndArchiveRepository } from '$lib/server/github';

type Summary = { total: number; with_idea: number; with_submission: number };
type TeamRow = {
  id: number;
  name: string;
  leader_name: string;
  email: string;
  idea_id: number | null;
  submission_id: number | null;
  submitted_at: string | null;
  fork_status: string | null;
  fork_url: string | null;
};

interface ArchiveRow {
  id: number;
  team_id: number;
  repository_full_name: string;
  commit_sha: string;
}

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  requireAdmin(locals);
  const db = getDb(platform);
  const filter = ['all', 'idea-missing', 'submission-missing', 'submitted'].includes(url.searchParams.get('filter') ?? '')
    ? (url.searchParams.get('filter') as string) : 'all';
  const where = filter === 'idea-missing' ? 'WHERE i.id IS NULL'
    : filter === 'submission-missing' ? 'WHERE s.id IS NULL'
    : filter === 'submitted' ? 'WHERE s.id IS NOT NULL' : '';
  const [settings, summary, teams] = await Promise.all([
    getSettings(db),
    db.prepare(`SELECT COUNT(*) AS total, COUNT(i.id) AS with_idea, COUNT(s.id) AS with_submission
      FROM teams t LEFT JOIN ideas i ON i.team_id=t.id LEFT JOIN submissions s ON s.team_id=t.id`).first<Summary>(),
    db.prepare(`SELECT t.id, t.name, t.leader_name, u.email, i.id AS idea_id, s.id AS submission_id, s.submitted_at,
      s.fork_status, s.fork_url
      FROM teams t JOIN users u ON u.id=t.user_id LEFT JOIN ideas i ON i.team_id=t.id
      LEFT JOIN submissions s ON s.team_id=t.id ${where} ORDER BY t.name`).all<TeamRow>()
  ]);
  const counts = summary ?? { total: 0, with_idea: 0, with_submission: 0 };
  return {
    settings,
    filter,
    teams: teams.results,
    archiveAllowed: atOrAfter(settings.submission_deadline),
    counts: { ...counts, without_idea: counts.total - counts.with_idea, without_submission: counts.total - counts.with_submission }
  };
};

export const actions: Actions = {
  archive: async ({ locals, platform }) => {
    requireAdmin(locals);
    const db = getDb(platform);
    const settings = await getSettings(db);
    if (!atOrAfter(settings.submission_deadline)) {
      return fail(403, { archiveMessage: 'Repositories can only be archived after the final submission deadline.' });
    }
    if (!platform) return fail(500, { archiveMessage: 'Cloudflare platform bindings are unavailable.' });

    const candidates = await db.prepare(`SELECT id, team_id, repository_full_name, commit_sha
      FROM submissions
      WHERE repository_verified_at IS NOT NULL
        AND repository_full_name IS NOT NULL
        AND fork_status != 'archived'
      ORDER BY submitted_at
      LIMIT 8`).all<ArchiveRow>();

    let archived = 0;
    let pending = 0;
    let failed = 0;
    for (const submission of candidates.results) {
      try {
        const result = await forkAndArchiveRepository(
          platform.env,
          submission.team_id,
          submission.repository_full_name,
          submission.commit_sha
        );
        await db.prepare(`UPDATE submissions SET fork_url=?, fork_status=?, forked_at=?,
          fork_error=NULL WHERE id=?`)
          .bind(result.url, result.status, result.forkedAt, submission.id).run();
        if (result.status === 'archived') archived++;
        else pending++;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message.slice(0, 500) : 'Unknown GitHub error';
        await db.prepare(`UPDATE submissions SET fork_status='failed', fork_error=? WHERE id=?`)
          .bind(message, submission.id).run();
        failed++;
      }
    }

    if (!candidates.results.length) {
      return { archiveMessage: 'No verified repositories need archiving.' };
    }
    return {
      archiveMessage: `Processed ${candidates.results.length}: ${archived} archived, ${pending} pending, ${failed} failed. Run again after a few seconds to finish pending forks.`
    };
  }
};
