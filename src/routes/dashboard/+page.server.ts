import type { PageServerLoad } from './$types';
import { requireTeam } from '$lib/server/auth';
import { before, eventPhase } from '$lib/server/deadlines';
import { getDb, getSettings } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals, platform }) => {
  const team = requireTeam(locals);
  const db = getDb(platform);
  const settings = await getSettings(db);
  const now = new Date();
  const [details, idea, submission] = await Promise.all([
    db.prepare('SELECT name, leader_name, members, created_at FROM teams WHERE id = ?').bind(team.id)
      .first<{ name: string; leader_name: string; members: string; created_at: string }>(),
    db.prepare('SELECT title, problem, updated_at FROM ideas WHERE team_id = ?').bind(team.id)
      .first<{ title: string; problem: string; updated_at: string }>(),
    db.prepare('SELECT project_name, submitted_at, updated_at FROM submissions WHERE team_id = ?').bind(team.id)
      .first<{ project_name: string; submitted_at: string; updated_at: string }>()
  ]);
  const phase = eventPhase(settings, now);
  return {
    eventName: settings.event_name,
    deadlines: {
      registration: settings.registration_deadline,
      idea: settings.idea_deadline,
      development: settings.development_deadline,
      submission: settings.submission_deadline
    },
    team: { ...details, members: JSON.parse(details?.members ?? '[]') as string[] },
    phase,
    serverTime: now.toISOString(),
    idea,
    ideaStatus: !idea ? 'Not submitted' : before(settings.idea_deadline, now) ? 'Submitted' : 'Locked',
    submission,
    submissionStatus: submission ? (before(settings.submission_deadline, now) ? 'Submitted' : 'Locked') : 'Not submitted',
    submissionAvailable: now.getTime() >= Date.parse(settings.development_deadline),
    submissionLocked: !before(settings.submission_deadline, now)
  };
};
