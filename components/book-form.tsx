"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fmtMoney } from "@/lib/money";
import { fmtDT, fmtHijri } from "@/lib/dates";
import { Counter, PAY_LABEL } from "./book-box";
import { Ic } from "./icons";

type Extra = { id: string; name: string; price: number; perPerson?: boolean };
type Props = {
  trip: { id: string; slug: string; title: string; cover: string | null; priceAdult: number; priceChild: number | null; maxPerBooking: number; extras: Extra[]; meetingPoint: string | null };
  dep: { id: string; startAt: string; left: number; priceAdult: number | null; priceChild: number | null };
  init: { a: number; c: number };
  s: { vat: { enabled: boolean; rate: number; included: boolean }; methods: string[]; holdMinutes: number; brand: string };
  me?: { name: string; phone: string; email: string; city: string } | null;
};

export async function api(url: string, body: any) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "حدث خطأ، حاول مرة أخرى");
  return j;
}

export default function BookForm({ trip, dep, init, s, me }: Props) {
  const router = useRouter();
  const maxTotal = Math.min(trip.maxPerBooking, dep.left || 1);
  const [adults, setAdults] = useState(Math.min(init.a, maxTotal));
  const [children, setChildren] = useState(trip.priceChild != null ? Math.min(init.c, Math.max(0, maxTotal - init.a)) : 0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [coupon, setCoupon] = useState("");
  const [couponIn, setCouponIn] = useState("");
  const [f, setF] = useState({ name: me?.name || "", phone: me?.phone || "", email: me?.email || "", city: me?.city || "", note: "", agree: false });
  const [q, setQ] = useState<any>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<any>(null);

  const extras = Object.entries(picks).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ id, qty }));
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      api("/api/quote", { departureId: dep.id, adults, children, extras, coupon }).then(setQ).catch((e) => setErr(e.message));
    }, 150);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adults, children, JSON.stringify(extras), coupon]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!f.agree) return setErr("يجب الموافقة على الشروط والأحكام");
    setBusy(true);
    try {
      const r = await api("/api/book", { departureId: dep.id, adults, children, extras, coupon, ...f });
      router.push(r.status === "paid" ? `/booking/${r.code}` : `/pay/${r.code}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  };
  const persons = adults + children;
  return (
    <form className="trip-layout" onSubmit={submit}>
      <div className="stack-lg">
        <section className="card stack">
          <h2>المقاعد</h2>
          <div className="row between"><span><b>البالغون</b></span><Counter v={adults} set={setAdults} min={1} max={Math.max(1, maxTotal - children)} /></div>
          {trip.priceChild != null && <div className="row between"><span><b>الأطفال</b></span><Counter v={children} set={setChildren} min={0} max={Math.max(0, maxTotal - adults)} /></div>}
          <p className="hint">المتبقي في هذا الموعد: {dep.left} مقعد · الحد الأقصى للحجز الواحد {trip.maxPerBooking}</p>
        </section>
        {trip.extras.length > 0 && (
          <section className="card stack">
            <h2>إضافات اختيارية</h2>
            {trip.extras.map((x) => (
              <div key={x.id} className="row between">
                <span><b>{x.name}</b><br /><span className="tiny muted">{fmtMoney(x.price)}{x.perPerson ? " لكل شخص" : ""}</span></span>
                {x.perPerson ? (
                  <label className="switch"><input type="checkbox" checked={!!picks[x.id]} onChange={(e) => setPicks({ ...picks, [x.id]: e.target.checked ? persons : 0 })} />إضافة</label>
                ) : (
                  <Counter v={picks[x.id] || 0} set={(n) => setPicks({ ...picks, [x.id]: n })} min={0} max={20} />
                )}
              </div>
            ))}
          </section>
        )}
        <section className="card stack">
          <div className="row between"><h2>بياناتك</h2>{me ? <span className="chip ok">مسجّل الدخول</span> : <Link href={`/account?next=${encodeURIComponent(`/book/${trip.slug}?dep=${dep.id}&a=${adults}&c=${children}`)}`} className="small">لديك حساب؟ سجّل الدخول</Link>}</div>
          <div className="grid-2">
            <div className="field"><label>الاسم الكامل *</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="الاسم الثلاثي" /></div>
            <div className="field"><label>رقم الجوال (واتساب) *</label><input className="input" required inputMode="tel" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05xxxxxxxx" readOnly={!!me} /></div>
            <div className="field"><label>البريد الإلكتروني</label><input className="input" type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="اختياري" /></div>
            <div className="field"><label>المدينة</label><input className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="اختياري" /></div>
          </div>
          <div className="field"><label>ملاحظات</label><textarea className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="أي طلب خاص أو ملاحظة للمنظّم (اختياري)" /></div>
          <label className="switch"><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} /><span>أوافق على <Link href="/terms" target="_blank">الشروط والأحكام</Link> و<Link href="/refund-policy" target="_blank">سياسة الإلغاء</Link></span></label>
        </section>
      </div>
      <aside className="sticky stack">
        <div className="card stack">
          <div className="row" style={{ gap: 12 }}>
            {trip.cover && <img src={trip.cover} alt="" style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8 }} />}
            <div><b>{trip.title}</b><br /><span className="small muted">{fmtDT(dep.startAt)}</span><br /><span className="tiny muted">{fmtHijri(dep.startAt)}</span></div>
          </div>
          <hr className="divider" />
          <div className="field">
            <label>كود الخصم</label>
            <div className="row" style={{ gap: 6 }}>
              <input className="input" dir="ltr" value={couponIn} onChange={(e) => setCouponIn(e.target.value.toUpperCase())} placeholder="اختياري" style={{ flex: 1 }} />
              <button type="button" className="btn sm" onClick={() => setCoupon(couponIn.trim())}>تطبيق</button>
            </div>
            {q?.couponError && <span className="err-msg">{q.couponError}</span>}
            {q?.couponCode && !q?.couponError && <span className="ok-msg">تم تطبيق الكود {q.couponCode}</span>}
          </div>
          {q ? (
            <div className="summary">
              <div className="ln"><span>{adults} بالغ × {fmtMoney(q.priceAdult)}</span><span className="num">{fmtMoney(adults * q.priceAdult)}</span></div>
              {children > 0 && <div className="ln"><span>{children} طفل × {fmtMoney(q.priceChild)}</span><span className="num">{fmtMoney(children * q.priceChild)}</span></div>}
              {q.extras.map((x: any) => <div className="ln" key={x.id}><span>{x.name} × {x.qty}</span><span className="num">{fmtMoney(x.line)}</span></div>)}
              {q.discount > 0 && <div className="ln" style={{ color: "var(--ok)" }}><span>الخصم</span><span className="num">− {fmtMoney(q.discount)}</span></div>}
              {s.vat.enabled && <div className="ln muted"><span>ضريبة القيمة المضافة {s.vat.rate}% {s.vat.included ? "(مشمولة)" : ""}</span><span className="num">{fmtMoney(q.vat)}</span></div>}
              <div className="ln total"><span>الإجمالي</span><span className="num">{fmtMoney(q.total)}</span></div>
            </div>
          ) : <div className="skeleton" style={{ height: 80 }} />}
          {err && <div className="notice bad">{err}</div>}
          <button className="btn primary lg block" disabled={busy || !q}>{busy ? "جارٍ الحجز…" : <>{Ic.card(18)} متابعة إلى الدفع</>}</button>
          <div className="pay-methods">{s.methods.map((m) => <span className="m" key={m}>{PAY_LABEL[m] || m}</span>)}</div>
          <p className="tiny muted center">سيتم حجز المقاعد لك لمدة {s.holdMinutes} دقيقة لإتمام الدفع</p>
        </div>
      </aside>
    </form>
  );
}
