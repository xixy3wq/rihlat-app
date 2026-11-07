import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin, handle, fail } from "@/lib/auth";
export const dynamic = "force-dynamic";

/** رفع صورة إلى مخزن Vercel Blob (يحتاج BLOB_READ_WRITE_TOKEN في المشروع) */
export async function POST(req: Request) {
  return handle(async () => {
    await requireAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) fail("مخزن الصور غير مربوط بعد: في Vercel افتح Storage ثم Create → Blob واربطه بالمشروع. يمكنك مؤقتًا لصق رابط صورة.");
    const fd = await req.formData();
    const f = fd.get("file") as File | null;
    if (!f || !f.size) fail("اختر صورة");
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(f.type)) fail("الصيغة غير مدعومة (JPG, PNG, WEBP)");
    if (f.size > 8 * 1024 * 1024) fail("حجم الصورة أكبر من 8MB");
    const ext = f.type.split("/")[1].replace("jpeg", "jpg");
    const r = await put(`trips/${Date.now()}.${ext}`, f, { access: "public", addRandomSuffix: true, contentType: f.type });
    return { url: r.url };
  });
}
