import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings } from "@/lib/settings";
import { departureSeats, expireHolds } from "@/lib/booking";
import BookForm from "@/components/book-form";
import { currentCustomer, publicCustomer } from "@/lib/customer";

export const metadata = { title: "إتمام الحجز" };

export default async function BookPage({ params, searchParams }: { params: { slug: string }; searchParams: { dep?: string; a?: string; c?: string } }) {
  await expireHolds().catch(() => {});
  const t = await prisma.trip.findUnique({ where: { slug: params.slug }, include: { departures: { where: { status: "open", startAt: { gt: new Date() } }, orderBy: { startAt: "asc" } } } });
  if (!t || t.status !== "published") notFound();
  const dep = t.departures.find((d) => d.id === searchParams.dep) || t.departures[0];
  if (!dep) redirect(`/trips/${t.slug}`);
  const seats = await departureSeats([dep.id]);
  const s = publicSettings(await getSettings());
  const me = await currentCustomer();
  const left = Math.max(0, dep.capacity - (seats[dep.id] || 0));
  return (
    <div className="wrap section stack-lg" style={{ maxWidth: 980 }}>
      <div className="steps"><Link href={`/trips/${t.slug}`}>{t.title}</Link><i>/</i><b>بيانات الحجز</b><i>/</i><span>الدفع</span><i>/</i><span>التذكرة</span></div>
      <h1 className="display">إتمام الحجز</h1>
      <BookForm
        me={me ? publicCustomer(me) : null}
        trip={{ id: t.id, slug: t.slug, title: t.title, cover: t.cover, priceAdult: t.priceAdult, priceChild: t.priceChild, maxPerBooking: t.maxPerBooking, extras: Array.isArray(t.extras) ? (t.extras as any) : [], meetingPoint: t.meetingPoint }}
        dep={{ id: dep.id, startAt: dep.startAt.toISOString(), left, priceAdult: dep.priceAdult, priceChild: dep.priceChild }}
        init={{ a: Math.max(1, parseInt(searchParams.a || "1") || 1), c: Math.max(0, parseInt(searchParams.c || "0") || 0) }}
        s={{ vat: s.vat, methods: s.payment.methods, holdMinutes: s.holdMinutes, brand: s.brand }}
      />
    </div>
  );
}
