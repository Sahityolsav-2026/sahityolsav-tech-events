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

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function partsInTimezone(date: Date, timezone: string): DateParts | null {
  try {
    const entries = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(entries.map((part) => [part.type, part.value]));
    return {
      year: Number(values.year),
      month: Number(values.month),
      day: Number(values.day),
      hour: Number(values.hour),
      minute: Number(values.minute)
    };
  } catch {
    return null;
  }
}

function sameParts(left: DateParts, right: DateParts): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute;
}

export function isoFromLocal(value: string, timezone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const target: DateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5])
  };
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
  const calendarCheck = new Date(targetUtc);
  if (
    calendarCheck.getUTCFullYear() !== target.year
    || calendarCheck.getUTCMonth() + 1 !== target.month
    || calendarCheck.getUTCDate() !== target.day
    || calendarCheck.getUTCHours() !== target.hour
    || calendarCheck.getUTCMinutes() !== target.minute
  ) return null;

  let instant = targetUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = partsInTimezone(new Date(instant), timezone);
    if (!observed) return null;
    const difference = targetUtc - Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute
    );
    if (difference === 0) break;
    instant += difference;
  }
  const result = new Date(instant);
  const observed = partsInTimezone(result, timezone);
  return observed && sameParts(observed, target) ? result.toISOString() : null;
}

export function localFromIso(value: string, timezone: string): string {
  const parts = partsInTimezone(new Date(value), timezone);
  if (!parts) return '';
  const pad = (entry: number) => String(entry).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}
