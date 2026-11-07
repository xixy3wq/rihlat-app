import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";
const ics = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
/** ملف تقويم للحجز */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").toUpperCase();
  const b = await prisma.booking.findUnique({ where: { code }, include: { trip: true, departure: true } });
  if (!b) return new Response("not found", { status: 404 });
  const s = await getSettings();
  const end = b.departure.endAt || new Date(b.departure.startAt.getTime() + Math.max(1, b.trip.durationDays) * 86400000 * (b.trip.durationDays === 1 ? 0.5 : 1));
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${s.brand}//AR`, "BEGIN:VEVENT", `UID:${b.code}@rihlat`, `DTSTAMP:${ics(new Date())}`, `DTSTART:${ics(b.departure.startAt)}`, `DTEND:${ics(end)}`,
    `SUMMARY:${b.trip.title} — ${s.brand}`, `DESCRIPTION:رقم الحجز ${b.code}`, ...(b.trip.meetingPoint ? [`LOCATION:${b.trip.meetingPoint.replace(/\n/g, " ")}`] : []), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return new Response(body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${b.code}.ics"` } });
}
