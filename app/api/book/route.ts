import { handle, fail, int, str, cleanPhone, isSaudiPhone } from "@/lib/auth";
import { createBooking } from "@/lib/booking";
import { currentCustomer } from "@/lib/customer";
export const dynamic = "force-dynamic";

/** إنشاء حجز من الموقع: يحجز المقاعد مؤقتًا ويعيد رقم الحجز للانتقال لصفحة الدفع */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const me = await currentCustomer();
    const name = str(b.name, 80) || me?.name || "";
    // العميل المسجّل يحجز دائمًا برقم حسابه
    const phone = me ? me.phone : cleanPhone(b.phone);
    if (name.length < 3) fail("يرجى كتابة الاسم الكامل");
    if (!isSaudiPhone(phone) && !(phone.length >= 10 && phone.length <= 15)) fail("رقم الجوال غير صحيح، مثال: 05xxxxxxxx");
    const email = str(b.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("البريد الإلكتروني غير صحيح");
    if (!b.agree) fail("يجب الموافقة على الشروط والأحكام");
    const extras = Array.isArray(b.extras) ? b.extras.slice(0, 20).map((x: any) => ({ id: str(x.id, 20), qty: int(x.qty, 1) })) : [];
    const bk = await createBooking({
      departureId: str(b.departureId, 40), adults: Math.max(1, Math.min(50, int(b.adults, 1))), children: Math.max(0, Math.min(50, int(b.children, 0))),
      extras, coupon: str(b.coupon, 30), customer: { name, phone, email: email || undefined, city: str(b.city, 60) || undefined }, note: str(b.note, 500) || undefined, source: "web",
    });
    return { code: bk.code, status: bk.status, total: bk.total };
  });
}
