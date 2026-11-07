import { notFound } from "next/navigation";
import { guard, j } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { departureSeats } from "@/lib/booking";
import TripForm from "@/components/admin/trip-form";

export default async function TripEdit({ params }: { params: { id: string } }) {
  await guard(true);
  const cats = await prisma.category.findMany({ orderBy: { order: "asc" } });
  if (params.id === "new") return <TripForm trip={null} cats={j(cats)} deps={[]} seats={{}} />;
  const t = await prisma.trip.findUnique({ where: { id: params.id }, include: { departures: { orderBy: { startAt: "desc" }, include: { _count: { select: { bookings: { where: { status: "paid" } } } } } } } });
  if (!t) notFound();
  const seats = await departureSeats(t.departures.map((d) => d.id));
  const { departures, ...trip } = t;
  return <TripForm trip={j(trip)} cats={j(cats)} deps={j(departures)} seats={seats} />;
}
