/** التوقيت: السعودية دائمًا (Asia/Riyadh)، التقويم ميلادي بالأرقام الإنجليزية، مع الهجري كتاريخ ثانوي */
export const TZ = "Asia/Riyadh";
const LOC = "ar-SA-u-ca-gregory-nu-latn";
const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOC, { timeZone: TZ, ...o });
const F = {
  full: f({ weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  date: f({ day: "numeric", month: "long", year: "numeric" }),
  short: f({ weekday: "short", day: "numeric", month: "short" }),
  dm: f({ day: "numeric", month: "long" }),
  time: f({ hour: "numeric", minute: "2-digit" }),
  dt: f({ weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }),
  hijri: new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura-nu-latn", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }),
  iso: new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }),
  isoT: new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }),
  weekday: f({ weekday: "long" }),
  day: f({ day: "numeric" }),
  mon: f({ month: "short" }),
};
const D = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));
export const fmtFull = (d: Date | string) => F.full.format(D(d));
export const fmtDate = (d: Date | string) => F.date.format(D(d));
export const fmtShort = (d: Date | string) => F.short.format(D(d));
export const fmtDM = (d: Date | string) => F.dm.format(D(d));
export const fmtTime = (d: Date | string) => F.time.format(D(d)).replace("ص", "صباحًا").replace("م", "مساءً");
export const fmtDT = (d: Date | string) => `${F.dt.format(D(d))}`.replace("ص", "صباحًا").replace("م", "مساءً");
export const fmtHijri = (d: Date | string) => F.hijri.format(D(d));
export const fmtWeekday = (d: Date | string) => F.weekday.format(D(d));
export const fmtDay = (d: Date | string) => F.day.format(D(d));
export const fmtMon = (d: Date | string) => F.mon.format(D(d));
/** YYYY-MM-DD بتوقيت السعودية */
export const localDate = (d: Date = new Date()) => F.iso.format(d);
/** HH:MM بتوقيت السعودية */
export const localTime = (d: Date = new Date()) => F.isoT.format(d);
/** يحوّل تاريخ ووقت محلي (YYYY-MM-DD, HH:MM) إلى Date بتوقيت السعودية (+03:00) */
export const fromLocal = (date: string, time = "00:00") => new Date(`${date}T${time || "00:00"}:00+03:00`);
/** قيمة لحقل datetime-local من تاريخ */
export const toLocalInput = (d: Date | string) => `${localDate(D(d))}T${localTime(D(d))}`;
export const daysUntil = (d: Date | string) => Math.ceil((D(d).getTime() - Date.now()) / 86400000);
export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
