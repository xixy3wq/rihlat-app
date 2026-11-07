import { handle, fail, int, str } from "@/lib/auth";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const bk = await prisma.booking.findUnique({ where: { code: str(b.code, 20).toUpperCase() }, include: { customer: true, departure: true, review: true } });
    if (!bk || bk.status !== "paid") fail("الحجز غير صالح للتقييم");
    if (bk!.review) fail("تم التقييم مسبقًا");
    if (bk!.departure.startAt > new Date()) fail("يمكن التقييم بعد انتهاء الرحلة");
    const rating = Math.max(1, Math.min(5, int(b.rating, 5)));
    await prisma.review.create({ data: { tripId: bk!.tripId, bookingId: bk!.id, name: bk!.customer.name.split(" ").slice(0, 2).join(" "), rating, text: str(b.text, 600) || null } });
    return { ok: true };
  });
}
