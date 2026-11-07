"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "@/components/icons";

export default function Login() {
  const router = useRouter();
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <div className="login-box">
      <form className="card stack" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr("");
        const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) { setErr(j.error || "خطأ"); setBusy(false); return; }
        router.replace("/admin"); router.refresh();
      }}>
        <div className="row"><span className="logo-mark">{Ic.sun(20)}</span><h1>لوحة الإدارة</h1></div>
        <div className="field"><label>اسم المستخدم</label><input className="input" dir="ltr" autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div className="field"><label>كلمة المرور</label><input className="input" dir="ltr" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        {err && <div className="notice bad">{err}</div>}
        <button className="btn primary lg" disabled={busy}>دخول</button>
      </form>
    </div>
  );
}
