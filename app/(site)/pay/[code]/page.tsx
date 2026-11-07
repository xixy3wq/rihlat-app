import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings, SITE_URL } from "@/lib/settings";
import { expireHolds } from "@/lib/booking";
import { fmtMoney } from "@/lib/money";
import { fmtDT } from "@/lib/dates";
import PayForm from "@/components/pay-form";
import { waLink } from "@/lib/wa";

export const metadata = { title: "الدفع" };

export default async function PayPage({ params, searchParams }: { params: { code: string }; searchParams: { err?: string } }) {
  await expireHolds().catch(() => {});
  const b = await prisma.booking.findUnique({ where: { code: params.code.toUpperCase() }, include: { trip: true, departure: true, customer: true } });
  if (!b) notFound();
  if (b.status === "paid") redirect(`/booking/${b.code}`);
  const full = await getSettings();
  const s = publicSettings(full);
  const dead = b.status !== "pending" || (b.holdUntil && b.holdUntil < new Date());
  return (
    <div className="wrap section stack-lg" style={{ maxWidth: 980 }}>
      <div className="steps"><Link href={`/trips/${b.trip.slug}`}>{b.trip.title}</Link><i>/</i><span>بيانات الحجز</span><i>/</i><b>الدفع</b><i>/</i><span>التذكرة</span></div>
      <h1 className="display">إتمام الدفع</h1>
      {dead ? (
        <div className="card stack">
          <div className="notice warn">{b.status === "cancelled" ? "هذا الحجز مُلغى." : b.status === "expired" || (b.holdUntil && b.holdUntil < new Date()) ? "انتهت مهلة الدفع وتم تحرير المقاعد. يمكنك إنشاء حجز جديد." : "هذا الحجز غير متاح للدفع."}</div>
          <Link href={`/trips/${b.trip.slug}`} className="btn primary" style={{ width: "fit-content" }}>الحجز من جديد</Link>
        </div>
      ) : (
        <div className="trip-layout">
          <div className="stack-lg">
            {searchParams.err && <div className="notice bad">لم تكتمل عملية الدفع: {decodeURIComponent(searchParams.err)}. يمكنك المحاولة مرة أخرى.</div>}
            <PayForm
              code={b.code} amount={b.total} description={`حجز ${b.code} - ${b.trip.title}`}
              pk={s.payment.pk} ready={s.payment.ready} methods={s.payment.methods} applePayLabel={s.payment.applePayLabel}
              callbackUrl={`${SITE_URL()}/pay/callback`} holdUntil={b.holdUntil?.toISOString() || null}
              allowTransfer={s.payment.allowTransfer} bankInfo={s.payment.bankInfo} whatsapp={s.whatsapp} customer={{ name: b.customer.name, phone: b.customer.phone }}
            />
          </div>
          <aside className="sticky stack">
            <div className="card summary">
              <b>{b.trip.title}</b>
              <span className="small muted">{fmtDT(b.departure.startAt)}</span>
              <hr className="divider" />
              <div className="ln"><span>رقم الحجز</span><b className="num">{b.code}</b></div>
              <div className="ln"><span>المقاعد</span><span>{b.adults} بالغ{b.children ? ` + ${b.children} طفل` : ""}</span></div>
              {b.discount > 0 && <div className="ln"><span>الخصم</span><span className="num">− {fmtMoney(b.discount)}</span></div>}
              {full.vat.enabled && <div className="ln muted"><span>ضريبة القيمة المضافة</span><span className="num">{fmtMoney(b.vat)}</span></div>}
              <div className="ln total"><span>المطلوب دفعه</span><span className="num">{fmtMoney(b.total)}</span></div>
            </div>
            {s.whatsapp && <a className="btn wa block" href={waLink(s.whatsapp, `السلام عليكم، أحتاج مساعدة في دفع الحجز رقم ${b.code}`)} target="_blank" rel="noopener">تحتاج مساعدة؟ واتساب</a>}
          </aside>
        </div>
      )}
    </div>
  );
}
