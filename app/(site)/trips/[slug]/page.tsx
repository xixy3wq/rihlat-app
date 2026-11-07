import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { tripBySlug } from "@/lib/data";
import { getSettings, publicSettings } from "@/lib/settings";
import { fmtMoney } from "@/lib/money";
import { Ic, Stars } from "@/components/icons";
import { COVER_FALLBACK } from "@/components/site";
import BookBox from "@/components/book-box";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const t = await prisma.trip.findUnique({ where: { slug: params.slug }, select: { title: true, summary: true, cover: true } });
  if (!t) return {};
  return { title: t.title, description: t.summary || undefined, openGraph: { title: t.title, description: t.summary || undefined, images: t.cover ? [t.cover] : [] } };
}

export default async function TripPage({ params }: { params: { slug: string } }) {
  const r = await tripBySlug(params.slug);
  if (!r || r.trip.status !== "published") notFound();
  const { trip: t, seats, rating, ratingCount } = r;
  const s = publicSettings(await getSettings());
  prisma.trip.update({ where: { id: t.id }, data: { views: { increment: 1 } } }).catch(() => {});
  const imgs = [t.cover, ...t.images].filter(Boolean) as string[];
  const itin: { title: string; items: string[] }[] = Array.isArray(t.itinerary) ? (t.itinerary as any) : [];
  const faq: { q: string; a: string }[] = Array.isArray(t.faq) ? (t.faq as any) : [];
  const deps = t.departures.map((d) => ({ id: d.id, startAt: d.startAt.toISOString(), endAt: d.endAt?.toISOString() || null, capacity: d.capacity, left: Math.max(0, d.capacity - (seats[d.id] || 0)), priceAdult: d.priceAdult, priceChild: d.priceChild, status: d.status, note: d.note }));
  return (
    <div className="wrap section stack-lg">
      <div className="steps"><Link href="/">الرئيسية</Link><i>/</i><Link href="/trips">الرحلات</Link>{t.category && <><i>/</i><Link href={`/trips?cat=${t.category.slug}`}>{t.category.name}</Link></>}</div>
      <div className={`gallery${imgs.length <= 1 ? " one" : ""}`}>
        {(imgs.length ? imgs : [COVER_FALLBACK]).slice(0, 3).map((u, i) => <div className="g" key={i}><img src={u} alt={`${t.title} ${i + 1}`} /></div>)}
      </div>
      <div className="trip-layout">
        <div className="stack-lg">
          <div className="stack" style={{ gap: 8 }}>
            <div className="row">
              {t.category && <span className="chip accent">{t.category.icon} {t.category.name}</span>}
              {ratingCount > 0 && <span className="chip gold"><Stars n={rating} /> {rating.toFixed(1)} ({ratingCount})</span>}
            </div>
            <h1 className="display">{t.title}</h1>
            {t.subtitle && <p className="muted" style={{ fontSize: "1.05rem" }}>{t.subtitle}</p>}
          </div>
          <div className="facts">
            {t.destination && <div className="fact"><span className="k">الوجهة</span><span className="v">{t.destination}</span></div>}
            <div className="fact"><span className="k">المدة</span><span className="v">{t.durationLabel || (t.durationDays === 1 ? "يوم واحد" : `${t.durationDays} أيام`)}</span></div>
            {t.city && <div className="fact"><span className="k">الانطلاق من</span><span className="v">{t.city}</span></div>}
            {t.startTime && <div className="fact"><span className="k">وقت الانطلاق</span><span className="v">{t.startTime}</span></div>}
            {t.minAge != null && <div className="fact"><span className="k">الحد الأدنى للعمر</span><span className="v">{t.minAge} سنة</span></div>}
          </div>
          {t.description && <section className="stack"><h2>عن الرحلة</h2><div className="prose">{t.description.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div></section>}
          {itin.length > 0 && (
            <section className="stack"><h2>برنامج الرحلة</h2>
              <div className="itin">
                {itin.map((d, i) => (
                  <div className="day" key={i}><div className="dot">{i + 1}</div><div><b>{d.title}</b>{d.items?.length > 0 && <ul>{d.items.map((x, j) => <li key={j}>{x}</li>)}</ul>}</div></div>
                ))}
              </div>
            </section>
          )}
          {(t.includes.length > 0 || t.excludes.length > 0) && (
            <section className="grid-2">
              {t.includes.length > 0 && <div className="stack" style={{ gap: 8 }}><h3>يشمل السعر</h3><ul className="checks">{t.includes.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              {t.excludes.length > 0 && <div className="stack" style={{ gap: 8 }}><h3>لا يشمل</h3><ul className="checks no">{t.excludes.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
            </section>
          )}
          {t.meetingPoint && (
            <section className="card stack" style={{ gap: 6 }}>
              <h3>{Ic.pin(18)} نقطة التجمع</h3>
              <p>{t.meetingPoint}</p>
              {t.meetingMapUrl && <a className="btn sm ghost" href={t.meetingMapUrl} target="_blank" rel="noopener" style={{ width: "fit-content" }}>{Ic.map(16)} فتح الموقع في الخرائط</a>}
            </section>
          )}
          {faq.length > 0 && <section className="stack"><h2>أسئلة شائعة</h2><div className="faq stack" style={{ gap: 8 }}>{faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div></section>}
          <section className="stack" style={{ gap: 8 }}>
            <h3>سياسة الإلغاء</h3>
            <p className="muted small">{t.policy || s.refundPolicy || `يمكن طلب إلغاء الحجز قبل موعد الرحلة بـ ${s.cancelDays} أيام على الأقل عبر التواصل معنا، ويُسترجع المبلغ وفق الشروط والأحكام.`} <Link href="/refund-policy">التفاصيل</Link></p>
          </section>
          {t.reviews.length > 0 && (
            <section className="stack"><h2>تقييمات المشاركين</h2>
              <div className="grid-2">{t.reviews.map((r) => <div key={r.id} className="card review pad-sm"><Stars n={r.rating} /><p className="small">{r.text}</p><div className="who"><b>{r.name}</b></div></div>)}</div>
            </section>
          )}
        </div>
        <aside className="sticky">
          <BookBox trip={{ id: t.id, slug: t.slug, title: t.title, priceAdult: t.priceAdult, priceChild: t.priceChild, childNote: t.childNote, maxPerBooking: t.maxPerBooking }} deps={deps} methods={s.payment.methods} vat={s.vat} />
        </aside>
      </div>
    </div>
  );
}
