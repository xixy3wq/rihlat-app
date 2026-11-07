import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { expireHolds, bookingVars } from "@/lib/booking";
import { waSend, fillVars } from "@/lib/wa";
import { addDays } from "@/lib/dates";
export const dynamic = "force-dynamic";

/** يوميًا: تنظيف الحجوزات المنتهية، تذكير رحلات الغد عبر الواتساب، وإقفال المواعيد الماضية */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await expireHolds();
  await prisma.departure.updateMany({ where: { status: "open", startAt: { lt: new Date() } }, data: { status: "done" } });
  const s = await getSettings();
  let sent = 0;
  if (s.wa.enabled && s.wa.autoRemind) {
    const from = new Date(), to = addDays(from, 1.5);
    const list = await prisma.booking.findMany({ where: { status: "paid", departure: { startAt: { gt: from, lt: to } } }, include: { customer: true, trip: true, departure: true } });
    for (const b of list) {
      const done = await prisma.audit.findFirst({ where: { action: "wa.remind", target: b.code } });
      if (done) continue;
      const r = await waSend(s.wa, b.customer.phone, fillVars(s.wa.tplRemind, bookingVars(b, s)));
      await prisma.audit.create({ data: { action: "wa.remind", target: b.code, detail: { ok: r.ok } } });
      if (r.ok) sent++;
    }
  }
  return NextResponse.json({ ok: true, sent });
}
