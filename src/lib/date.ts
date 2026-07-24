export const EVENT_TIMEZONE = 'Asia/Kolkata';

const istFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: EVENT_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

export function formatIstDateTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return `${istFormatter.format(date)} IST`;
}
