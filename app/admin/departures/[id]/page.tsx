import Link from "next/link";
import { notFound } from "next/navigation";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fmtDT, fmtHijri } from "@/lib/dates";
import { fmtMoney } from "@/lib/money";
import { Badge } from "@/components/admin/ui";
import AttendToggle from "@/components/admin/attend-toggle";
import { waLink } from "@/lib/wa";
import { Ic } from "@/components/icons";
import PrintBtn from "@/components/admin/print-btn";

export default async function DepPage({ params }: { params: { id: string } }) {
  await guard();
  const d = await prisma.departure.findUnique({ where: { id: params.id }, include: { trip: true, bookings: { where: { status: { in: ["paid", "pending"] } }, orderBy: { createdAt: "asc" }, include: { customer: true } } } });
  if (!d) notFound();
  const paid = d.bookings.filter((b) => b.status === "paid");
  const seats = paid.reduce((a, b) => a + b.adults + b.children, 0);
  const pending = d.bookings.filter((b) => b.status === "pending" && b.holdUntil && b.holdUntil > new Date());
  const attended = paid.filter((b) => b.attended).reduce((a, b) => a + b.adults + b.children, 0);
  return (
    <>
      <div className="adm-head no-print"><div className="row"><Link href="/admin/departures" className="btn icon sm ghost">{Ic.arrow(16)}</Link><h1>{d.trip.title}</h1><Badge s={d.status} /></div>
        <div className="row"><a className="btn sm ghost" href={`/api/admin/export?dep=${d.id}`}>CSV</a><PrintBtn /><Link href={`/admin/trips/${d.tripId}`} className="btn sm ghost">تعديل الرحلة</Link></div></div>
      <div className="print-only"><h1>{d.trip.title}</h1></div>
      <div className="kpis">
        <div className="kpi"><span className="k">الموعد</span><span className="v" style={{ fontSize: "1.1rem" }}>{fmtDT(d.startAt)}</span><span className="s">{fmtHijri(d.startAt)}</span></div>
        <div className="kpi"><span className="k">المقاعد المؤكدة</span><span className="v">{seats} / {d.capacity}</span><span className="s">{paid.length} حجز</span></div>
        <div className="kpi"><span className="k">حضر</span><span className="v">{attended}</span></div>
        <div className="kpi"><span className="k">بانتظار الدفع</span><span className="v">{pending.reduce((a, b) => a + b.adults + b.children, 0)}</span></div>
      </div>
      {d.trip.meetingPoint && <p className="small muted">{Ic.pin(14)} {d.trip.meetingPoint}</p>}
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>#</th><th>الحجز</th><th>الاسم</th><th>الجوال</th><th>المقاعد</th><th>المبلغ</th><th>ملاحظة</th><th className="no-print">حضور</th></tr></thead><tbody>
        {d.bookings.map((b, i) => (
          <tr key={b.id} style={b.status === "pending" ? { opacity: .6 } : undefined}>
            <td className="num">{i + 1}</td><td><Link href={`/admin/bookings/${b.id}`}>{b.code}</Link> {b.status === "pending" && <Badge s="pending" />}</td><td>{b.customer.name}</td>
            <td dir="ltr"><a href={waLink(b.customer.phone)} target="_blank" className="no-print">{b.customer.phone}</a><span className="print-only">{b.customer.phone}</span></td>
            <td className="num">{b.adults}{b.children ? ` + ${b.children}` : ""}</td><td className="num">{fmtMoney(b.total)}</td><td className="wrap tiny">{b.note}</td>
            <td className="no-print">{b.status === "paid" && <AttendToggle id={b.id} attended={b.attended} />}</td>
          </tr>
        ))}
        {!d.bookings.length && <tr><td colSpan={8} className="center muted">لا توجد حجوزات على هذا الموعد</td></tr>}
      </tbody></table></div>
    </>
  );
}
