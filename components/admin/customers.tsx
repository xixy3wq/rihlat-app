"use client";
import { useState } from "react";
import Link from "next/link";
import { useAct, Modal, F } from "./ui";
import { fmtMoney } from "@/lib/money";
import { waLink } from "@/lib/wa";

export default function CustomersTable({ list }: { list: any[] }) {
  const { run, busy } = useAct();
  const [c, setC] = useState<any>(null);
  return (
    <>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الاسم</th><th>الجوال</th><th>المدينة</th><th>حساب</th><th>حجوزات</th><th>إجمالي</th><th></th></tr></thead><tbody>
        {list.map((x) => <tr key={x.id}><td><b>{x.name}</b>{x.note && <span className="tiny muted"> · {x.note}</span>}</td><td dir="ltr"><a href={waLink(x.phone)} target="_blank">{x.phone}</a></td><td>{x.city || "—"}</td><td>{x.hasAccount ? <span className="chip ok">نعم</span> : <span className="muted">—</span>}</td><td className="num"><Link href={`/admin/bookings?q=${x.phone}`}>{x.n}</Link></td><td className="num">{fmtMoney(x.total)}</td><td><button className="btn sm ghost" onClick={() => setC({ ...x })}>تعديل</button></td></tr>)}
        {!list.length && <tr><td colSpan={6} className="center muted">لا يوجد عملاء</td></tr>}
      </tbody></table></div>
      {c && <Modal title="بيانات العميل" onClose={() => setC(null)}>
        <F label="الاسم"><input className="input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></F>
        <F label="البريد"><input className="input" dir="ltr" value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} /></F>
        <F label="المدينة"><input className="input" value={c.city || ""} onChange={(e) => setC({ ...c, city: e.target.value })} /></F>
        <F label="ملاحظة"><textarea className="input" value={c.note || ""} onChange={(e) => setC({ ...c, note: e.target.value })} /></F>
        <button className="btn primary" disabled={busy} onClick={() => run("customer.save", c).then(() => setC(null))}>حفظ</button>
        {c.hasAccount && <button className="btn ghost" disabled={busy} onClick={() => { const p = prompt("كلمة مرور جديدة للعميل (6 أحرف على الأقل)"); if (p) run("customer.setPassword", { id: c.id, password: p }, "تم تغيير كلمة المرور").then(() => setC(null)); }}>تعيين كلمة مرور جديدة</button>}
      </Modal>}
    </>
  );
}
