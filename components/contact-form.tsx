"use client";
import { useState } from "react";
import { api } from "./book-form";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", phone: "", text: "" });
  const [st, setSt] = useState<"" | "busy" | "ok" | string>("");
  if (st === "ok") return <div className="card notice ok">وصلتنا رسالتك، وسنتواصل معك قريبًا.</div>;
  return (
    <form className="card stack" onSubmit={async (e) => { e.preventDefault(); setSt("busy"); try { await api("/api/contact", f); setSt("ok"); } catch (x: any) { setSt(x.message); } }}>
      <div className="field"><label>الاسم</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="field"><label>رقم الجوال</label><input className="input" required dir="ltr" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div className="field"><label>رسالتك</label><textarea className="input" required value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></div>
      {st && st !== "busy" && <span className="err-msg">{st}</span>}
      <button className="btn primary" disabled={st === "busy"}>إرسال</button>
    </form>
  );
}
