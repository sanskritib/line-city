// Turns "7:00 AM - 6:00 PM" style hours into open/closed status in Seattle time.
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

type Range = [number, number]; // minutes from midnight; close may pass 1440 for overnight

function toMin(t: string): number {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return NaN;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
}

export function parseDay(s: string): Range[] {
  if (/closed/i.test(s)) return [];
  if (/24 hours/i.test(s)) return [[0, 1440]];
  return s.split(',').map((part) => {
    const [a, b] = part.split(/\s*[-\u2013]\s*/);
    const o = toMin(a);
    let c = toMin(b);
    if (c <= o) c += 1440;
    return [o, c] as Range;
  }).filter((r) => !isNaN(r[0]) && !isNaN(r[1]));
}

export function seattleNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return { day: SHORT[get('weekday')], min: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
}

function fmt(min: number) {
  min = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), mm = min % 60;
  const ap = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 ? `${h12} ${ap}` : `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}

export interface Status { open: boolean; line: string; today: string; }

export function statusOf(hours: string[], date = new Date()): Status {
  const { day, min } = seattleNow(date);
  const week = hours.map(parseDay);
  const today = hours[day];
  // open today?
  for (const [o, c] of week[day]) if (min >= o && min < c) return { open: true, line: `open now \u00b7 closes ${fmt(c)}`, today };
  // still open from last night?
  const y = (day + 6) % 7;
  for (const [o, c] of week[y]) if (c > 1440 && min + 1440 >= o && min + 1440 < c) return { open: true, line: `open now \u00b7 closes ${fmt(c)}`, today };
  // when does it open next?
  for (let k = 0; k < 8; k++) {
    const dd = (day + k) % 7;
    const next = week[dd].map((r) => r[0]).filter((o) => k > 0 || o > min).sort((a, b) => a - b)[0];
    if (next !== undefined) {
      const when = k === 0 ? `today` : k === 1 ? 'tomorrow' : DAYS[dd].slice(0, 3).toLowerCase();
      return { open: false, line: `closed \u00b7 opens ${when} ${fmt(next)}`, today };
    }
  }
  return { open: false, line: 'closed', today };
}

export const DAY_NAMES = DAYS;
