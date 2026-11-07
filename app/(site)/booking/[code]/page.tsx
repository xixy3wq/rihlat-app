import Link from "next/link";
import { notFound } from "next/navigation";
import QR from "qrcode";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings, SITE_URL } from "@/lib/settings";
import { fmtMoney } from "@/lib/money";
import { fmtDT, fmtHijri, fmtDate, daysUntil } from "@/lib/dates";
import { zatcaQr } from "@/lib/zatca";
import { waLink } from "@/lib/wa";
import { METHOD_AR } from "@/lib/moyasar";
import { Ic } from "@/components/icons";
import ReviewForm from "@/components/review-form";

export const metadata = { title: "تذكرة الحجز" };
const ST: Record<string, [string, string]> = { pending: ["بانتظار الدفع", "warn"], paid: ["مؤكد ومدفوع", "ok"], cancelled: ["مُلغى", "bad"], refunded: ["مُسترجع", "info"], expired: ["منتهي", "bad"] };

export default async function Ticket({ params, searchParams }: { params: { code: string }; searchParams: { paid?: string } }) {
  const b = await prisma.booking.findUnique({ where: { code: params.code.toUpperCase() }, include: { trip: true, departure: true, customer: true, review: true } });
  if (!b) notFound();
  const full = await getSettings();
  const s = publicSettings(full);
  const site = SITE_URL();
  const [st, cls] = ST[b.status] || [b.status, ""];
  const qr = await QR.toDataURL(`${site}/admin/checkin?code=${b.code}`, { margin: 1, width: 300 });
  const invoiceQr = b.status === "paid" && full.vat.enabled && full.vat.number ? await QR.toDataURL(zatcaQr({ seller: s.brand, vatNumber: full.vat.number, at: b.paidAt || b.createdAt, total: b.total, vat: b.vat }), { margin: 1, width: 200 }) : null;
  const extras: any[] = Array.isArray(b.extras) ? (b.extras as any) : [];
  const past = b.departure.startAt < new Date();
  const canCancel = b.status === "paid" && daysUntil(b.departure.startAt) >= full.cancelDays;
  return (
    <div className="wrap section stack-lg" style={{ maxWidth: 760 }}>
      {searchParams.paid && b.status === "paid" && <div className="notice ok">🎉 تم الدفع بنجاح وتأكيد حجزك. احتفظ بهذه الصفحة أو احفظها من الرابط.</div>}
      {b.status === "pending" && <div className="notice warn row between"><span>الحجز بانتظار الدفع{b.payMethod === "transfer" ? " (تحويل بنكي — بانتظار تأكيد الإدارة)" : ""}.</span>{b.payMethod !== "transfer" && <Link href={`/pay/${b.code}`} className="btn sm primary">إتمام الدفع</Link>}</div>}
      <div className="ticket">
        <div className="head">
          <div className="row between"><span className="small" style={{ opacity: .8 }}>تذكرة الحجز</span><span className={`chip ${cls}`}>{st}</span></div>
          <div className="code">{b.code}</div>
          <b style={{ fontSize: "1.2rem" }}>{b.trip.title}</b>
          <span style={{ opacity: .85 }}>{fmtDT(b.departure.startAt)} · {fmtHijri(b.departure.startAt)}</span>
        </div>
        <div className="body">
          <div className="grid-2" style={{ alignItems: "start" }}>
            <div className="kv">
              <span className="k">الاسم</span><span>{b.customer.name}</span>
              <span className="k">الجوال</span><span dir="ltr" style={{ textAlign: "end" }}>{b.customer.phone}</span>
              <span className="k">المقاعد</span><span>{b.adults} بالغ{b.children ? ` + ${b.children} طفل` : ""}</span>
              {extras.map((x) => <span key={x.id} style={{ gridColumn: "1/3" }} className="small muted">+ {x.name} × {x.qty}</span>)}
              <span className="k">المبلغ</span><span className="num">{fmtMoney(b.total)}</span>
              {b.payMethod && <><span className="k">طريقة الدفع</span><span>{METHOD_AR[b.payMethod] || b.payMethod}</span></>}
              {b.trip.meetingPoint && <><span className="k">نقطة التجمع</span><span>{b.trip.meetingPoint}{b.trip.meetingMapUrl && <> · <a href={b.trip.meetingMapUrl} target="_blank" rel="noopener">الخريطة</a></>}</span></>}
              {b.note && <><span className="k">ملاحظتك</span><span>{b.note}</span></>}
            </div>
            {b.status === "paid" && <div className="qr"><img src={qr} alt="QR" /><span className="tiny muted">أبرز هذا الرمز عند الحضور</span></div>}
          </div>
          <div className="row no-print">
            {b.status === "paid" && <a className="btn sm ghost" href={`/api/ics?code=${b.code}`}>{Ic.cal(16)} إضافة للتقويم</a>}
            {s.whatsapp && <a className="btn sm wa" href={waLink(s.whatsapp, `السلام عليكم، بخصوص الحجز رقم ${b.code}`)} target="_blank" rel="noopener">{Ic.wa(16)} تواصل معنا</a>}
            {canCancel && s.whatsapp && <a className="btn sm ghost" href={waLink(s.whatsapp, `السلام عليكم، أرغب بإلغاء الحجز رقم ${b.code} (${b.trip.title})`)} target="_blank" rel="noopener">طلب إلغاء</a>}
            <Link className="btn sm ghost" href={`/trips/${b.trip.slug}`}>صفحة الرحلة</Link>
          </div>
          {b.status === "paid" && (
            <div className="card pad-sm stack" style={{ background: "var(--sunk)", boxShadow: "none" }}>
              <div className="row between"><b>{full.vat.enabled ? "فاتورة ضريبية مبسطة" : "إيصال الدفع"}</b><span className="small muted">{fmtDate(b.paidAt || b.createdAt)}</span></div>
              <div className="kv small">
                <span className="k">البائع</span><span>{s.brand}{full.cr ? ` · س.ت ${full.cr}` : ""}</span>
                {full.vat.number && <><span className="k">الرقم الضريبي</span><span dir="ltr" style={{ textAlign: "end" }}>{full.vat.number}</span></>}
                <span className="k">رقم الفاتورة</span><span>{b.code}</span>
                <span className="k">الإجمالي قبل الخصم</span><span className="num">{fmtMoney(b.subtotal)}</span>
                {b.discount > 0 && <><span className="k">الخصم</span><span className="num">− {fmtMoney(b.discount)}</span></>}
                {full.vat.enabled && <><span className="k">ضريبة القيمة المضافة {full.vat.rate}%</span><span className="num">{fmtMoney(b.vat)}</span></>}
                <span className="k"><b>الإجمالي المدفوع</b></span><b className="num">{fmtMoney(b.total)}</b>
              </div>
              {invoiceQr && <img src={invoiceQr} alt="رمز الفاتورة" style={{ width: 110 }} />}
            </div>
          )}
          {b.status === "paid" && past && !b.review && <ReviewForm code={b.code} />}
          {b.review && <div className="notice ok">شكرًا لتقييمك! سيظهر بعد مراجعته.</div>}
        </div>
      </div>
    </div>
  );
}
