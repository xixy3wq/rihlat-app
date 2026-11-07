import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, publicSettings } from "@/lib/settings";
import { publishedTrips } from "@/lib/data";
import { Dunes } from "@/components/site";
import { Ic, Stars } from "@/components/icons";
import TripsBrowser from "@/components/trips-browser";
import ContactForm from "@/components/contact-form";
import { waLink } from "@/lib/wa";

/** الصفحة الواحدة: كل الأقسام بالتمرير — الرحلات، كيف تحجز، الآراء، الأسئلة، من نحن، تواصل، حجزي */
export default async function Home({ searchParams }: { searchParams: { err?: string } }) {
  const s = publicSettings(await getSettings());
  const [{ trips, seats }, cats, reviews, counts] = await Promise.all([
    publishedTrips({ limit: 100 }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.review.findMany({ where: { approved: true }, orderBy: { createdAt: "desc" }, take: 6, include: { trip: { select: { title: true } } } }),
    Promise.all([prisma.booking.count({ where: { status: "paid" } }), prisma.trip.count({ where: { status: "published" } })]),
  ]);
  const methods = s.payment.methods;
  const usedCats = cats.filter((c) => trips.some((t) => t.categoryId === c.id));
  return (
    <>
      <section className="hero">
        <div className="sun" />
        <div className="wrap in">
          <span className="chip" style={{ background: "rgba(255,255,255,.14)", color: "#ffd9c9", width: "fit-content" }}>{Ic.shield(14)} حجز فوري ودفع آمن</span>
          <h1 className="display">{s.home.heroTitle}</h1>
          <p>{s.home.heroText}</p>
          <div className="cta">
            <a href="#trips" className="btn primary lg">تصفّح الرحلات</a>
            <a href="#my-booking" className="btn lg" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>{Ic.ticket(18)} استعراض حجزي</a>
          </div>
          <div className="stats">
            <div><b>{counts[1]}</b><span>رحلة متاحة</span></div>
            {counts[0] > 20 && <div><b>+{counts[0]}</b><span>حجز ناجح</span></div>}
            <div><b>{methods.includes("applepay") ? "Apple Pay" : "مدى"}</b><span>وطرق دفع أخرى</span></div>
          </div>
        </div>
        <Dunes />
      </section>

      <TripsBrowser trips={JSON.parse(JSON.stringify(trips))} seats={seats} cats={JSON.parse(JSON.stringify(usedCats))} />

      <section className="wrap section" id="how">
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
        <section className="wrap section" id="reviews">
          <div className="section-head"><div><span className="eyebrow">آراء المشاركين</span><h2>قالوا عنّا</h2></div></div>
          <div className="grid-3">
            {reviews.map((r) => (
              <div key={r.id} className="card review"><Stars n={r.rating} /><p>{r.text}</p><div className="who"><b>{r.name}</b><span className="muted">{r.trip.title}</span></div></div>
            ))}
          </div>
        </section>
      )}

      {s.home.faq.length > 0 && (
        <section className="wrap section" id="faq" style={{ maxWidth: 820 }}>
          <div className="section-head"><div><span className="eyebrow">الأسئلة الشائعة</span><h2>تسأل كثيرًا؟</h2></div></div>
          <div className="faq stack" style={{ gap: 8 }}>{s.home.faq.map((f, i) => <details key={i}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        </section>
      )}

      <section className="wrap section" id="about">
        <div className="section-head"><div><span className="eyebrow">من نحن</span><h2>{s.brand}</h2></div></div>
        <div className="about-grid">
          <div className="card prose">{s.about.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}{(s.cr || s.license) && <p className="tiny muted">{s.cr && `سجل تجاري: ${s.cr}`}{s.cr && s.license && " · "}{s.license && `ترخيص: ${s.license}`}</p>}</div>
          <div className="card stack" style={{ gap: 10 }}>
            <h3>لماذا تحجز معنا؟</h3>
            <ul className="checks"><li>برامج مدروسة ومشرفون مرافقون</li><li>دفع إلكتروني آمن وتذكرة فورية</li><li>تذكير قبل الرحلة ونقطة تجمع واضحة</li><li>سياسة إلغاء واضحة</li></ul>
          </div>
        </div>
      </section>

      <section className="wrap section" id="contact">
        <div className="section-head"><div><span className="eyebrow">نسعد بخدمتك</span><h2>تواصل معنا</h2></div></div>
        <div className="about-grid">
          <ContactForm />
          <div className="card stack">
            {s.whatsapp && <a className="btn wa" href={waLink(s.whatsapp)} target="_blank" rel="noopener">{Ic.wa(18)} واتساب {s.whatsapp}</a>}
            {s.phone && <a className="btn ghost" href={`tel:${s.phone}`}>{Ic.phone(18)} {s.phone}</a>}
            {s.email && <a className="btn ghost" href={`mailto:${s.email}`}>{s.email}</a>}
            {s.address && <p className="small muted">{Ic.pin(14)} {s.address}</p>}
            {s.social.maps && <a className="btn ghost" href={s.social.maps} target="_blank" rel="noopener">{Ic.map(18)} موقعنا على الخريطة</a>}
            {!s.whatsapp && !s.phone && !s.email && <p className="small muted">سيتم إضافة بيانات التواصل قريبًا.</p>}
          </div>
        </div>
      </section>

      <section className="wrap section" id="my-booking" style={{ maxWidth: 560 }}>
        <form className="card stack" action="/api/lookup" method="get">
          <h2>{Ic.ticket(22)} استعراض حجزي</h2>
          <p className="muted small">اكتب رقم الحجز (مثل {s.bookingPrefix}-7K3M2P) ورقم الجوال المستخدم في الحجز.</p>
          {searchParams.err && <div className="notice bad">لم نجد حجزًا بهذه البيانات.</div>}
          <div className="grid-2">
            <div className="field"><label>رقم الحجز</label><input className="input" name="code" dir="ltr" required placeholder={`${s.bookingPrefix}-XXXXXX`} /></div>
            <div className="field"><label>رقم الجوال</label><input className="input" name="phone" dir="ltr" inputMode="tel" required placeholder="05xxxxxxxx" /></div>
          </div>
          <button className="btn primary lg">عرض الحجز</button>
        </form>
      </section>
    </>
  );
}
