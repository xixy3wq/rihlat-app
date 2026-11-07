import Link from "next/link";
import { notFound } from "next/navigation";
import { guard, j } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { fmtMoney } from "@/lib/money";
import { fmtDT } from "@/lib/dates";
import { METHOD_AR } from "@/lib/moyasar";
import { Badge } from "@/components/admin/ui";
import BookingActions from "@/components/admin/booking-actions";
import NewBooking from "@/components/admin/new-booking";
import { Ic } from "@/components/icons";

export default async function BookingPage({ params }: { params: { id: string } }) {
  const me = await guard();
  if (params.id === "new") {
    const trips = await prisma.trip.findMany({ where: { status: { not: "archived" } }, orderBy: { title: "asc" }, include: { departures: { where: { startAt: { gt: new Date() } }, orderBy: { startAt: "asc" } } } });
    return <><div className="adm-head"><h1>حجز يدوي</h1></div><NewBooking trips={j(trips)} /></>;
  }
  const b = await prisma.booking.findUnique({ where: { id: params.id }, include: { customer: true, trip: true, departure: true, payments: { orderBy: { createdAt: "desc" } }, coupon: true } });
  if (!b) notFound();
  const s = await getSettings();
  const extras: any[] = Array.isArray(b.extras) ? (b.extras as any) : [];
  return (
    <>
      <div className="adm-head"><div className="row"><Link href="/admin/bookings" className="btn icon sm ghost">{Ic.arrow(16)}</Link><h1>الحجز {b.code}</h1><Badge s={b.status} />{b.attended && <span className="chip ok">حضر</span>}</div>
        <a className="btn sm ghost" href={`/booking/${b.code}`} target="_blank">{Ic.ticket(16)} التذكرة</a></div>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="card stack">
            <h2>{b.trip.title}</h2>
            <div className="kv">
              <span className="k">الموعد</span><span>{fmtDT(b.departure.startAt)}</span>
              <span className="k">العميل</span><span>{b.customer.name} · <span dir="ltr">{b.customer.phone}</span>{b.customer.email && <> · {b.customer.email}</>}</span>
              <span className="k">المقاعد</span><span>{b.adults} بالغ{b.children ? ` + ${b.children} طفل` : ""}</span>
              {extras.map((x) => <span key={x.id} className="small muted" style={{ gridColumn: "1/3" }}>+ {x.name} × {x.qty} = {fmtMoney(x.line ?? x.price * x.qty)}</span>)}
              <span className="k">المجموع</span><span className="num">{fmtMoney(b.subtotal)}</span>
              {b.discount > 0 && <><span className="k">الخصم{b.coupon ? ` (${b.coupon.code})` : ""}</span><span className="num">− {fmtMoney(b.discount)}</span></>}
              {b.vat > 0 && <><span className="k">الضريبة</span><span className="num">{fmtMoney(b.vat)}</span></>}
              <span className="k"><b>الإجمالي</b></span><b className="num">{fmtMoney(b.total)}</b>
              <span className="k">طريقة الدفع</span><span>{b.payMethod ? METHOD_AR[b.payMethod] || b.payMethod : "—"}{b.paidAt && ` · ${fmtDT(b.paidAt)}`}</span>
              <span className="k">المصدر</span><span>{b.source === "admin" ? "يدوي (الإدارة)" : "الموقع"} · {fmtDT(b.createdAt)}</span>
              {b.holdUntil && b.status === "pending" && <><span className="k">محجوز حتى</span><span>{fmtDT(b.holdUntil)}</span></>}
              {b.note && <><span className="k">ملاحظة العميل</span><span>{b.note}</span></>}
            </div>
          </div>
          <div className="card stack">
            <h3>عمليات الدفع</h3>
            {b.payments.length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>المرجع</th><th>المبلغ</th><th>الطريقة</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>
              {b.payments.map((p) => <tr key={p.id}><td dir="ltr" className="tiny">{p.providerId}</td><td className="num">{fmtMoney(p.amount)}{p.refunded > 0 && <span className="tiny muted"> (مسترجع {fmtMoney(p.refunded)})</span>}</td><td>{METHOD_AR[p.method || ""] || p.method || "—"}</td><td>{p.status}{p.message && <span className="tiny muted"> · {p.message}</span>}</td><td className="tiny muted">{fmtDT(p.createdAt)}</td></tr>)}
            </tbody></table></div> : <p className="muted small">لا توجد عمليات عبر بوابة الدفع.</p>}
          </div>
        </div>
        <BookingActions b={j({ id: b.id, code: b.code, status: b.status, total: b.total, attended: b.attended, adminNote: b.adminNote, phone: b.customer.phone, hasGateway: b.payments.some((p) => p.status === "paid" && p.providerId) })} admin={me.role === "admin"} waEnabled={s.wa.enabled} />
      </div>
    </>
  );
}
