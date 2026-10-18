import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRemaining, zonedTimeToEpoch } from '../src/lib/time.js';
import { dateFull, dateNumeric, eventEpoch, timeText } from '../src/lib/format.js';
import { config } from '../src/config.js';

test('event date is a Friday', () => {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Africa/Cairo' })
    .format(eventEpoch());
  assert.equal(weekday, 'Friday');
  assert.equal(dateFull('en'), 'Friday, November 6, 2026');
  assert.equal(dateFull('ar'), 'الجمعة ٦ نوفمبر ٢٠٢٦');
  assert.equal(dateNumeric('en'), '06 · 11 · 2026');
  assert.equal(dateNumeric('ar'), '٠٦ · ١١ · ٢٠٢٦');
});

test('16:00 Cairo on 2026-11-06 (winter, UTC+2) is 14:00 UTC', () => {
  assert.equal(new Date(zonedTimeToEpoch('2026-11-06', '16:00', 'Africa/Cairo')).toISOString(),
    '2026-11-06T14:00:00.000Z');
});

test('Cairo summer time (UTC+3) is honoured', () => {
  assert.equal(new Date(zonedTimeToEpoch('2026-07-01', '16:00', 'Africa/Cairo')).toISOString(),
    '2026-07-01T13:00:00.000Z');
});

test('countdown target follows config time', () => {
  assert.equal(eventEpoch(),
    zonedTimeToEpoch(config.event.date, config.event.time, config.event.timeZone));
  assert.equal(timeText('en'), '4:00 PM');
  assert.equal(timeText('ar'), '٤:٠٠ عصرًا');
});

test('getRemaining splits units and handles the past', () => {
  const target = Date.UTC(2026, 10, 6, 14);
  const r = getRemaining(target, target - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
  assert.deepEqual(r, { passed: false, days: 2, hours: 3, minutes: 4, seconds: 5 });
  assert.equal(getRemaining(target, target).passed, true);
  assert.equal(getRemaining(target, target + 1000).passed, true);
});

test('both versions have the same wording keys', () => {
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]).sort();
  assert.deepEqual(keys(config.content.en), keys(config.content.ar));
});
