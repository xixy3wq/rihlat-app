import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/settings";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const site = SITE_URL();
  const trips = await prisma.trip.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } }).catch(() => []);
  return [{ url: site }, { url: `${site}/trips` }, { url: `${site}/about` }, { url: `${site}/contact` }, ...trips.map((t) => ({ url: `${site}/trips/${encodeURIComponent(t.slug)}`, lastModified: t.updatedAt }))];
}
