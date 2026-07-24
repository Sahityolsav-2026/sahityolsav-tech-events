import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireTeam } from '$lib/server/auth';
import { before } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';
import { required, text } from '$lib/server/validation';

const fields = ['title', 'problem', 'solution'] as const;
type IdeaValues = Record<(typeof fields)[number], string>;

export const load: PageServerLoad = async ({ locals, platform }) => {
  const team = requireTeam(locals);
  const db = getDb(platform);
  const settings = await getSettings(db);
  const idea = await db.prepare('SELECT * FROM ideas WHERE team_id = ?').bind(team.id).first<IdeaValues & { created_at: string; updated_at: string }>();
  return { idea, locked: !before(settings.idea_deadline), deadline: settings.idea_deadline };
};

export const actions: Actions = {
  default: async ({ locals, platform, request }) => {
    const team = requireTeam(locals);
    const db = getDb(platform);
    const settings = await getSettings(db);
    if (!before(settings.idea_deadline)) return fail(403, { message: 'Idea declaration is locked because the deadline has passed.' });
    const form = await request.formData();
    const values = Object.fromEntries(fields.map((field) => [field, text(form, field)])) as IdeaValues;
    const missing = required({
      'Idea title': values.title,
      'Problem being explored': values.problem,
      'What you might build': values.solution
    });
    if (missing) return fail(400, { message: missing, values });
    const now = new Date().toISOString();
    await db.prepare(`INSERT INTO ideas (team_id, title, problem, target_users, importance, solution, user_journey, mvp_features, tech_stack, created_at, updated_at)
      VALUES (?, ?, ?, '', '', ?, '', '', '', ?, ?)
      ON CONFLICT(team_id) DO UPDATE SET title=excluded.title, problem=excluded.problem,
      solution=excluded.solution, updated_at=excluded.updated_at`)
      .bind(team.id, values.title, values.problem, values.solution, now, now).run();
    return { success: true };
  }
};
