import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { fmtDT } from "@/lib/dates";
import { toSar } from "@/lib/money";
export const dynamic = "force-dynamic";
/** تصدير الحجوزات CSV (يفتح في Excel) */
export async function GET(req: Request) {
  if (!(await currentUser())) return new Response("unauthorized", { status: 401 });
  const u = new URL(req.url);
  const st = u.searchParams.get("st") || "", trip = u.searchParams.get("trip") || "", dep = u.searchParams.get("dep") || "";
  const list = await prisma.booking.findMany({ where: { ...(st ? { status: st } : {}), ...(trip ? { tripId: trip } : {}), ...(dep ? { departureId: dep } : {}) }, orderBy: { createdAt: "desc" }, take: 5000, include: { customer: true, trip: true, departure: true } });
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["رقم الحجز", "الاسم", "الجوال", "البريد", "الرحلة", "الموعد", "بالغون", "أطفال", "المبلغ", "الخصم", "الضريبة", "الحالة", "طريقة الدفع", "حضر", "ملاحظة", "تاريخ الحجز"].map(esc).join(",")];
  for (const b of list) rows.push([b.code, b.customer.name, b.customer.phone, b.customer.email, b.trip.title, fmtDT(b.departure.startAt), b.adults, b.children, toSar(b.total), toSar(b.discount), toSar(b.vat), b.status, b.payMethod, b.attended ? "نعم" : "", b.note, fmtDT(b.createdAt)].map(esc).join(","));
  return new Response("﻿" + rows.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings.csv"` } });
}
