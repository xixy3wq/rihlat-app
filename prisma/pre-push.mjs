// يُشغَّل قبل prisma db push: يجهّز التعديلات اللي يرفضها db push بدون موافقة (مثل إضافة فهرس فريد).
// كل خطوة مستقلة، وأي خطوة تفشل (مثلًا الجدول غير موجود في أول تشغيل) تُتجاهل.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const steps = [];
try {
  for (const q of steps) {
    try { await prisma.$executeRawUnsafe(q); console.log("PRE_PUSH ok:", q.slice(0, 40)); }
    catch (e) { console.warn("PRE_PUSH skip:", q.slice(0, 40), "-", String(e.message).split("\n").pop()); }
  }
} finally {
  await prisma.$disconnect();
}
