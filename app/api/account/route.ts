import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { handle, fail, ApiError, str, cleanPhone, isSaudiPhone } from "@/lib/auth";
import { currentCustomer, setCustomerCookie, clearCustomerCookie } from "@/lib/customer";
export const dynamic = "force-dynamic";

/** حماية من التخمين: 8 محاولات فاشلة لكل رقم خلال ربع ساعة */
async function guardTries(phone: string) {
  const n = await prisma.audit.count({ where: { action: "cust.fail", target: phone, createdAt: { gt: new Date(Date.now() - 15 * 60000) } } });
  if (n >= 8) fail("محاولات كثيرة، يرجى المحاولة بعد ربع ساعة", 429);
}
const failed = (phone: string) => prisma.audit.create({ data: { action: "cust.fail", target: phone } }).catch(() => {});
const validPhone = (p: string) => isSaudiPhone(p) || (p.length >= 10 && p.length <= 15);
const validPass = (p: string) => { if (p.length < 6) fail("كلمة المرور 6 أحرف على الأقل"); };

/** عمليات حساب العميل: { op: register | login | logout | reset | update } */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const op = String(b.op || "");
    if (op === "logout") { clearCustomerCookie(); return { ok: true }; }

    if (op === "register") {
      const name = str(b.name, 80), phone = cleanPhone(b.phone), password = String(b.password || ""), email = str(b.email, 120);
      if (name.length < 3) fail("يرجى كتابة الاسم الكامل");
      if (!validPhone(phone)) fail("رقم الجوال غير صحيح، مثال: 05xxxxxxxx");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("البريد الإلكتروني غير صحيح");
      validPass(password);
      const ex = await prisma.customer.findUnique({ where: { phone }, include: { _count: { select: { bookings: true } } } });
      if (ex?.passwordHash) fail("هذا الرقم مسجّل مسبقًا، يرجى تسجيل الدخول");
      if (ex && ex._count.bookings > 0) {
        // الرقم له حجوزات سابقة بدون حساب: نتحقق من ملكيته برقم أحد حجوزاته
        await guardTries(phone);
        const code = str(b.claimCode, 20).toUpperCase().replace(/\s/g, "");
        if (!code) throw new ApiError("لهذا الرقم حجوزات سابقة. لتأكيد ملكيته اكتب رقم أحد حجوزاتك.", 409);
        const own = await prisma.booking.findFirst({ where: { code, customerId: ex.id } });
        if (!own) { await failed(phone); fail("رقم الحجز لا يطابق رقم الجوال"); }
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const c = ex
        ? await prisma.customer.update({ where: { id: ex.id }, data: { name, passwordHash, lastLoginAt: new Date(), ...(email ? { email } : {}) } })
        : await prisma.customer.create({ data: { name, phone, email: email || null, passwordHash, lastLoginAt: new Date() } });
      await setCustomerCookie(c.id);
      return { ok: true };
    }

    if (op === "login") {
      const phone = cleanPhone(b.phone), password = String(b.password || "");
      await guardTries(phone);
      const c = phone ? await prisma.customer.findUnique({ where: { phone } }) : null;
      if (!c?.passwordHash || !(await bcrypt.compare(password, c.passwordHash))) { await failed(phone); fail("رقم الجوال أو كلمة المرور غير صحيحة", 401); }
      await prisma.customer.update({ where: { id: c!.id }, data: { lastLoginAt: new Date() } });
      await setCustomerCookie(c!.id);
      return { ok: true };
    }

    if (op === "reset") {
      // استعادة كلمة المرور برقم الجوال ورقم أحد الحجوزات
      const phone = cleanPhone(b.phone), code = str(b.code, 20).toUpperCase().replace(/\s/g, ""), password = String(b.password || "");
      await guardTries(phone);
      validPass(password);
      const bk = code ? await prisma.booking.findUnique({ where: { code }, include: { customer: true } }) : null;
      if (!bk || bk.customer.phone !== phone) { await failed(phone); fail("لم نجد حجزًا بهذا الرقم لهذا الجوال"); }
      await prisma.customer.update({ where: { id: bk!.customerId }, data: { passwordHash: await bcrypt.hash(password, 10), lastLoginAt: new Date() } });
      await setCustomerCookie(bk!.customerId);
      return { ok: true };
    }

    if (op === "update") {
      const me = await currentCustomer();
      if (!me) fail("يجب تسجيل الدخول", 401);
      const name = str(b.name, 80), email = str(b.email, 120), city = str(b.city, 60);
      if (name.length < 3) fail("يرجى كتابة الاسم الكامل");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("البريد الإلكتروني غير صحيح");
      const data: any = { name, email: email || null, city: city || null };
      if (b.newPassword) {
        if (!(await bcrypt.compare(String(b.currentPassword || ""), me!.passwordHash!))) fail("كلمة المرور الحالية غير صحيحة");
        validPass(String(b.newPassword));
        data.passwordHash = await bcrypt.hash(String(b.newPassword), 10);
      }
      await prisma.customer.update({ where: { id: me!.id }, data });
      return { ok: true };
    }
    fail("عملية غير معروفة");
  });
}
