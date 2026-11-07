// بناء النشر: يضبط متغيرات القاعدة مهما كانت تسميتها من تكامل Neon ثم يشغّل خطوات البناء بالترتيب
import { spawnSync } from "child_process";
const e = process.env;
e.DATABASE_URL ||= e.POSTGRES_PRISMA_URL || e.POSTGRES_URL || "";
e.DATABASE_URL_UNPOOLED ||= e.POSTGRES_URL_NON_POOLING || (e.DATABASE_URL || "").replace("-pooler.", ".");
if (!e.DATABASE_URL) { console.error("DATABASE_URL مفقود: اربط قاعدة Neon بالمشروع من Vercel ← Storage"); process.exit(1); }
for (const cmd of ["prisma generate", "node prisma/pre-push.mjs", "prisma db push --skip-generate", "node prisma/ensure-admin.mjs", "node prisma/seed-demo.mjs", "next build"]) {
  console.log("▶", cmd);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit", env: e });
  if (r.status) process.exit(r.status);
}
