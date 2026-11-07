import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings, SITE_URL } from "@/lib/settings";
import { fetchPayment, methodKey } from "@/lib/moyasar";
import { markPaid } from "@/lib/booking";
export const dynamic = "force-dynamic";

/** رجوع العميل من بوابة الدفع: نتحقق من العملية بالمفتاح السري ثم نؤكد الحجز */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const id = u.searchParams.get("id") || "";
  const msg = u.searchParams.get("message") || "";
  const site = SITE_URL();
  const back = (path: string) => NextResponse.redirect(`${site}${path}`, 303);
  if (!id) return back("/trips");
  try {
    const s = await getSettings();
    const p = await fetchPayment(s.payment.sk, id);
    const code = (p.metadata?.booking_code || /\b[A-Z]{1,4}-[A-Z0-9]{6}\b/.exec(p.description || "")?.[0] || "").toUpperCase();
    let b = code ? await prisma.booking.findUnique({ where: { code } }) : null;
    if (!b) { const pay = await prisma.payment.findUnique({ where: { providerId: id } }); if (pay) b = await prisma.booking.findUnique({ where: { id: pay.bookingId } }); }
    if (!b) return back(`/trips?err=${encodeURIComponent("لم يتم العثور على الحجز المرتبط بعملية الدفع")}`);
    if (p.status === "paid" && p.currency === "SAR" && p.amount === b.total) {
      await markPaid(b.id, { method: methodKey(p), providerId: p.id, amount: p.amount, raw: p });
      return back(`/booking/${b.code}?paid=1`);
    }
    await prisma.payment.upsert({
      where: { providerId: p.id },
      create: { bookingId: b.id, providerId: p.id, amount: p.amount, status: p.status === "paid" ? "paid" : "failed", method: methodKey(p), message: p.source?.message || msg, raw: p as any },
      update: { status: p.status === "paid" ? "paid" : "failed", message: p.source?.message || msg, raw: p as any },
    });
    const reason = p.status === "paid" && p.amount !== b.total ? "المبلغ المدفوع لا يطابق قيمة الحجز، تواصل معنا" : p.source?.message || msg || "لم تكتمل العملية";
    return back(`/pay/${b.code}?err=${encodeURIComponent(reason)}`);
  } catch (e: any) {
    console.error("pay callback", e);
    return back(`/trips?err=${encodeURIComponent("تعذر التحقق من عملية الدفع، تواصل معنا مع رقم الحجز")}`);
  }
}
