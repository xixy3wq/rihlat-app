// كل عمليات التعديل في لوحة الإدارة: { op, ...data }
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handle, fail, requireStaff, requireAdmin, str, int, bool, cleanPhone, cleanUsername, USERNAME_RE } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { createBooking, markPaid, bookingMessage, notifyConfirm } from "@/lib/booking";
import { refundPayment } from "@/lib/moyasar";
import { waSend } from "@/lib/wa";
import { slugify, shortId } from "@/lib/ids";
import { toHalalas } from "@/lib/money";
export const dynamic = "force-dynamic";

const lines = (v: unknown) => (Array.isArray(v) ? v : String(v ?? "").split("\n")).map((x) => String(x).trim()).filter(Boolean).slice(0, 60);
const money = (v: unknown) => (v === "" || v == null ? null : toHalalas(v));
const date = (v: unknown) => { const d = new Date(String(v || "")); return isNaN(d.getTime()) ? null : d; };
const audit = (userId: string, action: string, target?: string, detail?: any) => prisma.audit.create({ data: { userId, action, target, detail } }).catch(() => {});

export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const op = String(b.op || "");
    const me = await requireStaff();
    const admin = me.role === "admin";
    const needAdmin = () => { if (!admin) fail("هذه الصلاحية للمدير فقط", 403); };

    switch (op) {
      /* ---------- الرحلات ---------- */
      case "trip.save": {
        needAdmin();
        const title = str(b.title, 120); if (title.length < 3) fail("اكتب عنوان الرحلة");
        let slug = str(b.slug, 80) || slugify(title); slug = slugify(slug);
        const dup = await prisma.trip.findFirst({ where: { slug, NOT: { id: b.id || "" } } }); if (dup) slug = `${slug}-${shortId().slice(0, 4)}`;
        const data: any = {
          title, slug, subtitle: str(b.subtitle, 200) || null, categoryId: str(b.categoryId, 40) || null, city: str(b.city, 60) || null, destination: str(b.destination, 80) || null,
          durationDays: Math.max(1, int(b.durationDays, 1)), durationLabel: str(b.durationLabel, 40) || null, startTime: str(b.startTime, 20) || null,
          cover: str(b.cover, 500) || null, images: lines(b.images).slice(0, 12), summary: str(b.summary, 200) || null, description: str(b.description, 5000) || null,
          itinerary: (Array.isArray(b.itinerary) ? b.itinerary : []).slice(0, 14).map((d: any) => ({ title: str(d.title, 100), items: lines(d.items) })).filter((d: any) => d.title),
          includes: lines(b.includes), excludes: lines(b.excludes), meetingPoint: str(b.meetingPoint, 300) || null, meetingMapUrl: str(b.meetingMapUrl, 500) || null,
          priceAdult: toHalalas(b.priceAdult), priceChild: money(b.priceChild), childNote: str(b.childNote, 100) || null, minAge: b.minAge === "" || b.minAge == null ? null : int(b.minAge),
          extras: (Array.isArray(b.extras) ? b.extras : []).slice(0, 10).map((x: any) => ({ id: str(x.id, 20) || shortId(), name: str(x.name, 80), price: toHalalas(x.price), perPerson: bool(x.perPerson) })).filter((x: any) => x.name),
          capacityDefault: Math.max(1, int(b.capacityDefault, 20)), maxPerBooking: Math.max(1, int(b.maxPerBooking, 10)),
          status: ["draft", "published", "archived"].includes(b.status) ? b.status : "draft", featured: bool(b.featured), order: int(b.order),
          faq: (Array.isArray(b.faq) ? b.faq : []).slice(0, 12).map((f: any) => ({ q: str(f.q, 200), a: str(f.a, 1000) })).filter((f: any) => f.q), policy: str(b.policy, 2000) || null,
        };
        if (data.priceAdult <= 0) fail("اكتب سعر البالغ");
        const t = b.id ? await prisma.trip.update({ where: { id: b.id }, data }) : await prisma.trip.create({ data });
        await audit(me.id, op, t.id);
        return { id: t.id, slug: t.slug };
      }
      case "trip.delete": {
        needAdmin();
        const n = await prisma.booking.count({ where: { tripId: b.id } });
        if (n) { await prisma.trip.update({ where: { id: b.id }, data: { status: "archived" } }); return { archived: true }; }
        await prisma.trip.delete({ where: { id: b.id } }); return { ok: true };
      }
      case "trip.duplicate": {
        needAdmin();
        const t: any = await prisma.trip.findUnique({ where: { id: b.id } }); if (!t) fail("غير موجود");
        const { id, createdAt, updatedAt, views, ...rest } = t;
        const c = await prisma.trip.create({ data: { ...rest, title: `${t.title} (نسخة)`, slug: `${t.slug}-${shortId().slice(0, 4)}`, status: "draft", featured: false } });
        return { id: c.id };
      }
      case "category.save": {
        needAdmin();
        const name = str(b.name, 40); if (!name) fail("اكتب اسم التصنيف");
        const data = { name, slug: slugify(str(b.slug, 40) || name), icon: str(b.icon, 8) || "🏕️", order: int(b.order) };
        return b.id ? prisma.category.update({ where: { id: b.id }, data }) : prisma.category.create({ data });
      }
      case "category.delete": needAdmin(); await prisma.category.delete({ where: { id: b.id } }); return { ok: true };

      /* ---------- المواعيد ---------- */
      case "dep.save": {
        needAdmin();
        const startAt = date(b.startAt); if (!startAt) fail("اختر تاريخ ووقت الانطلاق");
        const data: any = { startAt, endAt: date(b.endAt), capacity: Math.max(1, int(b.capacity, 20)), priceAdult: money(b.priceAdult), priceChild: money(b.priceChild), status: ["open", "closed", "cancelled", "done"].includes(b.status) ? b.status : "open", note: str(b.note, 200) || null };
        if (b.id) return prisma.departure.update({ where: { id: b.id }, data });
        const trip = await prisma.trip.findUnique({ where: { id: str(b.tripId, 40) } }); if (!trip) fail("الرحلة غير موجودة");
        return prisma.departure.create({ data: { ...data, tripId: trip!.id } });
      }
      case "dep.delete": {
        needAdmin();
        const n = await prisma.booking.count({ where: { departureId: b.id, status: { in: ["paid", "pending"] } } });
        if (n) fail("لا يمكن حذف موعد عليه حجوزات، أغلقه أو ألغِه بدلًا من ذلك");
        await prisma.departure.delete({ where: { id: b.id } }); return { ok: true };
      }

      /* ---------- الحجوزات ---------- */
      case "booking.create": {
        const name = str(b.name, 80), phone = cleanPhone(b.phone);
        if (name.length < 2 || phone.length < 9) fail("اكتب اسم العميل ورقم جواله");
        const bk = await createBooking({
          departureId: str(b.departureId, 40), adults: Math.max(1, int(b.adults, 1)), children: Math.max(0, int(b.children, 0)),
          extras: Array.isArray(b.extras) ? b.extras : [], coupon: str(b.coupon, 30), customer: { name, phone, email: str(b.email, 120) || undefined }, note: str(b.note, 500) || undefined,
          source: "admin", payMethod: str(b.payMethod, 20) || "cash", markPaid: bool(b.markPaid),
        });
        await audit(me.id, op, bk.code);
        return { id: bk.id, code: bk.code };
      }
      case "booking.markPaid": {
        const bk = await prisma.booking.findUnique({ where: { id: b.id } }); if (!bk) fail("غير موجود");
        if (bk!.status !== "pending") fail("الحجز ليس بانتظار الدفع");
        await markPaid(bk!.id, { method: str(b.method, 20) || "transfer" });
        await audit(me.id, op, bk!.code); return { ok: true };
      }
      case "booking.cancel": {
        const bk = await prisma.booking.findUnique({ where: { id: b.id }, include: { payments: { where: { status: "paid" } } } }); if (!bk) fail("غير موجود");
        if (["cancelled", "refunded"].includes(bk!.status)) fail("الحجز ملغى مسبقًا");
        const refund = Math.max(0, Math.min(toHalalas(b.refund), bk!.total));
        let refunded = 0, note = "";
        if (refund > 0 && bk!.status === "paid") {
          needAdmin();
          const pay = bk!.payments.find((p) => p.providerId);
          if (pay?.providerId) {
            const s = await getSettings();
            const r = await refundPayment(s.payment.sk, pay.providerId, refund);
            refunded = refund;
            await prisma.payment.update({ where: { id: pay.id }, data: { refunded: { increment: refund }, status: refund >= pay.amount ? "refunded" : "paid", raw: r as any } });
          } else note = " (الاسترجاع يدوي: الدفع لم يكن عبر البوابة)";
        }
        await prisma.booking.update({ where: { id: bk!.id }, data: { status: refunded > 0 && refunded >= bk!.total ? "refunded" : "cancelled", holdUntil: null, adminNote: [bk!.adminNote, `${refunded ? `استرجاع ${refunded / 100} ر.س` : "إلغاء"}${note} — ${me.name}`].filter(Boolean).join("\n") } });
        await audit(me.id, op, bk!.code, { refunded });
        const m = await bookingMessage(bk!.id, "tplCancel");
        if (m && m.s.wa.enabled && bool(b.notify)) waSend(m.s.wa, m.b.customer.phone, m.text).catch(() => {});
        return { ok: true, refunded, manual: !!note };
      }
      case "booking.note": await prisma.booking.update({ where: { id: b.id }, data: { adminNote: str(b.adminNote, 1000) || null } }); return { ok: true };
      case "booking.attend": {
        const where = b.id ? { id: b.id } : { code: str(b.code, 20).toUpperCase() };
        const bk = await prisma.booking.findUnique({ where: where as any }); if (!bk) fail("الحجز غير موجود", 404);
        if (bk!.status !== "paid") fail("الحجز غير مدفوع");
        const attended = b.attended === undefined ? !bk!.attended : bool(b.attended);
        await prisma.booking.update({ where: { id: bk!.id }, data: { attended, attendedAt: attended ? new Date() : null } });
        return { ok: true, attended };
      }
      case "booking.resend": { await notifyConfirm(b.id); return { ok: true }; }
      case "booking.message": { const m = await bookingMessage(b.id, b.which === "remind" ? "tplRemind" : b.which === "cancel" ? "tplCancel" : "tplConfirm"); if (!m) fail("غير موجود"); return { text: m!.text, phone: m!.b.customer.phone }; }

      /* ---------- العملاء ---------- */
      case "customer.save": {
        const data = { name: str(b.name, 80), email: str(b.email, 120) || null, city: str(b.city, 60) || null, note: str(b.note, 500) || null };
        if (!data.name) fail("اكتب الاسم");
        return prisma.customer.update({ where: { id: b.id }, data });
      }

      /* ---------- الكوبونات ---------- */
      case "coupon.save": {
        needAdmin();
        const code = str(b.code, 30).toUpperCase().replace(/\s/g, ""); if (code.length < 2) fail("اكتب كود الخصم");
        const type = b.type === "fixed" ? "fixed" : "percent";
        const value = type === "percent" ? Math.max(1, Math.min(100, int(b.value))) : toHalalas(b.value);
        if (!value) fail("اكتب قيمة الخصم");
        const data = { code, type, value, minTotal: toHalalas(b.minTotal), maxUses: b.maxUses ? int(b.maxUses) : null, tripId: str(b.tripId, 40) || null, startsAt: date(b.startsAt), endsAt: date(b.endsAt), active: b.active === undefined ? true : bool(b.active) };
        return b.id ? prisma.coupon.update({ where: { id: b.id }, data }) : prisma.coupon.create({ data });
      }
      case "coupon.delete": needAdmin(); await prisma.coupon.delete({ where: { id: b.id } }); return { ok: true };

      /* ---------- التقييمات والرسائل ---------- */
      case "review.approve": needAdmin(); await prisma.review.update({ where: { id: b.id }, data: { approved: bool(b.approved) } }); return { ok: true };
      case "review.delete": needAdmin(); await prisma.review.delete({ where: { id: b.id } }); return { ok: true };
      case "message.read": await prisma.message.update({ where: { id: b.id }, data: { read: bool(b.read) } }); return { ok: true };
      case "message.delete": await prisma.message.delete({ where: { id: b.id } }); return { ok: true };

      /* ---------- الإعدادات ---------- */
      case "settings.save": {
        needAdmin();
        const p = b.patch && typeof b.patch === "object" ? b.patch : {};
        // المفاتيح السرية: الفارغ يعني «لا تغيّر»
        if (p.payment) { for (const k of ["sk", "webhookSecret"]) if (!String(p.payment[k] || "").trim()) delete p.payment[k]; delete p.payment.hasSk; delete p.payment.hasWebhookSecret; delete p.payment.live; delete p.payment.ready; }
        if (p.wa) { for (const k of ["url", "body"]) if (!String(p.wa[k] || "").trim()) delete p.wa[k]; delete p.wa.hasUrl; }
        if (p.payment?.pk && !/^pk_(test|live)_/.test(p.payment.pk)) fail("المفتاح المعلن يجب أن يبدأ بـ pk_test_ أو pk_live_");
        if (p.payment?.sk && !/^sk_(test|live)_/.test(p.payment.sk)) fail("المفتاح السري يجب أن يبدأ بـ sk_test_ أو sk_live_");
        if (p.payment?.applePayLabel && !/^[\x20-\x7E]+$/.test(p.payment.applePayLabel)) fail("اسم Apple Pay يجب أن يكون بأحرف إنجليزية فقط");
        await saveSettings(p); await audit(me.id, op); return { ok: true };
      }
      case "settings.clearSecret": { needAdmin(); const k = str(b.key, 40); const patch: any = k === "wa.url" ? { wa: { url: "", body: "" } } : k === "payment.sk" ? { payment: { sk: "" } } : k === "payment.webhookSecret" ? { payment: { webhookSecret: "" } } : {}; await saveSettings(patch); return { ok: true }; }
      case "wa.test": {
        needAdmin();
        const s = await getSettings();
        const r = await waSend({ ...s.wa, enabled: true }, cleanPhone(b.phone), `رسالة تجريبية من ${s.brand} ✅`);
        if (!r.ok) fail(`فشل الإرسال: ${r.resp.slice(0, 200)}`); return { ok: true, resp: r.resp.slice(0, 200) };
      }

      /* ---------- الموظفون ---------- */
      case "user.save": {
        needAdmin();
        const name = str(b.name, 60), username = cleanUsername(b.username), password = String(b.password || "");
        if (!name) fail("اكتب الاسم"); if (!USERNAME_RE.test(username)) fail("اسم المستخدم: أحرف إنجليزية صغيرة وأرقام (3-30)");
        const role = b.role === "admin" ? "admin" : "staff", status = b.status === "disabled" ? "disabled" : "active";
        if (b.id) {
          if (b.id === me.id && (role !== "admin" || status !== "active")) fail("لا يمكنك تعطيل حسابك");
          return prisma.user.update({ where: { id: b.id }, data: { name, username, role, status, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) }, select: { id: true } });
        }
        if (password.length < 8) fail("كلمة المرور 8 أحرف على الأقل");
        if (await prisma.user.findUnique({ where: { username } })) fail("اسم المستخدم مستخدم");
        return prisma.user.create({ data: { name, username, role, status, passwordHash: await bcrypt.hash(password, 10) }, select: { id: true } });
      }
      case "user.delete": needAdmin(); if (b.id === me.id) fail("لا يمكنك حذف حسابك"); await prisma.user.delete({ where: { id: b.id } }); return { ok: true };
      default: fail("عملية غير معروفة");
    }
  });
}
