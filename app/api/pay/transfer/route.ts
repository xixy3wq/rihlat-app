import { handle, fail, str } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";

/** العميل اختار التحويل البنكي: نمدّد حجز المقاعد 24 ساعة بانتظار تأكيد الإدارة */
export async function POST(req: Request) {
  return handle(async () => {
    const s = await getSettings();
    if (!s.payment.allowTransfer) fail("التحويل البنكي غير متاح");
    const b = await req.json().catch(() => ({}));
    const bk = await prisma.booking.findUnique({ where: { code: str(b.code, 20).toUpperCase() } });
    if (!bk || bk.status !== "pending") fail("الحجز غير متاح");
    await prisma.booking.update({ where: { id: bk!.id }, data: { payMethod: "transfer", holdUntil: new Date(Date.now() + 24 * 3600 * 1000) } });
    return { ok: true };
  });
}
