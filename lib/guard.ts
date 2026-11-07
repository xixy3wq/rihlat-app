import { redirect } from "next/navigation";
import { currentUser } from "./auth";
/** صفحات الإدارة: يحوّل لصفحة الدخول إذا ما فيه جلسة */
export async function guard(adminOnly = false) {
  const me = await currentUser();
  if (!me) redirect("/admin/login");
  if (adminOnly && me.role !== "admin") redirect("/admin");
  return me;
}
export const j = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
