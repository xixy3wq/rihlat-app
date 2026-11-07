import { PrismaClient } from "@prisma/client";
/** رابط القاعدة: DATABASE_URL أو أي متغير آخر قيمته رابط Postgres (حسب تسمية تكامل Neon) */
export function dbUrl() {
  const e = process.env;
  if (e.DATABASE_URL) return e.DATABASE_URL;
  const pg = Object.entries(e).filter(([, v]) => /^postgres(ql)?:\/\//.test(v || ""));
  return pg.find(([k]) => /PRISMA_URL$/.test(k))?.[1] || pg.find(([k]) => /(^|_)URL$/.test(k))?.[1] || pg[0]?.[1];
}
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ log: ["error"], datasourceUrl: dbUrl() });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
