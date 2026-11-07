// الواتساب: روابط «اضغط للمراسلة» دائمًا، وإرسال تلقائي عبر مزوّد خارجي إذا رُبط في الإعدادات
import type { Settings } from "./settings";

/** رقم دولي بدون + (السعودية افتراضيًا) */
export function intlPhone(p: string) {
  let d = String(p || "").replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("05") && d.length === 10) d = "966" + d.slice(1);
  else if (d.startsWith("5") && d.length === 9) d = "966" + d;
  return d;
}
/** رابط واتساب برسالة جاهزة */
export const waLink = (phone: string, text = "") => `https://wa.me/${intlPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const fillVars = (t: string, v: Record<string, string>) => String(t || "").replace(/\{([^}]+)\}/g, (_, k) => v[k] ?? "");

/** إرسال رسالة واحدة عبر المزوّد الخارجي. المتغيرات في القالب: {phone} {phone0} {message} */
export async function waSend(cfg: Settings["wa"], phone: string, text: string): Promise<{ ok: boolean; resp: string }> {
  const p = intlPhone(phone); if (!p) return { ok: false, resp: "رقم غير صالح" };
  if (!cfg.enabled || !String(cfg.url || "").trim()) return { ok: false, resp: "الإرسال التلقائي غير مفعّل" };
  if (!/^https:\/\//i.test(cfg.url)) return { ok: false, resp: "يجب أن يبدأ رابط الإرسال بـ https://" };
  const p0 = p.startsWith("966") ? "0" + p.slice(3) : p;
  const enc = (s: string) => encodeURIComponent(s);
  const sub = (tpl: string, mode: "url" | "json" | "raw") => tpl
    .replace(/\{phone\}/g, mode === "url" ? enc(p) : p).replace(/\{phone0\}/g, mode === "url" ? enc(p0) : p0)
    .replace(/\{message\}/g, mode === "url" ? enc(text) : mode === "json" ? JSON.stringify(text).slice(1, -1) : text);
  try {
    let r: Response;
    if (cfg.method === "GET") r = await fetch(sub(cfg.url, "url"), { cache: "no-store" });
    else if (cfg.method === "POST_JSON") r = await fetch(cfg.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: sub(cfg.body, "json") });
    else r = await fetch(cfg.url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: sub(cfg.body, "url") });
    const txt = (await r.text()).slice(0, 500);
    const ok = r.ok && (!cfg.okWord || txt.includes(cfg.okWord));
    return { ok, resp: txt };
  } catch (e: any) { return { ok: false, resp: String(e?.message || e) }; }
}
