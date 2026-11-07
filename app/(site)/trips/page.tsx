import Link from "next/link";
import { prisma } from "@/lib/db";
import { publishedTrips } from "@/lib/data";
import { TripCard } from "@/components/site";
import { Ic } from "@/components/icons";

export const metadata = { title: "الرحلات" };

export default async function Trips({ searchParams }: { searchParams: { cat?: string; q?: string } }) {
  const cat = searchParams.cat || "";
  const q = (searchParams.q || "").trim().slice(0, 60);
  const [{ trips, seats }, cats] = await Promise.all([publishedTrips({ category: cat || undefined, q: q || undefined }), prisma.category.findMany({ orderBy: { order: "asc" } })]);
  const cur = cats.find((c) => c.slug === cat);
  return (
    <div className="wrap section stack-lg">
      <div className="stack">
        <h1 className="display">{cur ? `${cur.icon} رحلات ${cur.name}` : "كل الرحلات"}</h1>
        <form className="row" action="/trips" method="get">
          {cat && <input type="hidden" name="cat" value={cat} />}
          <input className="input" name="q" defaultValue={q} placeholder="ابحث عن وجهة أو رحلة…" style={{ maxWidth: 360 }} />
          <button className="btn navy">{Ic.search(16)} بحث</button>
        </form>
        <div className="cats">
          <Link href="/trips" className={`cat${!cat ? " on" : ""}`}><span className="ic">✨</span>الكل</Link>
          {cats.map((c) => <Link key={c.id} href={`/trips?cat=${c.slug}`} className={`cat${cat === c.slug ? " on" : ""}`}><span className="ic">{c.icon}</span>{c.name}</Link>)}
        </div>
      </div>
      {trips.length ? (
        <div className="trips">{trips.map((t) => <TripCard key={t.id} t={t} seats={seats} />)}</div>
      ) : (
        <div className="card empty"><span className="big">🔍</span><b>لا توجد رحلات مطابقة</b><Link href="/trips" className="btn sm">عرض كل الرحلات</Link></div>
      )}
    </div>
  );
}
