import { getSettings } from "@/lib/settings";
export const dynamic = "force-dynamic";

/** ملف تحقق نطاق أبل باي: يُؤخذ من لوحة ميسّر ويُلصق في إعدادات الدفع */
export async function GET() {
  const s = await getSettings();
  const body = s.payment.appleDomainFile || "";
  if (!body) return new Response("not configured", { status: 404 });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
