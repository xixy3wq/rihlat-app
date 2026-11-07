"use client";
import { useEffect, useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ic } from "../icons";

/** استدعاء عمليات الإدارة: { op, ...data } */
export async function act(op: string, data: any = {}) {
  const r = await fetch("/api/admin/act", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...data }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "حدث خطأ");
  return j;
}

let pushToast: (m: string, bad?: boolean) => void = () => {};
export const toast = (m: string, bad = false) => pushToast(m, bad);
export function Toaster() {
  const [t, setT] = useState<{ m: string; bad: boolean } | null>(null);
  useEffect(() => { pushToast = (m, bad = false) => { setT({ m, bad }); setTimeout(() => setT(null), 3000); }; }, []);
  return t ? <div className={`toast${t.bad ? " bad" : ""}`}>{t.m}</div> : null;
}
/** ينفّذ عملية ويعرض النتيجة ويحدّث الصفحة */
export function useAct() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async (op: string, data: any = {}, okMsg = "تم الحفظ") => {
    setBusy(true);
    try { const r = await act(op, data); if (okMsg) toast(okMsg); router.refresh(); return r; }
    catch (e: any) { toast(e.message, true); throw e; }
    finally { setBusy(false); }
  };
  return { run, busy };
}

export function AdmNav({ links }: { links: { href: string; label: string; icon: keyof typeof Ic }[] }) {
  const p = usePathname();
  return <>{links.map((l) => <Link key={l.href} href={l.href} className={(l.href === "/admin" ? p === "/admin" : p.startsWith(l.href)) ? "on" : ""}>{(Ic as any)[l.icon](17)} {l.label}</Link>)}</>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h2>{title}</h2><button className="btn icon sm" onClick={onClose} aria-label="إغلاق">{Ic.x(16)}</button></div>
        {children}
      </div>
    </div>
  );
}
export const F = ({ label, children, hint, span }: { label: string; children: React.ReactNode; hint?: string; span?: boolean }) => (
  <div className="field" style={span ? { gridColumn: "1/-1" } : undefined}><label>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>
);
export function Confirm({ text, onYes, children, className = "btn sm danger" }: { text: string; onYes: () => void; children: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={() => { if (confirm(text)) onYes(); }}>{children}</button>;
}
export const ST_AR: Record<string, [string, string]> = { pending: ["بانتظار الدفع", "warn"], paid: ["مدفوع", "ok"], cancelled: ["ملغى", "bad"], refunded: ["مسترجع", "info"], expired: ["منتهي", ""], open: ["مفتوح", "ok"], closed: ["مغلق", "warn"], done: ["انتهى", ""], draft: ["مسودة", "warn"], published: ["منشورة", "ok"], archived: ["مؤرشفة", ""] };
export const Badge = ({ s }: { s: string }) => { const [t, c] = ST_AR[s] || [s, ""]; return <span className={`chip ${c}`}>{t}</span>; };
