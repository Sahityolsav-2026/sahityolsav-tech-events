import { error } from '@sveltejs/kit';

export type Role = 'team' | 'admin';

export interface EventSettings {
  id: number;
  event_name: string;
  timezone: string;
  registration_deadline: string;
  idea_deadline: string;
  development_deadline: string;
  submission_deadline: string;
  updated_at: string;
}

export interface AiSettings {
  id: number;
  endpoint: string;
  model: string;
  api_key: string;
  enabled: number;
  updated_at: string;
}

export function getDb(platform: App.Platform | undefined): D1Database {
  if (!platform?.env.DB) error(500, 'The service is temporarily unavailable');
  return platform.env.DB;
}

export async function getSettings(db: D1Database): Promise<EventSettings> {
  const settings = await db.prepare('SELECT * FROM event_settings WHERE id = 1').first<EventSettings>();
  if (!settings) error(500, 'Event settings are temporarily unavailable');
  return settings;
}

export async function getAiSettings(db: D1Database): Promise<AiSettings> {
  const settings = await db.prepare('SELECT * FROM ai_settings WHERE id = 1').first<AiSettings>();
  if (!settings) error(500, 'Review settings are temporarily unavailable');
  return settings;
}
