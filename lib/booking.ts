// منطق الحجز: حساب السعر، التحقق من المقاعد، إنشاء الحجز، وتأكيد الدفع
import { prisma } from "./db";
import { getSettings, type Settings, SITE_URL } from "./settings";
import { vatOf, fmtMoney } from "./money";
import { bookingCode } from "./ids";
import { fail } from "./auth";
import { fmtDT } from "./dates";
import { waSend, fillVars } from "./wa";

export type Extra = { id: string; name: string; price: number; perPerson?: boolean };
export type ExtraPick = { id: string; qty: number };

/** المقاعد المحجوزة فعليًا في موعد (مدفوعة + بانتظار الدفع ولم تنتهِ مهلتها) */
export async function seatsTaken(departureId: string, tx: any = prisma): Promise<number> {
  const now = new Date();
  const rows: { s: bigint | number | null }[] = await tx.$queryRaw`
    SELECT COALESCE(SUM("adults" + "children"), 0) AS s FROM "Booking"
    WHERE "departureId" = ${departureId} AND ("status" = 'paid' OR ("status" = 'pending' AND "holdUntil" > ${now}))`;
  return Number(rows[0]?.s || 0);
}

export type Quote = {
  adults: number; children: number; priceAdult: number; priceChild: number;
  extras: { id: string; name: string; qty: number; price: number; line: number }[];
  subtotal: number; discount: number; vat: number; total: number; couponId?: string; couponCode?: string; couponError?: string;
};

/** حساب سعر الحجز قبل الإنشاء (يستخدمه الموقع للعرض والخادم للتأكيد) */
export async function quote(o: { trip: any; departure: any; adults: number; children: number; extras: ExtraPick[]; coupon?: string; settings?: Settings }): Promise<Quote> {
  const s = o.settings || (await getSettings());
  const priceAdult = o.departure.priceAdult ?? o.trip.priceAdult;
  const priceChild = o.departure.priceChild ?? o.trip.priceChild ?? priceAdult;
  const persons = o.adults + o.children;
  const defs: Extra[] = Array.isArray(o.trip.extras) ? o.trip.extras : [];
  const extras = (o.extras || []).map((p) => {
    const d = defs.find((x) => x.id === p.id); if (!d) return null;
    const qty = d.perPerson ? persons : Math.max(0, Math.min(99, Math.floor(p.qty) || 0));
    return qty ? { id: d.id, name: d.name, qty, price: d.price, line: d.price * qty } : null;
  }).filter(Boolean) as Quote["extras"];
  const subtotal = o.adults * priceAdult + o.children * priceChild + extras.reduce((a, x) => a + x.line, 0);
  let discount = 0, couponId: string | undefined, couponCode: string | undefined, couponError: string | undefined;
  const code = String(o.coupon || "").trim().toUpperCase();
  if (code) {
    const c = await prisma.coupon.findUnique({ where: { code } });
    const now = new Date();
    if (!c || !c.active) couponError = "كود الخصم غير صحيح";
    else if (c.startsAt && c.startsAt > now) couponError = "كود الخصم لم يبدأ بعد";
    else if (c.endsAt && c.endsAt < now) couponError = "انتهت صلاحية كود الخصم";
    else if (c.maxUses && c.used >= c.maxUses) couponError = "استُنفد عدد استخدامات هذا الكود";
    else if (c.tripId && c.tripId !== o.trip.id) couponError = "هذا الكود خاص برحلة أخرى";
    else if (subtotal < c.minTotal) couponError = `الحد الأدنى لاستخدام الكود ${fmtMoney(c.minTotal)}`;
    else { discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : Math.min(c.value, subtotal); couponId = c.id; couponCode = c.code; }
  }
  const base = Math.max(0, subtotal - discount);
  const { vat, total } = vatOf(base, s.vat.enabled ? s.vat.rate : 0, s.vat.included);
  return { adults: o.adults, children: o.children, priceAdult, priceChild, extras, subtotal, discount, vat, total, couponId, couponCode, couponError };
}

/** إنشاء حجز جديد مع قفل الموعد لمنع تجاوز السعة */
export async function createBooking(o: {
  departureId: string; adults: number; children: number; extras: ExtraPick[]; coupon?: string;
  customer: { name: string; phone: string; email?: string; city?: string }; note?: string; source?: "web" | "admin";
  payMethod?: string; markPaid?: boolean;
}) {
  const s = await getSettings();
  const dep = await prisma.departure.findUnique({ where: { id: o.departureId }, include: { trip: true } });
  if (!dep || !dep.trip) fail("الموعد غير موجود");
  if (dep!.status !== "open" && o.source !== "admin") fail("هذا الموعد غير متاح للحجز");
  if (dep!.trip.status !== "published" && o.source !== "admin") fail("هذه الرحلة غير متاحة حاليًا");
  if (dep!.startAt < new Date() && o.source !== "admin") fail("انتهى موعد هذه الرحلة");
  const persons = o.adults + o.children;
  if (o.adults < 1) fail("يجب أن يكون هناك بالغ واحد على الأقل");
  if (persons > dep!.trip.maxPerBooking) fail(`الحد الأقصى ${dep!.trip.maxPerBooking} مقاعد في الحجز الواحد`);
  if (o.children && dep!.trip.priceChild == null && !dep!.priceChild) { /* الأطفال بسعر البالغ */ }
  const q = await quote({ trip: dep!.trip, departure: dep, adults: o.adults, children: o.children, extras: o.extras, coupon: o.coupon, settings: s });
  if (q.couponError) fail(q.couponError);

  const customer = await prisma.customer.upsert({
    where: { phone: o.customer.phone },
    create: { name: o.customer.name, phone: o.customer.phone, email: o.customer.email || null, city: o.customer.city || null },
    update: { name: o.customer.name, ...(o.customer.email ? { email: o.customer.email } : {}), ...(o.customer.city ? { city: o.customer.city } : {}) },
  });
  const holdUntil = new Date(Date.now() + Math.max(5, s.holdMinutes) * 60000);
  const paid = !!o.markPaid || q.total === 0;
  const booking = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT 1 FROM "Departure" WHERE "id" = ${dep!.id} FOR UPDATE`;
    const taken = await seatsTaken(dep!.id, tx);
    if (taken + persons > dep!.capacity) fail(`المقاعد المتبقية في هذا الموعد: ${Math.max(0, dep!.capacity - taken)}`);
    let code = bookingCode(s.bookingPrefix);
    for (let i = 0; i < 5 && (await tx.booking.findUnique({ where: { code } })); i++) code = bookingCode(s.bookingPrefix);
    const b = await tx.booking.create({
      data: {
        code, tripId: dep!.tripId, departureId: dep!.id, customerId: customer.id,
        adults: o.adults, children: o.children, extras: q.extras, subtotal: q.subtotal, discount: q.discount, vat: q.vat, total: q.total,
        couponId: q.couponId || null, status: paid ? "paid" : "pending", payMethod: paid ? o.payMethod || (q.total === 0 ? "free" : "cash") : o.payMethod || null,
        paidAt: paid ? new Date() : null, holdUntil: paid ? null : holdUntil, note: o.note || null, source: o.source || "web",
        snapshot: { title: dep!.trip.title, slug: dep!.trip.slug, startAt: dep!.startAt, endAt: dep!.endAt, meetingPoint: dep!.trip.meetingPoint, meetingMapUrl: dep!.trip.meetingMapUrl, priceAdult: q.priceAdult, priceChild: q.priceChild, coupon: q.couponCode || null },
      },
    });
    if (paid && q.couponId) await tx.coupon.update({ where: { id: q.couponId }, data: { used: { increment: 1 } } });
    return b;
  });
  if (paid) notifyConfirm(booking.id).catch(() => {});
  return booking;
}

/** تأكيد الدفع (من رجوع العميل أو الويبهوك): آمن للتكرار */
export async function markPaid(bookingId: string, o: { method: string; paymentId?: string; providerId?: string; amount?: number; raw?: any }) {
  const r = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!b) return null;
    if (o.providerId) {
      await tx.payment.upsert({
        where: { providerId: o.providerId },
        create: { bookingId, provider: "moyasar", providerId: o.providerId, amount: o.amount ?? b.total, status: "paid", method: o.method, raw: o.raw ?? undefined },
        update: { status: "paid", method: o.method, amount: o.amount ?? b.total, raw: o.raw ?? undefined },
      });
    }
    if (b.status === "paid") return { b, first: false };
    await tx.booking.update({ where: { id: bookingId }, data: { status: "paid", payMethod: o.method, paidAt: new Date(), holdUntil: null } });
    if (b.couponId) await tx.coupon.update({ where: { id: b.couponId }, data: { used: { increment: 1 } } });
    return { b, first: true };
  });
  if (r?.first) notifyConfirm(bookingId).catch(() => {});
  return r;
}

/** المتغيرات المتاحة في قوالب الرسائل */
export function bookingVars(b: any, s: Settings) {
  const snap = b.snapshot || {};
  const startAt = b.departure?.startAt || snap.startAt;
  return {
    "الاسم": b.customer?.name || "", "الرحلة": b.trip?.title || snap.title || "", "الرقم": b.code,
    "التاريخ": startAt ? fmtDT(startAt) : "", "المقاعد": String(b.adults + b.children), "المبلغ": fmtMoney(b.total),
    "التجمع": b.trip?.meetingPoint || snap.meetingPoint || "", "الرابط": `${SITE_URL()}/booking/${b.code}`, "الجهة": s.brand,
  };
}
export async function bookingMessage(bookingId: string, which: "tplConfirm" | "tplRemind" | "tplCancel") {
  const s = await getSettings();
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: { customer: true, trip: true, departure: true } });
  if (!b) return null;
  return { b, s, text: fillVars(s.wa[which], bookingVars(b, s)) };
}
/** إرسال تأكيد الحجز تلقائيًا إذا كان المزوّد مربوطًا */
export async function notifyConfirm(bookingId: string) {
  const m = await bookingMessage(bookingId, "tplConfirm");
  if (!m || !m.s.wa.enabled || !m.s.wa.autoConfirm) return;
  const r = await waSend(m.s.wa, m.b.customer.phone, m.text);
  await prisma.audit.create({ data: { action: "wa.confirm", target: m.b.code, detail: { ok: r.ok, resp: r.resp.slice(0, 200) } } });
}

/** الحجوزات اللي انتهت مهلة دفعها تُعلَّم منتهية (تنظيف كسول) */
export async function expireHolds() {
  await prisma.booking.updateMany({ where: { status: "pending", holdUntil: { lt: new Date() } }, data: { status: "expired" } });
}

/** إحصاءات الموعد: السعة والمحجوز والمتبقي */
export async function departureSeats(ids: string[]) {
  if (!ids.length) return {} as Record<string, number>;
  const now = new Date();
  const rows: { departureId: string; s: bigint | number }[] = await prisma.$queryRaw`
    SELECT "departureId", COALESCE(SUM("adults" + "children"), 0) AS s FROM "Booking"
    WHERE "departureId" IN (${(await import("@prisma/client")).Prisma.join(ids)}) AND ("status" = 'paid' OR ("status" = 'pending' AND "holdUntil" > ${now}))
    GROUP BY "departureId"`;
  const out: Record<string, number> = {};
  for (const r of rows) out[r.departureId] = Number(r.s);
  return out;
}
