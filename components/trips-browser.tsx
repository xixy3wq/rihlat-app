"use client";
import { useMemo, useState } from "react";
import { TripCard } from "./site";
import { Ic } from "./icons";

/** قسم الرحلات في الصفحة الواحدة: تصفية بالتصنيف والبحث بدون مغادرة الصفحة */
export default function TripsBrowser({ trips, seats, cats }: { trips: any[]; seats: Record<string, number>; cats: any[] }) {
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim();
    return trips.filter((t) => (!cat || t.category?.slug === cat) && (!s || [t.title, t.destination, t.city, t.summary].some((x) => (x || "").includes(s))));
  }, [trips, cat, q]);
  return (
    <section className="wrap section" id="trips" style={{ paddingTop: 10 }}>
      <div className="section-head"><div><span className="eyebrow">الأقرب موعدًا أولًا</span><h2>الرحلات المتاحة</h2></div><span className="small muted">{list.length} رحلة</span></div>
      <div className="stack" style={{ gap: 10, marginBottom: 18 }}>
        <div className="cats">
          <button type="button" className={`cat${!cat ? " on" : ""}`} onClick={() => setCat("")}><span className="ic">✨</span>الكل</button>
          {cats.map((c) => <button type="button" key={c.id} className={`cat${cat === c.slug ? " on" : ""}`} onClick={() => setCat(cat === c.slug ? "" : c.slug)}><span className="ic">{c.icon}</span>{c.name}</button>)}
        </div>
        <div className="search-row"><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن وجهة أو رحلة…" aria-label="بحث" />{q && <button type="button" className="btn icon sm ghost" onClick={() => setQ("")} aria-label="مسح">{Ic.x(14)}</button>}</div>
      </div>
      {list.length ? (
        <div className="trips">{list.map((t) => <TripCard key={t.id} t={t} seats={seats} />)}</div>
      ) : (
        <div className="card empty"><span className="big">🔍</span><b>لا توجد رحلات مطابقة</b><button type="button" className="btn sm" onClick={() => { setCat(""); setQ(""); }}>عرض الكل</button></div>
      )}
    </section>
  );
}
