import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { fetchPayment, methodKey } from "@/lib/moyasar";
import { markPaid } from "@/lib/booking";
export const dynamic = "force-dynamic";

const same = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

/** ويبهوك ميسّر: تأكيد احتياطي للدفع حتى لو لم يرجع العميل للموقع */
export async function POST(req: Request) {
  const ev: any = await req.json().catch(() => null);
  if (!ev || typeof ev !== "object") return NextResponse.json({ error: "bad payload" }, { status: 400 });
  const s = await getSettings();
  if (!s.payment.webhookSecret || !same(String(ev.secret_token || ""), s.payment.webhookSecret)) return NextResponse.json({ error: "invalid token" }, { status: 401 });
  const evId = String(ev.id || "");
  if (evId) {
    try { await prisma.payEvent.create({ data: { id: evId, type: String(ev.type || "") } }); }
    catch { return NextResponse.json({ ok: true, dup: true }); }
  }
  const data: any = ev.data || {};
  const pid = String(data.id || "");
  if (!pid) return NextResponse.json({ ok: true });
  try {
    // نعتمد على بيانات ميسّر نفسها لا على الحمولة
    const p = await fetchPayment(s.payment.sk, pid);
    const code = (p.metadata?.booking_code || /\b[A-Z]{1,4}-[A-Z0-9]{6}\b/.exec(p.description || "")?.[0] || "").toUpperCase();
    let b = code ? await prisma.booking.findUnique({ where: { code } }) : null;
    if (!b) { const pay = await prisma.payment.findUnique({ where: { providerId: pid } }); if (pay) b = await prisma.booking.findUnique({ where: { id: pay.bookingId } }); }
    if (!b) return NextResponse.json({ ok: true, unmatched: true });
    if (ev.type === "payment_paid" || p.status === "paid") {
      if (p.currency === "SAR" && p.amount === b.total) await markPaid(b.id, { method: methodKey(p), providerId: p.id, amount: p.amount, raw: p });
    } else if (ev.type === "payment_refunded" || p.status === "refunded") {
      await prisma.payment.updateMany({ where: { providerId: p.id }, data: { status: "refunded", refunded: p.refunded || p.amount, raw: p as any } });
      if ((p.refunded || 0) >= p.amount) await prisma.booking.update({ where: { id: b.id }, data: { status: "refunded" } });
    } else if (ev.type === "payment_failed") {
      await prisma.payment.upsert({ where: { providerId: p.id }, create: { bookingId: b.id, providerId: p.id, amount: p.amount, status: "failed", method: methodKey(p), message: p.source?.message, raw: p as any }, update: { status: "failed", message: p.source?.message, raw: p as any } });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("webhook", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
