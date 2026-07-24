export const MIN_PASSWORD_LENGTH = 10;

export function text(form: FormData, key: string): string {
  return String(form.get(key) ?? '').trim();
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function required(values: Record<string, string>): string | null {
  for (const [label, value] of Object.entries(values)) {
    if (!value) return `${label} is required.`;
    if (value.length > 10000) return `${label} is too long.`;
  }
  return null;
}

export function isoFromLocal(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function localFromIso(value: string): string {
  return new Date(value).toISOString().slice(0, 16);
}
