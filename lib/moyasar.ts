// بوابة الدفع ميسّر: التحقق من العمليات والاسترجاع من الخادم بالمفتاح السري فقط
const API = "https://api.moyasar.com/v1";

export type MoyasarPayment = {
  id: string; status: string; amount: number; fee?: number; currency: string; refunded?: number; captured?: number;
  description?: string; callback_url?: string; created_at?: string; refunded_at?: string | null;
  source?: { type?: string; company?: string; name?: string; number?: string; mobile?: string; message?: string; transaction_url?: string; gateway_id?: string };
  metadata?: Record<string, string>;
};
export class MoyasarError extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s; } }

async function call(sk: string, method: "GET" | "POST", path: string, body?: unknown) {
  if (!sk) throw new MoyasarError("مفتاح ميسّر السري غير مضبوط في الإعدادات", 500);
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: "Basic " + Buffer.from(`${sk}:`).toString("base64"), Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new MoyasarError(j?.message || j?.errors ? JSON.stringify(j.errors || j.message) : `خطأ من بوابة الدفع (${r.status})`, r.status);
  return j;
}
export const fetchPayment = (sk: string, id: string): Promise<MoyasarPayment> => call(sk, "GET", `/payments/${encodeURIComponent(id)}`);
export const refundPayment = (sk: string, id: string, amount?: number): Promise<MoyasarPayment> =>
  call(sk, "POST", `/payments/${encodeURIComponent(id)}/refund`, amount ? { amount } : {});

export const METHOD_AR: Record<string, string> = {
  creditcard: "بطاقة", mada: "مدى", visa: "فيزا", mastercard: "ماستركارد", amex: "أمريكان إكسبرس",
  applepay: "أبل باي", stcpay: "STC Pay", samsungpay: "سامسونج باي", cash: "نقدًا", transfer: "تحويل بنكي", free: "مجاني",
};
/** اسم طريقة الدفع بالعربية من عملية ميسّر (مثل: «مدى» أو «أبل باي») */
export function methodLabel(p?: { source?: MoyasarPayment["source"] } | null, fallback = "") {
  const t = p?.source?.type || fallback;
  const c = p?.source?.company || "";
  if (t === "creditcard" && c && METHOD_AR[c]) return METHOD_AR[c];
  return METHOD_AR[t] || t || "—";
}
/** قيمة مختصرة لتخزين الطريقة: applepay | stcpay | mada | visa … */
export const methodKey = (p: MoyasarPayment) => (p.source?.type === "creditcard" ? p.source?.company || "creditcard" : p.source?.type || "creditcard");
