import Link from "next/link";
import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fmtDT } from "@/lib/dates";
import { Badge } from "@/components/admin/ui";
import AttendToggle from "@/components/admin/attend-toggle";
import { Ic } from "@/components/icons";

export default async function Checkin({ searchParams }: { searchParams: { code?: string } }) {
  await guard();
  const code = (searchParams.code || "").trim().toUpperCase();
  const b = code ? await prisma.booking.findUnique({ where: { code }, include: { customer: true, trip: true, departure: true } }) : null;
  return (
    <>
      <div className="adm-head"><h1>{Ic.qr(24)} تحضير المشاركين</h1></div>
      <p className="small muted">امسح رمز QR من تذكرة العميل بكاميرا الجوال (يفتح هذه الصفحة تلقائيًا)، أو اكتب رقم الحجز.</p>
      <form className="toolbar" method="get"><input className="input" name="code" defaultValue={code} dir="ltr" placeholder="RH-XXXXXX" autoFocus /><button className="btn sm navy">بحث</button></form>
      {code && !b && <div className="notice bad">لا يوجد حجز بهذا الرقم</div>}
      {b && (
        <div className="card stack" style={{ maxWidth: 520, borderInlineStart: `6px solid ${b.status === "paid" ? "var(--ok)" : "var(--bad)"}` }}>
          <div className="row between"><h2>{b.code}</h2><Badge s={b.status} /></div>
          <div className="kv"><span className="k">الاسم</span><b>{b.customer.name}</b><span className="k">الجوال</span><span dir="ltr">{b.customer.phone}</span><span className="k">الرحلة</span><span>{b.trip.title}</span><span className="k">الموعد</span><span>{fmtDT(b.departure.startAt)}</span><span className="k">المقاعد</span><b>{b.adults} بالغ{b.children ? ` + ${b.children} طفل` : ""}</b></div>
          {b.status !== "paid" ? <div className="notice bad">هذا الحجز غير مدفوع — لا يُسمح بالدخول</div> : b.attended ? <div className="notice ok">✓ مسجّل الحضور مسبقًا {b.attendedAt && `(${fmtDT(b.attendedAt)})`}</div> : <div className="notice ok">الحجز صحيح</div>}
          <div className="row">{b.status === "paid" && <AttendToggle id={b.id} attended={b.attended} />}<Link href={`/admin/departures/${b.departureId}`} className="btn sm ghost">كشف الموعد</Link></div>
        </div>
      )}
    </>
  );
}
