"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAct, F, Modal, Confirm, Badge, toast } from "./ui";
import { toSar, fmtMoney } from "@/lib/money";
import { fmtDT, toLocalInput } from "@/lib/dates";
import { Ic } from "../icons";

const sar = (h: number | null | undefined) => (h == null ? "" : String(toSar(h)));
const TABS = ["الأساسية", "الوصف والبرنامج", "الأسعار والإضافات", "الصور", "المواعيد"];

export default function TripForm({ trip, cats, deps, seats }: { trip: any; cats: any[]; deps: any[]; seats: Record<string, number> }) {
  const router = useRouter();
  const { run, busy } = useAct();
  const [tab, setTab] = useState(0);
  const [t, setT] = useState<any>(() => trip ? { ...trip, priceAdult: sar(trip.priceAdult), priceChild: sar(trip.priceChild), extras: (trip.extras || []).map((x: any) => ({ ...x, price: sar(x.price) })), includes: trip.includes.join("\n"), excludes: trip.excludes.join("\n"), itinerary: (trip.itinerary || []).map((d: any) => ({ title: d.title, items: (d.items || []).join("\n") })) }
    : { title: "", subtitle: "", slug: "", categoryId: cats[0]?.id || "", city: "", destination: "", durationDays: 1, durationLabel: "", startTime: "", cover: "", images: [], summary: "", description: "", itinerary: [], includes: "", excludes: "", meetingPoint: "", meetingMapUrl: "", priceAdult: "", priceChild: "", childNote: "", minAge: "", extras: [], capacityDefault: 20, maxPerBooking: 10, status: "draft", featured: false, order: 0, faq: [], policy: "" });
  const [dep, setDep] = useState<any>(null);
  const set = (k: string, v: any) => setT((x: any) => ({ ...x, [k]: v }));
  const In = (k: string, p: any = {}) => <input className="input" value={t[k] ?? ""} onChange={(e) => set(k, e.target.value)} {...p} />;

  const save = async (andClose = false) => {
    const r = await run("trip.save", { ...t, id: trip?.id });
    if (!trip) router.replace(`/admin/trips/${r.id}`); else if (andClose) router.push("/admin/trips");
  };
  const upload = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const jj = await r.json();
    if (!r.ok) return toast(jj.error, true);
    setT((x: any) => ({ ...x, images: [...x.images, jj.url], cover: x.cover || jj.url }));
  };
  const listEdit = (k: string, fields: [string, string][], blank: any) => (
    <div className="list-edit">
      {(t[k] as any[]).map((it, i) => (
        <div className="it" key={i}>
          {fields.map(([fk, ph]) => fk === "perPerson" ? <label key={fk} className="switch"><input type="checkbox" checked={!!it[fk]} onChange={(e) => set(k, t[k].map((y: any, ji: number) => ji === i ? { ...y, [fk]: e.target.checked } : y))} />لكل شخص</label>
            : fk === "items" || fk === "a" ? <textarea key={fk} className="input" rows={2} placeholder={ph} value={it[fk]} onChange={(e) => set(k, t[k].map((y: any, ji: number) => ji === i ? { ...y, [fk]: e.target.value } : y))} />
            : <input key={fk} className="input" placeholder={ph} value={it[fk]} onChange={(e) => set(k, t[k].map((y: any, ji: number) => ji === i ? { ...y, [fk]: e.target.value } : y))} />)}
          <button type="button" className="btn icon sm danger" onClick={() => set(k, t[k].filter((_: any, ji: number) => ji !== i))}>{Ic.x(14)}</button>
        </div>
      ))}
      <button type="button" className="btn sm ghost" style={{ width: "fit-content" }} onClick={() => set(k, [...t[k], blank])}>{Ic.plus(14)} إضافة</button>
    </div>
  );
  return (
    <>
      <div className="adm-head">
        <div className="row"><Link href="/admin/trips" className="btn icon sm ghost">{Ic.arrow(16)}</Link><h1>{trip ? trip.title : "رحلة جديدة"}</h1>{trip && <Badge s={t.status} />}</div>
        <div className="row">
          {trip && <a className="btn sm ghost" href={`/trips/${trip.slug}`} target="_blank">معاينة</a>}
          {trip && <button className="btn sm ghost" onClick={() => run("trip.duplicate", { id: trip.id }, "تم النسخ").then((r) => router.push(`/admin/trips/${r.id}`))}>نسخ</button>}
          {trip && <Confirm text="حذف الرحلة؟ (إذا عليها حجوزات ستُؤرشف فقط)" onYes={() => run("trip.delete", { id: trip.id }, "تم").then(() => router.push("/admin/trips"))}>حذف</Confirm>}
          <button className="btn primary sm" disabled={busy} onClick={() => save(false)}>حفظ</button>
        </div>
      </div>
      <div className="tabs">{TABS.map((x, i) => <button key={x} className={tab === i ? "on" : ""} onClick={() => setTab(i)} disabled={i === 4 && !trip}>{x}</button>)}</div>
      <div className="card form">
        {tab === 0 && <>
          <div className="grid-2">
            <F label="عنوان الرحلة *">{In("title", { placeholder: "مثال: رحلة بر وتخييم — روضة خريم" })}</F>
            <F label="عنوان فرعي">{In("subtitle", { placeholder: "جملة تشويقية قصيرة" })}</F>
            <F label="التصنيف"><select className="input" value={t.categoryId || ""} onChange={(e) => set("categoryId", e.target.value)}><option value="">بدون</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}</select></F>
            <F label="الحالة"><select className="input" value={t.status} onChange={(e) => set("status", e.target.value)}><option value="draft">مسودة (لا تظهر)</option><option value="published">منشورة</option><option value="archived">مؤرشفة</option></select></F>
            <F label="الوجهة">{In("destination", { placeholder: "مثال: روضة خريم" })}</F>
            <F label="مدينة الانطلاق">{In("city", { placeholder: "الرياض" })}</F>
            <F label="عدد الأيام">{In("durationDays", { type: "number", min: 1 })}</F>
            <F label="وصف المدة" hint="يظهر للعميل، مثال: يوم واحد / 3 أيام وليلتان">{In("durationLabel")}</F>
            <F label="وقت الانطلاق">{In("startTime", { placeholder: "06:00 صباحًا" })}</F>
            <F label="رابط الصفحة (slug)" hint="يُنشأ تلقائيًا من العنوان">{In("slug", { dir: "ltr" })}</F>
            <F label="نقطة التجمع" span>{In("meetingPoint", { placeholder: "مثال: موقف مجمع الرياض بارك — البوابة 3" })}</F>
            <F label="رابط الموقع في خرائط قوقل" span>{In("meetingMapUrl", { dir: "ltr", placeholder: "https://maps.app.goo.gl/..." })}</F>
            <F label="ملخص قصير (يظهر في المشاركة)" span>{In("summary")}</F>
          </div>
          <div className="row"><label className="switch"><input type="checkbox" checked={!!t.featured} onChange={(e) => set("featured", e.target.checked)} />رحلة مميزة (تظهر أولًا)</label><F label="ترتيب العرض"><input className="input" type="number" style={{ width: 90 }} value={t.order} onChange={(e) => set("order", e.target.value)} /></F></div>
        </>}
        {tab === 1 && <>
          <F label="وصف الرحلة" hint="كل سطر فقرة"><textarea className="input" rows={6} value={t.description} onChange={(e) => set("description", e.target.value)} /></F>
          <h3>برنامج الرحلة (بالأيام أو المراحل)</h3>
          {listEdit("itinerary", [["title", "عنوان المرحلة: مثال اليوم الأول — الانطلاق"], ["items", "الفقرات، كل سطر فقرة"]], { title: "", items: "" })}
          <div className="grid-2">
            <F label="يشمل السعر" hint="كل سطر بند"><textarea className="input" rows={5} value={t.includes} onChange={(e) => set("includes", e.target.value)} placeholder={"المواصلات ذهابًا وإيابًا\nوجبة الغداء\nمشرف مرافق"} /></F>
            <F label="لا يشمل" hint="كل سطر بند"><textarea className="input" rows={5} value={t.excludes} onChange={(e) => set("excludes", e.target.value)} placeholder={"المصروف الشخصي"} /></F>
          </div>
          <h3>أسئلة شائعة خاصة بالرحلة</h3>
          {listEdit("faq", [["q", "السؤال"], ["a", "الجواب"]], { q: "", a: "" })}
          <F label="سياسة إلغاء خاصة بهذه الرحلة" hint="اتركه فارغًا لاستخدام السياسة العامة"><textarea className="input" rows={3} value={t.policy} onChange={(e) => set("policy", e.target.value)} /></F>
        </>}
        {tab === 2 && <>
          <div className="grid-2">
            <F label="سعر البالغ (ر.س) *">{In("priceAdult", { type: "number", min: 0, step: "0.01", dir: "ltr" })}</F>
            <F label="سعر الطفل (ر.س)" hint="اتركه فارغًا إذا لا يوجد سعر للأطفال">{In("priceChild", { type: "number", min: 0, step: "0.01", dir: "ltr" })}</F>
            <F label="تعريف الطفل">{In("childNote", { placeholder: "مثال: من 3 إلى 12 سنة" })}</F>
            <F label="الحد الأدنى للعمر">{In("minAge", { type: "number", min: 0 })}</F>
            <F label="السعة الافتراضية للموعد">{In("capacityDefault", { type: "number", min: 1 })}</F>
            <F label="أقصى عدد مقاعد في الحجز الواحد">{In("maxPerBooking", { type: "number", min: 1 })}</F>
          </div>
          <h3>إضافات اختيارية (مثل: خيمة خاصة، وجبة عشاء)</h3>
          {listEdit("extras", [["name", "اسم الإضافة"], ["price", "السعر بالريال"], ["perPerson", ""]], { id: "", name: "", price: "", perPerson: false })}
        </>}
        {tab === 3 && <>
          <div className="row">
            <label className="btn sm navy">{Ic.plus(14)} رفع صورة<input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} /></label>
            <input className="input" placeholder="أو الصق رابط صورة ثم Enter" dir="ltr" style={{ maxWidth: 360 }} onKeyDown={(e) => { const v = (e.target as HTMLInputElement).value.trim(); if (e.key === "Enter" && v) { e.preventDefault(); setT((x: any) => ({ ...x, images: [...x.images, v], cover: x.cover || v })); (e.target as HTMLInputElement).value = ""; } }} />
          </div>
          <div className="imgs">
            {t.images.map((u: string) => (
              <div key={u} className={`im${t.cover === u ? " cover" : ""}`}>
                <img src={u} alt="" />
                <button type="button" className="x" onClick={() => setT((x: any) => ({ ...x, images: x.images.filter((y: string) => y !== u), cover: x.cover === u ? (x.images.filter((y: string) => y !== u)[0] || "") : x.cover }))}>✕</button>
                {t.cover !== u && <button type="button" className="c" onClick={() => set("cover", u)}>غلاف</button>}
              </div>
            ))}
            {!t.images.length && <p className="muted small">لا توجد صور بعد. الصورة الأولى تصبح الغلاف تلقائيًا.</p>}
          </div>
        </>}
        {tab === 4 && trip && <>
          <div className="row between"><h3 style={{ border: 0, margin: 0, padding: 0 }}>مواعيد الانطلاق</h3><button className="btn sm primary" onClick={() => setDep({ tripId: trip.id, startAt: "", endAt: "", capacity: t.capacityDefault, priceAdult: "", priceChild: "", status: "open", note: "" })}>+ موعد</button></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الانطلاق</th><th>السعة</th><th>المحجوز</th><th>سعر خاص</th><th>الحالة</th><th></th></tr></thead><tbody>
            {deps.map((d) => <tr key={d.id}><td>{fmtDT(d.startAt)}</td><td className="num">{d.capacity}</td><td className="num"><Link href={`/admin/departures/${d.id}`}>{seats[d.id] || 0}</Link></td><td className="num">{d.priceAdult != null ? fmtMoney(d.priceAdult) : "—"}</td><td><Badge s={d.status} /></td>
              <td className="row"><button className="btn sm ghost" onClick={() => setDep({ ...d, startAt: toLocalInput(d.startAt), endAt: d.endAt ? toLocalInput(d.endAt) : "", priceAdult: sar(d.priceAdult), priceChild: sar(d.priceChild), note: d.note || "" })}>{Ic.edit(14)}</button><Confirm text="حذف الموعد؟" onYes={() => run("dep.delete", { id: d.id }, "تم الحذف")}>{Ic.trash(14)}</Confirm></td></tr>)}
            {!deps.length && <tr><td colSpan={6} className="center muted">لا توجد مواعيد — أضف موعدًا حتى يتمكن العملاء من الحجز</td></tr>}
          </tbody></table></div>
        </>}
      </div>
      {dep && (
        <Modal title={dep.id ? "تعديل الموعد" : "موعد جديد"} onClose={() => setDep(null)}>
          <div className="grid-2">
            <F label="تاريخ ووقت الانطلاق *"><input className="input" type="datetime-local" value={dep.startAt} onChange={(e) => setDep({ ...dep, startAt: e.target.value })} /></F>
            <F label="تاريخ العودة"><input className="input" type="datetime-local" value={dep.endAt} onChange={(e) => setDep({ ...dep, endAt: e.target.value })} /></F>
            <F label="السعة (عدد المقاعد)"><input className="input" type="number" min={1} value={dep.capacity} onChange={(e) => setDep({ ...dep, capacity: e.target.value })} /></F>
            <F label="الحالة"><select className="input" value={dep.status} onChange={(e) => setDep({ ...dep, status: e.target.value })}><option value="open">مفتوح للحجز</option><option value="closed">مغلق</option><option value="cancelled">ملغى</option><option value="done">انتهى</option></select></F>
            <F label="سعر البالغ لهذا الموعد" hint="اتركه فارغًا لاستخدام سعر الرحلة"><input className="input" type="number" dir="ltr" value={dep.priceAdult} onChange={(e) => setDep({ ...dep, priceAdult: e.target.value })} /></F>
            <F label="سعر الطفل لهذا الموعد"><input className="input" type="number" dir="ltr" value={dep.priceChild} onChange={(e) => setDep({ ...dep, priceChild: e.target.value })} /></F>
            <F label="ملاحظة" span><input className="input" value={dep.note} onChange={(e) => setDep({ ...dep, note: e.target.value })} /></F>
          </div>
          <button className="btn primary" disabled={busy} onClick={() => run("dep.save", { ...dep, startAt: dep.startAt ? new Date(dep.startAt + ":00+03:00").toISOString() : "", endAt: dep.endAt ? new Date(dep.endAt + ":00+03:00").toISOString() : "" }).then(() => setDep(null))}>حفظ الموعد</button>
        </Modal>
      )}
    </>
  );
}
