import Link from "next/link";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { expireHolds } from "@/lib/booking";
import { fmtMoney } from "@/lib/money";
import { fmtShort, fmtDT } from "@/lib/dates";
import { Badge } from "@/components/admin/ui";
import { METHOD_AR } from "@/lib/moyasar";

export default async function Bookings({ searchParams }: { searchParams: { st?: string; q?: string; trip?: string } }) {
  await guard();
  await expireHolds().catch(() => {});
  const q = (searchParams.q || "").trim();
  const st = searchParams.st || "";
  const where: any = {
    ...(st ? { status: st } : {}),
    ...(searchParams.trip ? { tripId: searchParams.trip } : {}),
    ...(q ? { OR: [{ code: { contains: q.toUpperCase() } }, { customer: { name: { contains: q, mode: "insensitive" } } }, { customer: { phone: { contains: q.replace(/\D/g, "") || q } } }] } : {}),
  };
  const [list, trips] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 150, include: { customer: true, trip: { select: { title: true } }, departure: { select: { startAt: true } } } }),
    prisma.trip.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" } }),
  ]);
  const sum = list.filter((b) => b.status === "paid").reduce((a, b) => a + b.total, 0);
  return (
    <>
      <div className="adm-head"><h1>الحجوزات</h1><div className="row"><a className="btn sm ghost" href={`/api/admin/export?st=${st}&trip=${searchParams.trip || ""}`}>تصدير CSV</a><Link href="/admin/bookings/new" className="btn primary sm">+ حجز يدوي</Link></div></div>
      <form className="toolbar" method="get">
        <input className="input" name="q" defaultValue={q} placeholder="رقم الحجز / الاسم / الجوال" />
        <select className="input" name="st" defaultValue={st}><option value="">كل الحالات</option><option value="paid">مدفوع</option><option value="pending">بانتظار الدفع</option><option value="cancelled">ملغى</option><option value="refunded">مسترجع</option><option value="expired">منتهي</option></select>
        <select className="input" name="trip" defaultValue={searchParams.trip || ""}><option value="">كل الرحلات</option>{trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
        <button className="btn sm navy">بحث</button>
        <span className="small muted">{list.length} حجز · المدفوع {fmtMoney(sum)}</span>
      </form>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الرقم</th><th>العميل</th><th>الرحلة</th><th>الموعد</th><th>المقاعد</th><th>المبلغ</th><th>الدفع</th><th>الحالة</th><th>أُنشئ</th></tr></thead><tbody>
        {list.map((b) => (
          <tr key={b.id} className="click">
            <td><Link href={`/admin/bookings/${b.id}`}><b>{b.code}</b></Link></td><td>{b.customer.name}<br /><span className="tiny muted" dir="ltr">{b.customer.phone}</span></td>
            <td className="wrap">{b.trip.title}</td><td>{fmtShort(b.departure.startAt)}</td><td className="num">{b.adults + b.children}</td><td className="num">{fmtMoney(b.total)}</td>
            <td>{b.payMethod ? METHOD_AR[b.payMethod] || b.payMethod : "—"}</td><td><Badge s={b.status} />{b.attended && <span className="chip ok" style={{ marginInlineStart: 4 }}>حضر</span>}</td><td className="tiny muted">{fmtDT(b.createdAt)}</td>
          </tr>
        ))}
        {!list.length && <tr><td colSpan={9} className="center muted">لا توجد نتائج</td></tr>}
      </tbody></table></div>
    </>
  );
}
