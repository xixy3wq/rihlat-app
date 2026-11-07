"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ic } from "./icons";

async function call(body: any) {
  const r = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e: any = new Error(j.error || "حدث خطأ، حاول مرة أخرى"); e.status = r.status; throw e; }
  return j;
}

/** تسجيل الدخول / إنشاء حساب / استعادة كلمة المرور */
export function AccountAuth({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "", claimCode: "", code: "" });
  const [needClaim, setNeedClaim] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      await call({ op: mode, ...f });
      router.replace(next); router.refresh();
    } catch (x: any) {
      if (x.status === 409) setNeedClaim(true);
      setErr(x.message); setBusy(false);
    }
  };
  const go = (m: typeof mode) => { setMode(m); setErr(""); setNeedClaim(false); };
  return (
    <form className="card stack" onSubmit={submit}>
      <h1 className="display">{Ic.user(24)} {mode === "login" ? "تسجيل الدخول" : mode === "register" ? "إنشاء حساب" : "استعادة كلمة المرور"}</h1>
      {mode !== "reset" && (
        <div className="tabs">
          <button type="button" className={mode === "login" ? "on" : ""} onClick={() => go("login")}>دخول</button>
          <button type="button" className={mode === "register" ? "on" : ""} onClick={() => go("register")}>حساب جديد</button>
        </div>
      )}
      {mode === "register" && <div className="field"><label>الاسم الكامل</label><input className="input" required autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>}
      <div className="field"><label>رقم الجوال</label><input className="input" required dir="ltr" inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
      {mode === "register" && <div className="field"><label>البريد الإلكتروني (اختياري)</label><input className="input" type="email" dir="ltr" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>}
      {mode === "reset" && <div className="field"><label>رقم أحد حجوزاتك</label><input className="input" required dir="ltr" placeholder="RH-XXXXXX" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /><span className="hint">تجده في تذكرة الحجز أو رسالة التأكيد.</span></div>}
      <div className="field"><label>{mode === "reset" ? "كلمة المرور الجديدة" : "كلمة المرور"}</label><input className="input" required type="password" dir="ltr" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? undefined : 6} value={f.password} onChange={(e) => set("password", e.target.value)} />{mode !== "login" && <span className="hint">6 أحرف على الأقل</span>}</div>
      {mode === "register" && needClaim && <div className="field"><label>رقم أحد حجوزاتك السابقة</label><input className="input" required dir="ltr" placeholder="RH-XXXXXX" value={f.claimCode} onChange={(e) => set("claimCode", e.target.value.toUpperCase())} /></div>}
      {err && <div className="notice bad">{err}</div>}
      <button className="btn primary lg" disabled={busy}>{busy ? "…" : mode === "login" ? "دخول" : mode === "register" ? "إنشاء الحساب" : "حفظ والدخول"}</button>
      {mode === "login" && <button type="button" className="btn sm ghost" onClick={() => go("reset")} style={{ width: "fit-content", justifySelf: "center" }}>نسيت كلمة المرور؟</button>}
      {mode === "reset" && <button type="button" className="btn sm ghost" onClick={() => go("login")} style={{ width: "fit-content", justifySelf: "center" }}>رجوع لتسجيل الدخول</button>}
      <p className="tiny muted center">الحساب اختياري؛ يمكنك الحجز بدون حساب، ويفيدك الحساب لعرض كل حجوزاتك في مكان واحد.</p>
    </form>
  );
}

/** بيانات الحساب وتغيير كلمة المرور والخروج */
export function AccountProfile({ me }: { me: { name: string; phone: string; email: string; city: string } }) {
  const router = useRouter();
  const [f, setF] = useState({ name: me.name, email: me.email, city: me.city, currentPassword: "", newPassword: "" });
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await call({ op: "update", ...f }); setMsg({ t: "تم الحفظ" }); setF((x) => ({ ...x, currentPassword: "", newPassword: "" })); router.refresh(); }
    catch (x: any) { setMsg({ t: x.message, bad: true }); }
    setBusy(false);
  };
  const logout = async () => { await call({ op: "logout" }).catch(() => {}); router.replace("/"); router.refresh(); };
  return (
    <section className="stack">
      <h2>بياناتي</h2>
      <form className="card stack" onSubmit={save}>
        <div className="grid-2">
          <div className="field"><label>الاسم</label><input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="field"><label>رقم الجوال</label><input className="input" dir="ltr" value={me.phone} readOnly disabled /></div>
          <div className="field"><label>البريد الإلكتروني</label><input className="input" type="email" dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="field"><label>المدينة</label><input className="input" value={f.city} onChange={(e) => set("city", e.target.value)} /></div>
        </div>
        <details><summary className="small bold" style={{ cursor: "pointer" }}>تغيير كلمة المرور</summary>
          <div className="grid-2" style={{ marginTop: 10 }}>
            <div className="field"><label>كلمة المرور الحالية</label><input className="input" type="password" dir="ltr" autoComplete="current-password" value={f.currentPassword} onChange={(e) => set("currentPassword", e.target.value)} /></div>
            <div className="field"><label>كلمة المرور الجديدة</label><input className="input" type="password" dir="ltr" autoComplete="new-password" value={f.newPassword} onChange={(e) => set("newPassword", e.target.value)} /></div>
          </div>
        </details>
        {msg && <div className={`notice ${msg.bad ? "bad" : "ok"}`}>{msg.t}</div>}
        <div className="row between">
          <button className="btn primary" disabled={busy}>حفظ</button>
          <button type="button" className="btn ghost" onClick={logout}>{Ic.logout(16)} تسجيل الخروج</button>
        </div>
      </form>
    </section>
  );
}
