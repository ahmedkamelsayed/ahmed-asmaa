// Time-zone-aware helpers. The event instant is derived from the
// configured wall-clock time in the event's zone (not the visitor's).

function zoneOffsetMs(epochMs, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(epochMs));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/** Epoch ms for a wall-clock date ("YYYY-MM-DD") + time ("HH:MM") in `timeZone`. */
export function zonedTimeToEpoch(date, time, timeZone) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes so the offset is the one in effect at the result (DST-safe).
  const first = wall - zoneOffsetMs(wall, timeZone);
  return wall - zoneOffsetMs(first, timeZone);
}

/** Remaining time split into units; `passed` once the target is reached. */
export function getRemaining(target, now) {
  const diff = target - now;
  if (diff <= 0) return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const total = Math.floor(diff / 1000);
  return {
    passed: false,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
