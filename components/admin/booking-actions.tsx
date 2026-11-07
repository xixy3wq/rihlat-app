"use client";
import { useState } from "react";
import { useAct, Modal, F, act, toast } from "./ui";
import { fmtMoney, toSar } from "@/lib/money";
import { waLink } from "@/lib/wa";
import { Ic } from "../icons";

export default function BookingActions({ b, admin, waEnabled }: { b: any; admin: boolean; waEnabled: boolean }) {
  const { run, busy } = useAct();
  const [note, setNote] = useState(b.adminNote || "");
  const [cancel, setCancel] = useState<null | { refund: string; notify: boolean }>(null);
  const [method, setMethod] = useState("transfer");
  const sendWa = async (which: string) => {
    try { const r = await act("booking.message", { id: b.id, which }); window.open(waLink(r.phone, r.text), "_blank"); } catch (e: any) { toast(e.message, true); }
  };
  return (
    <div className="stack">
      <div className="card stack">
        <h3>إجراءات</h3>
        {b.status === "pending" && (
          <div className="stack" style={{ gap: 6 }}>
            <span className="lbl">تأكيد استلام المبلغ يدويًا</span>
            <div className="row"><select className="input" style={{ width: "auto" }} value={method} onChange={(e) => setMethod(e.target.value)}><option value="transfer">تحويل بنكي</option><option value="cash">نقدًا</option><option value="free">مجاني</option></select>
              <button className="btn sm primary" disabled={busy} onClick={() => run("booking.markPaid", { id: b.id, method }, "تم تأكيد الدفع")}>{Ic.check(14)} تأكيد الدفع</button></div>
          </div>
        )}
        {b.status === "paid" && <button className={`btn sm ${b.attended ? "ghost" : "sea"}`} disabled={busy} onClick={() => run("booking.attend", { id: b.id }, b.attended ? "أُلغي الحضور" : "تم تسجيل الحضور")}>{Ic.check(14)} {b.attended ? "إلغاء تسجيل الحضور" : "تسجيل الحضور"}</button>}
        {["paid", "pending"].includes(b.status) && <button className="btn sm danger" onClick={() => setCancel({ refund: b.status === "paid" ? String(toSar(b.total)) : "0", notify: waEnabled })}>{Ic.x(14)} إلغاء الحجز{b.status === "paid" ? " / استرجاع" : ""}</button>}
        <hr className="divider" />
        <span className="lbl">رسائل واتساب (تفتح المحادثة بالنص الجاهز)</span>
        <div className="row">
          <button className="btn sm wa" onClick={() => sendWa("confirm")}>{Ic.wa(14)} التأكيد</button>
          <button className="btn sm wa" onClick={() => sendWa("remind")}>{Ic.wa(14)} التذكير</button>
          {waEnabled && b.status === "paid" && <button className="btn sm ghost" disabled={busy} onClick={() => run("booking.resend", { id: b.id }, "أُرسلت تلقائيًا")}>إرسال التأكيد تلقائيًا</button>}
        </div>
      </div>
      <div className="card stack">
        <F label="ملاحظة إدارية (لا تظهر للعميل)"><textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} /></F>
        <button className="btn sm ghost" disabled={busy} onClick={() => run("booking.note", { id: b.id, adminNote: note })} style={{ width: "fit-content" }}>حفظ الملاحظة</button>
      </div>
      {cancel && (
        <Modal title="إلغاء الحجز" onClose={() => setCancel(null)}>
          {b.status === "paid" && (
            <F label="المبلغ المسترجع (ر.س)" hint={b.hasGateway ? (admin ? `سيُسترجع عبر بوابة الدفع إلى نفس وسيلة الدفع. المدفوع ${fmtMoney(b.total)}` : "الاسترجاع عبر البوابة للمدير فقط") : "الدفع لم يكن عبر البوابة: الاسترجاع يدوي خارج النظام"}>
              <input className="input" type="number" dir="ltr" value={cancel.refund} onChange={(e) => setCancel({ ...cancel, refund: e.target.value })} disabled={!admin && b.hasGateway} />
            </F>
          )}
          {waEnabled && <label className="switch"><input type="checkbox" checked={cancel.notify} onChange={(e) => setCancel({ ...cancel, notify: e.target.checked })} />إبلاغ العميل عبر الواتساب</label>}
          <button className="btn danger" disabled={busy} onClick={() => run("booking.cancel", { id: b.id, refund: admin ? cancel.refund : 0, notify: cancel.notify }, "تم الإلغاء").then(() => setCancel(null))}>تأكيد الإلغاء</button>
        </Modal>
      )}
    </div>
  );
}
