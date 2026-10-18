// Deterministic date/time text built from config (no locale/ICU variance,
// so the prerendered HTML matches the browser render exactly).
import { config } from '../config.js';
import { zonedTimeToEpoch } from './time.js';

const WEEKDAYS = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};
const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** Arabic-Indic digits for the Arabic version, Latin digits otherwise. */
export const digits = (value, lang) =>
  lang === 'ar' ? String(value).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(value);

function parts() {
  const [y, m, d] = config.event.date.split('-').map(Number);
  const [hh, mm] = config.event.time.split(':').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m, d, hh, mm, weekday };
}

export function eventEpoch() {
  const { date, time, timeZone } = config.event;
  return zonedTimeToEpoch(date, time, timeZone);
}

export function dateFull(lang) {
  const { y, m, d, weekday } = parts();
  if (lang === 'ar') return `${WEEKDAYS.ar[weekday]} ${digits(d, 'ar')} ${MONTHS.ar[m - 1]} ${digits(y, 'ar')}`;
  return `${WEEKDAYS.en[weekday]}, ${MONTHS.en[m - 1]} ${d}, ${y}`;
}

export function dateNumeric(lang) {
  const { y, m, d } = parts();
  const pad = (n) => String(n).padStart(2, '0');
  return digits(`${pad(d)} · ${pad(m)} · ${y}`, lang);
}

export function timeText(lang) {
  const { hh, mm } = parts();
  const h12 = hh % 12 || 12;
  const min = String(mm).padStart(2, '0');
  if (lang === 'ar') {
    const period = hh < 12 ? 'صباحًا' : hh < 15 ? 'ظهرًا' : hh < 18 ? 'عصرًا' : 'مساءً';
    return `${digits(h12, 'ar')}:${digits(min, 'ar')} ${period}`;
  }
  return `${h12}:${min} ${hh < 12 ? 'AM' : 'PM'}`;
}
