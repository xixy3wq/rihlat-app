// استعلامات القراءة المشتركة للموقع العام
import { prisma } from "./db";
import { departureSeats, expireHolds } from "./booking";

export const TRIP_LIST_INCLUDE = {
  category: true,
  departures: { where: { status: "open", startAt: { gt: new Date() } }, orderBy: { startAt: "asc" as const }, take: 6 },
};

export async function publishedTrips(o: { category?: string; q?: string; featured?: boolean; limit?: number } = {}) {
  await expireHolds().catch(() => {});
  const trips = await prisma.trip.findMany({
    where: {
      status: "published",
      ...(o.featured ? { featured: true } : {}),
      ...(o.category ? { category: { slug: o.category } } : {}),
      ...(o.q ? { OR: [{ title: { contains: o.q, mode: "insensitive" } }, { destination: { contains: o.q, mode: "insensitive" } }, { city: { contains: o.q, mode: "insensitive" } }] } : {}),
    },
    include: { category: true, departures: { where: { status: "open", startAt: { gt: new Date() } }, orderBy: { startAt: "asc" }, take: 6 } },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    take: o.limit || 60,
  });
  const seats = await departureSeats(trips.flatMap((t) => t.departures.map((d) => d.id)));
  return { trips, seats };
}

export async function tripBySlug(slug: string) {
  await expireHolds().catch(() => {});
  const t = await prisma.trip.findUnique({
    where: { slug },
    include: {
      category: true,
      departures: { where: { status: { in: ["open", "closed"] }, startAt: { gt: new Date() } }, orderBy: { startAt: "asc" } },
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!t) return null;
  const seats = await departureSeats(t.departures.map((d) => d.id));
  const agg = await prisma.review.aggregate({ where: { tripId: t.id, approved: true }, _avg: { rating: true }, _count: true });
  return { trip: t, seats, rating: agg._avg.rating || 0, ratingCount: agg._count };
}
