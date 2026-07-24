import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getAiSettings, getDb } from '$lib/server/db';
import { text } from '$lib/server/validation';

function validEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireAdmin(locals);
  const settings = await getAiSettings(getDb(platform));
  return {
    settings: {
      endpoint: settings.endpoint,
      model: settings.model,
      enabled: Boolean(settings.enabled),
      hasApiKey: Boolean(settings.api_key)
    }
  };
};

export const actions: Actions = {
  default: async ({ locals, platform, request }) => {
    requireAdmin(locals);
    const db = getDb(platform);
    const current = await getAiSettings(db);
    const form = await request.formData();
    const values = {
      endpoint: text(form, 'endpoint').replace(/\/+$/, ''),
      model: text(form, 'model'),
      enabled: form.get('enabled') === 'yes'
    };
    const newApiKey = text(form, 'api_key');
    const apiKey = newApiKey || current.api_key;

    if (values.endpoint && !validEndpoint(values.endpoint)) {
      return fail(400, { message: 'Enter a valid secure service URL.', values });
    }
    if (values.endpoint.length > 500 || values.model.length > 200 || newApiKey.length > 2000) {
      return fail(400, { message: 'Review settings could not be saved. Check the values and try again.', values });
    }
    if (values.enabled && (!values.endpoint || !values.model || !apiKey)) {
      return fail(400, { message: 'Service URL, model, and API key are required before enabling reviews.', values });
    }

    await db.prepare(`UPDATE ai_settings
      SET endpoint=?, model=?, api_key=?, enabled=?, updated_at=?
      WHERE id=1`)
      .bind(values.endpoint, values.model, apiKey, values.enabled ? 1 : 0, new Date().toISOString()).run();
    return { success: true };
  }
};
