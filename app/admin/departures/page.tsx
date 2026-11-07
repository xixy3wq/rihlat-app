import Link from "next/link";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { departureSeats } from "@/lib/booking";
import { fmtDT } from "@/lib/dates";
import { Badge } from "@/components/admin/ui";

export default async function Departures({ searchParams }: { searchParams: { past?: string } }) {
  await guard();
  const past = searchParams.past === "1";
  const list = await prisma.departure.findMany({ where: past ? { startAt: { lt: new Date() } } : { startAt: { gte: new Date() } }, orderBy: { startAt: past ? "desc" : "asc" }, take: 100, include: { trip: { select: { title: true, id: true } } } });
  const seats = await departureSeats(list.map((d) => d.id));
  return (
    <>
      <div className="adm-head"><h1>المواعيد</h1><div className="row"><Link href="/admin/departures" className={`btn sm ${!past ? "navy" : "ghost"}`}>القادمة</Link><Link href="/admin/departures?past=1" className={`btn sm ${past ? "navy" : "ghost"}`}>السابقة</Link></div></div>
      <p className="small muted">لإضافة موعد: افتح الرحلة ← تبويب «المواعيد».</p>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الموعد</th><th>الرحلة</th><th>المحجوز / السعة</th><th>الحالة</th></tr></thead><tbody>
        {list.map((d) => { const n = seats[d.id] || 0; return (
          <tr key={d.id} className="click"><td><Link href={`/admin/departures/${d.id}`}><b>{fmtDT(d.startAt)}</b></Link></td><td className="wrap">{d.trip.title}</td>
            <td className="num"><span className={`chip ${n >= d.capacity ? "bad" : n >= d.capacity * 0.8 ? "warn" : "ok"}`}>{n} / {d.capacity}</span></td><td><Badge s={d.status} /></td></tr>); })}
        {!list.length && <tr><td colSpan={4} className="center muted">لا توجد مواعيد</td></tr>}
      </tbody></table></div>
    </>
  );
}
