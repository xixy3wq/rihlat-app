// بناء النشر: يضبط متغيرات القاعدة مهما كانت تسميتها من تكامل Neon ثم يشغّل خطوات البناء بالترتيب
import { spawnSync } from "child_process";
const e = process.env;
// أي متغير قيمته رابط Postgres يُقبل، مهما كانت تسميته (DATABASE_URL أو POSTGRES_URL أو ببادئة مخصصة)
const pg = Object.entries(e).filter(([, v]) => /^postgres(ql)?:\/\//.test(v || ""));
const pick = (re) => pg.find(([k]) => re.test(k))?.[1];
e.DATABASE_URL ||= pick(/^DATABASE_URL$/) || pick(/PRISMA_URL$/) || pick(/(^|_)URL$/) || pg[0]?.[1] || "";
e.DATABASE_URL_UNPOOLED ||= pick(/UNPOOLED|NON_POOLING/) || e.DATABASE_URL.replace("-pooler.", ".");
if (!e.DATABASE_URL) { console.error("DATABASE_URL مفقود: اربط قاعدة Neon بالمشروع من Vercel ← Storage"); process.exit(1); }
for (const cmd of ["prisma generate", "node prisma/pre-push.mjs", "prisma db push --skip-generate", "node prisma/ensure-admin.mjs", "node prisma/seed-demo.mjs", "next build"]) {
  console.log("▶", cmd);
  const r = spawnSync(cmd, { shell: true, stdio: "inherit", env: e });
  if (r.status) process.exit(r.status);
}
