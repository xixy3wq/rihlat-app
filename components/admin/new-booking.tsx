"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAct, F } from "./ui";
import { fmtDT } from "@/lib/dates";

export default function NewBooking({ trips }: { trips: any[] }) {
  const router = useRouter();
  const { run, busy } = useAct();
  const [f, setF] = useState({ tripId: trips[0]?.id || "", departureId: trips[0]?.departures[0]?.id || "", adults: 1, children: 0, name: "", phone: "", email: "", note: "", coupon: "", payMethod: "cash", markPaid: true });
  const trip = trips.find((t) => t.id === f.tripId);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="card form" style={{ maxWidth: 720 }}>
      <div className="grid-2">
        <F label="الرحلة"><select className="input" value={f.tripId} onChange={(e) => { const t = trips.find((x) => x.id === e.target.value); setF({ ...f, tripId: e.target.value, departureId: t?.departures[0]?.id || "" }); }}>{trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></F>
        <F label="الموعد"><select className="input" value={f.departureId} onChange={(e) => set("departureId", e.target.value)}>{(trip?.departures || []).map((d: any) => <option key={d.id} value={d.id}>{fmtDT(d.startAt)} ({d.status})</option>)}</select></F>
        <F label="بالغون"><input className="input" type="number" min={1} value={f.adults} onChange={(e) => set("adults", +e.target.value)} /></F>
        <F label="أطفال"><input className="input" type="number" min={0} value={f.children} onChange={(e) => set("children", +e.target.value)} /></F>
        <F label="اسم العميل"><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></F>
        <F label="الجوال"><input className="input" dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></F>
        <F label="البريد"><input className="input" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} /></F>
        <F label="كود خصم"><input className="input" dir="ltr" value={f.coupon} onChange={(e) => set("coupon", e.target.value)} /></F>
        <F label="طريقة الدفع"><select className="input" value={f.payMethod} onChange={(e) => set("payMethod", e.target.value)}><option value="cash">نقدًا</option><option value="transfer">تحويل بنكي</option><option value="free">مجاني / دعوة</option></select></F>
        <F label="الحالة"><label className="switch" style={{ marginTop: 10 }}><input type="checkbox" checked={f.markPaid} onChange={(e) => set("markPaid", e.target.checked)} />تم استلام المبلغ (مؤكد)</label></F>
        <F label="ملاحظة" span><input className="input" value={f.note} onChange={(e) => set("note", e.target.value)} /></F>
      </div>
      <button className="btn primary" disabled={busy || !f.departureId} onClick={() => run("booking.create", f, "تم إنشاء الحجز").then((r) => router.push(`/admin/bookings/${r.id}`))}>إنشاء الحجز</button>
    </div>
  );
}
