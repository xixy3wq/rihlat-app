/** كل المبالغ بالهللات. التنسيق للعرض بالأرقام الإنجليزية مع «ر.س» */
export const SAR = "ر.س";
const nf0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function fmtMoney(halalas: number, opts: { symbol?: boolean; force2?: boolean } = {}) {
  const n = (halalas || 0) / 100;
  const s = opts.force2 || n % 1 !== 0 ? nf2.format(n) : nf0.format(n);
  return opts.symbol === false ? s : `${s} ${SAR}`;
}
export const toHalalas = (sar: unknown) => Math.round(Number(String(sar ?? "").replace(/[^\d.]/g, "")) * 100) || 0;
export const toSar = (h: number) => (h || 0) / 100;

/** حساب الضريبة: included = السعر شامل الضريبة (نستخرجها)، وإلا تُضاف فوق المبلغ */
export function vatOf(base: number, rate: number, included: boolean) {
  if (!rate) return { vat: 0, total: base };
  if (included) return { vat: Math.round((base * rate) / (100 + rate)), total: base };
  const vat = Math.round((base * rate) / 100);
  return { vat, total: base + vat };
}
