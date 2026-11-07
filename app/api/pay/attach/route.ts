import { handle, fail, str } from "@/lib/auth";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

/** ربط رقم عملية الدفع بالحجز فور إنشائها في المتصفح (قبل التحقق من 3D Secure) */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const code = str(b.code, 20).toUpperCase(), pid = str(b.paymentId, 60);
    if (!code || !pid) fail("بيانات ناقصة");
    const bk = await prisma.booking.findUnique({ where: { code } });
    if (!bk) fail("الحجز غير موجود", 404);
    await prisma.payment.upsert({ where: { providerId: pid }, create: { bookingId: bk!.id, providerId: pid, amount: bk!.total, status: "initiated" }, update: {} });
    return { ok: true };
  });
}
