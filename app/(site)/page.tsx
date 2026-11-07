import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings } from "@/lib/settings";
import { publishedTrips } from "@/lib/data";
import { TripCard, Dunes } from "@/components/site";
import { Ic, Stars } from "@/components/icons";

export default async function Home() {
  const s = publicSettings(await getSettings());
  const [{ trips, seats }, cats, reviews, counts] = await Promise.all([
    publishedTrips({ limit: 8 }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 6, include: { trip: { select: { title: true } } } }),
    Promise.all([prisma.booking.count({ where: { status: "paid" } }), prisma.trip.count({ where: { status: "published" } })]),
  ]);
  const methods = s.payment.methods;
  return (
    <>
      <section className="hero">
        <div className="sun" />
        <div className="wrap in">
          <span className="chip accent" style={{ background: "rgba(255,255,255,.14)", color: "#ffd9c9", width: "fit-content" }}>{Ic.shield(14)} حجز فوري ودفع آمن</span>
          <h1 className="display">{s.home.heroTitle}</h1>
          <p>{s.home.heroText}</p>
          <div className="cta">
            <Link href="/trips" className="btn primary lg">تصفّح الرحلات</Link>
            <Link href="/my-booking" className="btn lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{Ic.ticket(18)} استعراض حجزي</Link>
          </div>
          <div className="stats">
            <div><b>{counts[1]}</b><span>رحلة متاحة</span></div>
            {counts[0] > 20 && <div><b>+{counts[0]}</b><span>حجز ناجح</span></div>}
            <div><b>{methods.includes("applepay") ? "Apple Pay" : "مدى"}</b><span>وطرق دفع أخرى</span></div>
          </div>
        </div>
        <Dunes />
      </section>

      <section className="wrap section" style={{ paddingTop: 22 }}>
        <div className="cats">
          <Link href="/trips" className="cat on"><span className="ic">✨</span>الكل</Link>
          {cats.map((c) => <Link key={c.id} href={`/trips?cat=${c.slug}`} className="cat"><span className="ic">{c.icon}</span>{c.name}</Link>)}
        </div>
      </section>

      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div><span className="eyebrow">الأقرب موعدًا</span><h2>الرحلات المتاحة</h2></div>
          <Link href="/trips" className="more">عرض الكل ←</Link>
        </div>
        {trips.length ? (
          <div className="trips">{trips.map((t) => <TripCard key={t.id} t={t} seats={seats} />)}</div>
        ) : (
          <div className="card empty"><span className="big">🏕️</span><b>لا توجد رحلات منشورة حاليًا</b><span>تابعونا، الرحلات الجديدة قريبًا.</span></div>
        )}
      </section>

      <section className="wrap section">
        <div className="section-head"><div><span className="eyebrow">خطوات بسيطة</span><h2>كيف تحجز؟</h2></div></div>
        <div className="grid-4">
          {[
            ["1", "اختر رحلتك", "تصفّح الرحلات واطّلع على البرنامج والأسعار ونقطة التجمع."],
            ["2", "حدّد الموعد والمقاعد", "اختر تاريخ الانطلاق المناسب وعدد الأشخاص."],
            ["3", "ادفع بأمان", "أبل باي، مدى، فيزا وماستركارد، أو STC Pay عبر بوابة دفع معتمدة."],
            ["4", "استلم تذكرتك", "تصلك التذكرة برمز QR فورًا، ونذكّرك قبل الموعد."],
          ].map(([n, t, d]) => (
            <div key={n} className="card stack" style={{ gap: 6 }}>
              <span className="avatar" style={{ background: "var(--accent-soft)", color: "var(--accent-deep)", fontFamily: "var(--f-display)" }}>{n}</span>
              <h3>{t}</h3><p className="small muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="wrap section">
          <div className="section-head"><div><span className="eyebrow">آراء المشاركين</span><h2>قالوا عنّا</h2></div></div>
          <div className="grid-3">
            {reviews.map((r) => (
              <div key={r.id} className="card review">
                <Stars n={r.rating} />
                <p>{r.text}</p>
                <div className="who"><b>{r.name}</b><span className="muted">{r.trip.title}</span></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {s.home.faq.length > 0 && (
        <section className="wrap section" style={{ maxWidth: 820 }}>
          <div className="section-head"><div><span className="eyebrow">الأسئلة الشائعة</span><h2>تسأل كثيرًا؟</h2></div></div>
          <div className="faq stack" style={{ gap: 8 }}>
            {s.home.faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </section>
      )}
    </>
  );
}
