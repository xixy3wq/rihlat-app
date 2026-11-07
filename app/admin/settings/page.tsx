import { guard, j } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { getSettings, adminSettings, SITE_URL } from "@/lib/settings";
import SettingsForm from "@/components/admin/settings-form";

export default async function SettingsPage() {
  const me = await guard(true);
  const [s, users, cats] = await Promise.all([getSettings(), prisma.user.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, username: true, role: true, status: true, lastSeenAt: true } }), prisma.category.findMany({ orderBy: { order: "asc" } })]);
  return <SettingsForm s={adminSettings(s)} users={j(users)} cats={j(cats)} meId={me.id} site={SITE_URL()} hasBlob={!!process.env.BLOB_READ_WRITE_TOKEN} />;
}
