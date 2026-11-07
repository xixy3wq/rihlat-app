import { guard, j } from "@/lib/guard";
import { prisma } from "@/lib/db";
import Coupons from "@/components/admin/coupons";
export default async function Page() {
  await guard(true);
  const [list, trips] = await Promise.all([prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }), prisma.trip.findMany({ select: { id: true, title: true }, where: { status: { not: "archived" } } })]);
  return <Coupons list={j(list)} trips={j(trips)} />;
}
