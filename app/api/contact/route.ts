import { handle, fail, str, cleanPhone } from "@/lib/auth";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  return handle(async () => {
    const b = await req.json().catch(() => ({}));
    const name = str(b.name, 80), phone = cleanPhone(b.phone), text = str(b.text, 1000);
    if (name.length < 2 || phone.length < 9 || text.length < 3) fail("يرجى تعبئة كل الحقول");
    const recent = await prisma.message.count({ where: { phone, createdAt: { gt: new Date(Date.now() - 3600000) } } });
    if (recent >= 3) fail("تم استلام رسائلك، سنتواصل معك قريبًا");
    await prisma.message.create({ data: { name, phone, text } });
    return { ok: true };
  });
}
