"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtMoney } from "@/lib/money";
import { fmtDay, fmtMon, fmtWeekday, fmtTime, fmtHijri } from "@/lib/dates";
import { Ic } from "./icons";

export type Dep = { id: string; startAt: string; endAt: string | null; capacity: number; left: number; priceAdult: number | null; priceChild: number | null; status: string; note: string | null };
type Trip = { id: string; slug: string; title: string; priceAdult: number; priceChild: number | null; childNote: string | null; maxPerBooking: number };

export const PAY_LABEL: Record<string, string> = { applepay: "Apple Pay", creditcard: "مدى · فيزا · ماستركارد", stcpay: "STC Pay", samsungpay: "Samsung Pay" };

export function Counter({ v, set, min, max }: { v: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <div className="counter">
      <button type="button" onClick={() => set(v - 1)} disabled={v <= min} aria-label="أقل">−</button>
      <b className="num">{v}</b>
      <button type="button" onClick={() => set(v + 1)} disabled={v >= max} aria-label="أكثر">+</button>
    </div>
  );
}

export default function BookBox({ trip, deps, methods, vat }: { trip: Trip; deps: Dep[]; methods: string[]; vat: { enabled: boolean; rate: number; included: boolean } }) {
  const router = useRouter();
  const open = deps.filter((d) => d.status === "open" && d.left > 0);
  const [depId, setDepId] = useState(open[0]?.id || "");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const dep = deps.find((d) => d.id === depId);
  const pa = dep?.priceAdult ?? trip.priceAdult;
  const pc = dep?.priceChild ?? trip.priceChild ?? pa;
  const left = dep?.left ?? 0;
  const maxTotal = Math.min(trip.maxPerBooking, left || trip.maxPerBooking);
  const est = useMemo(() => adults * pa + children * pc, [adults, children, pa, pc]);
  const hasChild = trip.priceChild != null;
  const go = () => router.push(`/book/${trip.slug}?dep=${depId}&a=${adults}&c=${children}`);
  return (
    <div className="card stack" style={{ gap: 16 }}>
      <div className="price"><span className="from">السعر للشخص البالغ</span><b style={{ fontSize: "1.6rem" }}>{fmtMoney(pa)}</b>
        {hasChild && <small>الطفل: {fmtMoney(pc)}{trip.childNote ? ` — ${trip.childNote}` : ""}</small>}
        {vat.enabled && <small>{vat.included ? "شامل ضريبة القيمة المضافة" : `+ ضريبة القيمة المضافة ${vat.rate}%`}</small>}
      </div>
      {deps.length === 0 ? (
        <div className="notice warn">لا توجد مواعيد متاحة حاليًا لهذه الرحلة. تواصل معنا لمعرفة المواعيد القادمة.</div>
      ) : (
        <>
          <div className="stack" style={{ gap: 8 }}>
            <span className="lbl">اختر موعد الانطلاق</span>
            <div className="dep-list">
              {deps.map((d) => {
                const full = d.left <= 0 || d.status !== "open";
                return (
                  <div key={d.id} className={`dep${depId === d.id ? " on" : ""}${full ? " off" : ""}`} onClick={() => !full && setDepId(d.id)} role="radio" aria-checked={depId === d.id}>
                    <div className="cal"><b>{fmtDay(d.startAt)}</b><small>{fmtMon(d.startAt)}</small></div>
                    <div className="d">
                      <b>{fmtWeekday(d.startAt)} · {fmtTime(d.startAt)}</b>
                      <span>{fmtHijri(d.startAt)}{d.priceAdult != null && d.priceAdult !== trip.priceAdult ? ` · ${fmtMoney(d.priceAdult)}` : ""}</span>
                    </div>
                    {full ? <span className="chip bad">مكتمل</span> : d.left <= 5 ? <span className="chip warn">باقي {d.left}</span> : <span className="chip ok">متاح</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <div className="row between"><span><b>البالغون</b><br /><span className="tiny muted">{fmtMoney(pa)} للشخص</span></span><Counter v={adults} set={setAdults} min={1} max={Math.max(1, maxTotal - children)} /></div>
            {hasChild && <div className="row between"><span><b>الأطفال</b><br /><span className="tiny muted">{fmtMoney(pc)} للطفل</span></span><Counter v={children} set={setChildren} min={0} max={Math.max(0, maxTotal - adults)} /></div>}
          </div>
          <div className="summary"><div className="ln total"><span>الإجمالي التقريبي</span><span className="num">{fmtMoney(est)}</span></div></div>
          <button className="btn primary lg block" onClick={go} disabled={!dep || left <= 0}>{Ic.ticket(18)} متابعة الحجز</button>
          <div className="pay-methods">{methods.map((m) => <span className="m" key={m}>{Ic.card(14)} {PAY_LABEL[m] || m}</span>)}</div>
          <p className="tiny muted center">{Ic.shield(12)} دفع آمن ومشفّر · لا نحفظ بيانات بطاقتك</p>
        </>
      )}
    </div>
  );
}
