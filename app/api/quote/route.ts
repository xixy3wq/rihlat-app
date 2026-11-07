import { handle, fail, int, str } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { quote } from "@/lib/booking";
export const dynamic = "force-dynamic";

/** حساب السعر النهائي قبل الحجز (كوبون، إضافات، ضريبة) */
export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const dep = await prisma.departure.findUnique({ where: { id: str(b.departureId, 40) }, include: { trip: true } });
    if (!dep) fail("الموعد غير موجود");
    const adults = Math.max(1, Math.min(50, int(b.adults, 1)));
    const children = Math.max(0, Math.min(50, int(b.children, 0)));
    const extras = Array.isArray(b.extras) ? b.extras.slice(0, 20).map((x: any) => ({ id: str(x.id, 20), qty: int(x.qty, 1) })) : [];
    const q = await quote({ trip: dep!.trip, departure: dep, adults, children, extras, coupon: str(b.coupon, 30) });
    return q;
  });
}
