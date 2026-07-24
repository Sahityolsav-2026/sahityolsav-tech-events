import type { EventSettings } from './db';

export type Phase = 'Registration' | 'Idea declaration' | 'Development' | 'Final submission' | 'Event closed';

export function eventPhase(settings: EventSettings, now = new Date()): { phase: Phase; deadline: string | null } {
  const time = now.getTime();
  if (time < Date.parse(settings.registration_deadline)) return { phase: 'Registration', deadline: settings.registration_deadline };
  if (time < Date.parse(settings.idea_deadline)) return { phase: 'Idea declaration', deadline: settings.idea_deadline };
  if (time < Date.parse(settings.development_deadline)) return { phase: 'Development', deadline: settings.development_deadline };
  if (time < Date.parse(settings.submission_deadline)) return { phase: 'Final submission', deadline: settings.submission_deadline };
  return { phase: 'Event closed', deadline: null };
}

export const before = (deadline: string, now = new Date()) => now.getTime() < Date.parse(deadline);
export const atOrAfter = (deadline: string, now = new Date()) => now.getTime() >= Date.parse(deadline);
