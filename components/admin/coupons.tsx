"use client";
import { useState } from "react";
import { useAct, Modal, F, Confirm } from "./ui";
import { fmtMoney, toSar } from "@/lib/money";
import { fmtDate } from "@/lib/dates";

export default function Coupons({ list, trips }: { list: any[]; trips: any[] }) {
  const { run, busy } = useAct();
  const [c, setC] = useState<any>(null);
  const open = (x?: any) => setC(x ? { ...x, value: x.type === "fixed" ? toSar(x.value) : x.value, minTotal: toSar(x.minTotal), maxUses: x.maxUses ?? "", tripId: x.tripId || "", startsAt: x.startsAt ? x.startsAt.slice(0, 10) : "", endsAt: x.endsAt ? x.endsAt.slice(0, 10) : "" } : { code: "", type: "percent", value: 10, minTotal: 0, maxUses: "", tripId: "", startsAt: "", endsAt: "", active: true });
  return (
    <>
      <div className="adm-head"><h1>كوبونات الخصم</h1><button className="btn primary sm" onClick={() => open()}>+ كوبون</button></div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الكود</th><th>الخصم</th><th>الحد الأدنى</th><th>الاستخدام</th><th>الصلاحية</th><th>الرحلة</th><th>الحالة</th><th></th></tr></thead><tbody>
        {list.map((x) => <tr key={x.id}><td dir="ltr"><b>{x.code}</b></td><td>{x.type === "percent" ? `${x.value}%` : fmtMoney(x.value)}</td><td className="num">{x.minTotal ? fmtMoney(x.minTotal) : "—"}</td><td className="num">{x.used}{x.maxUses ? ` / ${x.maxUses}` : ""}</td><td className="tiny">{x.startsAt ? fmtDate(x.startsAt) : ""}{x.endsAt ? ` ← ${fmtDate(x.endsAt)}` : ""}</td><td className="tiny">{trips.find((t) => t.id === x.tripId)?.title || "الكل"}</td><td><span className={`chip ${x.active ? "ok" : ""}`}>{x.active ? "فعّال" : "موقوف"}</span></td>
          <td className="row"><button className="btn sm ghost" onClick={() => open(x)}>تعديل</button><Confirm text="حذف الكوبون؟" onYes={() => run("coupon.delete", { id: x.id }, "تم الحذف")}>حذف</Confirm></td></tr>)}
        {!list.length && <tr><td colSpan={8} className="center muted">لا توجد كوبونات</td></tr>}
      </tbody></table></div>
      {c && <Modal title={c.id ? "تعديل كوبون" : "كوبون جديد"} onClose={() => setC(null)}>
        <div className="grid-2">
          <F label="الكود"><input className="input" dir="ltr" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value.toUpperCase() })} /></F>
          <F label="النوع"><select className="input" value={c.type} onChange={(e) => setC({ ...c, type: e.target.value })}><option value="percent">نسبة %</option><option value="fixed">مبلغ ثابت (ر.س)</option></select></F>
          <F label="القيمة"><input className="input" type="number" dir="ltr" value={c.value} onChange={(e) => setC({ ...c, value: e.target.value })} /></F>
          <F label="الحد الأدنى للطلب (ر.س)"><input className="input" type="number" dir="ltr" value={c.minTotal} onChange={(e) => setC({ ...c, minTotal: e.target.value })} /></F>
          <F label="أقصى عدد استخدامات"><input className="input" type="number" dir="ltr" value={c.maxUses} onChange={(e) => setC({ ...c, maxUses: e.target.value })} placeholder="بلا حد" /></F>
          <F label="خاص برحلة"><select className="input" value={c.tripId} onChange={(e) => setC({ ...c, tripId: e.target.value })}><option value="">كل الرحلات</option>{trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></F>
          <F label="يبدأ من"><input className="input" type="date" value={c.startsAt} onChange={(e) => setC({ ...c, startsAt: e.target.value })} /></F>
          <F label="ينتهي في"><input className="input" type="date" value={c.endsAt} onChange={(e) => setC({ ...c, endsAt: e.target.value })} /></F>
        </div>
        <label className="switch"><input type="checkbox" checked={!!c.active} onChange={(e) => setC({ ...c, active: e.target.checked })} />فعّال</label>
        <button className="btn primary" disabled={busy} onClick={() => run("coupon.save", { ...c, endsAt: c.endsAt ? `${c.endsAt}T23:59:59+03:00` : "", startsAt: c.startsAt ? `${c.startsAt}T00:00:00+03:00` : "" }).then(() => setC(null))}>حفظ</button>
      </Modal>}
    </>
  );
}
