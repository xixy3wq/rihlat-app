import Link from "next/link";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { expireHolds, departureSeats } from "@/lib/booking";
import { fmtMoney } from "@/lib/money";
import { fmtDT, fmtShort, addDays, localDate, fromLocal } from "@/lib/dates";
import { Badge } from "@/components/admin/ui";

export default async function Dashboard() {
  await guard();
  await expireHolds().catch(() => {});
  const now = new Date(), today = fromLocal(localDate(now)), month = fromLocal(localDate(now).slice(0, 8) + "01");
  const [todayCnt, monthAgg, pending, upcoming, latest, msgs, reviews] = await Promise.all([
    prisma.booking.count({ where: { status: "paid", paidAt: { gte: today } } }),
    prisma.booking.aggregate({ where: { status: "paid", paidAt: { gte: month } }, _sum: { total: true }, _count: true }),
    prisma.booking.count({ where: { status: "pending", payMethod: "transfer" } }),
    prisma.departure.findMany({ where: { status: "open", startAt: { gte: now, lt: addDays(now, 14) } }, include: { trip: { select: { title: true } } }, orderBy: { startAt: "asc" }, take: 8 }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { customer: true, trip: { select: { title: true } } } }),
    prisma.message.count({ where: { read: false } }),
    prisma.review.count({ where: { approved: false } }),
  ]);
  const seats = await departureSeats(upcoming.map((d) => d.id));
  return (
    <>
      <div className="adm-head"><h1>الرئيسية</h1><Link href="/admin/bookings/new" className="btn primary sm">+ حجز يدوي</Link></div>
      <div className="kpis">
        <div className="kpi"><span className="k">حجوزات اليوم (مدفوعة)</span><span className="v">{todayCnt}</span></div>
        <div className="kpi"><span className="k">إيرادات الشهر</span><span className="v num">{fmtMoney(monthAgg._sum.total || 0)}</span><span className="s">{monthAgg._count} حجز</span></div>
        <Link href="/admin/bookings?st=pending" className="kpi" style={{ color: "inherit" }}><span className="k">تحويلات بانتظار التأكيد</span><span className="v">{pending}</span></Link>
        <Link href="/admin/messages" className="kpi" style={{ color: "inherit" }}><span className="k">رسائل جديدة</span><span className="v">{msgs}</span><span className="s">{reviews} تقييم بانتظار الاعتماد</span></Link>
      </div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="row between"><h2>مواعيد الأسبوعين القادمين</h2><Link href="/admin/departures" className="small">الكل</Link></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الرحلة</th><th>الموعد</th><th>المقاعد</th></tr></thead><tbody>
            {upcoming.map((d) => <tr key={d.id} className="click"><td><Link href={`/admin/departures/${d.id}`}>{d.trip.title}</Link></td><td>{fmtShort(d.startAt)}</td><td className="num">{seats[d.id] || 0} / {d.capacity}</td></tr>)}
            {!upcoming.length && <tr><td colSpan={3} className="muted center">لا توجد مواعيد قريبة</td></tr>}
          </tbody></table></div>
        </div>
        <div className="stack">
          <div className="row between"><h2>آخر الحجوزات</h2><Link href="/admin/bookings" className="small">الكل</Link></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الرقم</th><th>العميل</th><th>الرحلة</th><th>الحالة</th></tr></thead><tbody>
            {latest.map((b) => <tr key={b.id}><td><Link href={`/admin/bookings/${b.id}`}>{b.code}</Link></td><td>{b.customer.name}</td><td className="wrap">{b.trip.title}</td><td><Badge s={b.status} /></td></tr>)}
            {!latest.length && <tr><td colSpan={4} className="muted center">لا توجد حجوزات بعد</td></tr>}
          </tbody></table></div>
        </div>
      </div>
    </>
  );
}
