import Link from "next/link";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fmtMoney } from "@/lib/money";
import { fmtShort } from "@/lib/dates";
import { Badge } from "@/components/admin/ui";
import { COVER_FALLBACK } from "@/components/site";

export default async function TripsAdmin() {
  await guard();
  const trips = await prisma.trip.findMany({ orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }], include: { category: true, departures: { where: { startAt: { gt: new Date() }, status: "open" }, orderBy: { startAt: "asc" }, take: 1 }, _count: { select: { bookings: { where: { status: "paid" } } } } } });
  return (
    <>
      <div className="adm-head"><h1>الرحلات</h1><Link href="/admin/trips/new" className="btn primary sm">+ رحلة جديدة</Link></div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th></th><th>الرحلة</th><th>التصنيف</th><th>السعر</th><th>أقرب موعد</th><th>حجوزات</th><th>الحالة</th></tr></thead><tbody>
        {trips.map((t) => (
          <tr key={t.id} className="click">
            <td><img src={t.cover || COVER_FALLBACK} alt="" style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6 }} /></td>
            <td className="wrap"><Link href={`/admin/trips/${t.id}`}><b>{t.title}</b></Link>{t.featured && <span className="chip accent" style={{ marginInlineStart: 6 }}>مميزة</span>}</td>
            <td>{t.category ? `${t.category.icon} ${t.category.name}` : "—"}</td><td className="num">{fmtMoney(t.priceAdult)}</td>
            <td>{t.departures[0] ? fmtShort(t.departures[0].startAt) : <span className="muted">لا يوجد</span>}</td><td className="num">{t._count.bookings}</td><td><Badge s={t.status} /></td>
          </tr>
        ))}
        {!trips.length && <tr><td colSpan={7} className="center muted">لا توجد رحلات بعد — أضف أول رحلة</td></tr>}
      </tbody></table></div>
    </>
  );
}
