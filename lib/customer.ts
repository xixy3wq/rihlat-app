// حسابات العملاء: الدخول برقم الجوال وكلمة المرور، بجلسة مستقلة عن جلسة الموظفين
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

export const CUST_COOKIE = "rihlat_cust";
/** مفتاح مختلف عن مفتاح الموظفين، فلا تصلح جلسة العميل للوحة الإدارة ولا العكس */
const key = () => {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET مفقود أو أقصر من 32 حرفًا");
  return new TextEncoder().encode(s + ":customer");
};
export async function signCustomer(id: string) {
  return new SignJWT({ k: "c" }).setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuedAt().setExpirationTime("90d").sign(key());
}
/** العميل المسجّل دخوله حاليًا (أو null) */
export async function currentCustomer() {
  const t = cookies().get(CUST_COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    if (payload.k !== "c" || !payload.sub) return null;
    const c = await prisma.customer.findUnique({ where: { id: payload.sub } });
    return c && c.passwordHash ? c : null;
  } catch { return null; }
}
export async function setCustomerCookie(id: string) {
  cookies().set(CUST_COOKIE, await signCustomer(id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90 });
}
export function clearCustomerCookie() {
  cookies().set(CUST_COOKIE, "", { path: "/", maxAge: 0 });
}
/** بيانات آمنة للعرض في المتصفح (بدون كلمة المرور) */
export const publicCustomer = (c: { id: string; name: string; phone: string; email: string | null; city: string | null }) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email || "", city: c.city || "" });
