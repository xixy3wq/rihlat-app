"use client";
import { useState } from "react";
import { useAct, F, Modal, Confirm, act, toast } from "./ui";
import { fmtDT } from "@/lib/dates";

const TABS = ["عام", "التواصل", "الدفع", "الضريبة والفواتير", "الواتساب", "الصفحة الرئيسية", "السياسات", "التصنيفات", "الموظفون"];
const METHODS = [["creditcard", "البطاقات (مدى، فيزا، ماستركارد)"], ["applepay", "Apple Pay"], ["stcpay", "STC Pay"], ["samsungpay", "Samsung Pay"]];

export default function SettingsForm({ s: init, users, cats, meId, site, hasBlob }: { s: any; users: any[]; cats: any[]; meId: string; site: string; hasBlob: boolean }) {
  const { run, busy } = useAct();
  const [tab, setTab] = useState(0);
  const [s, setS] = useState<any>(init);
  const [u, setU] = useState<any>(null);
  const [cat, setCat] = useState<any>(null);
  const set = (path: string, v: any) => setS((x: any) => { const o = structuredClone(x); const ks = path.split("."); let c = o; for (const k of ks.slice(0, -1)) c = c[k]; c[ks.at(-1)!] = v; return o; });
  const get = (path: string) => path.split(".").reduce((a, k) => a?.[k], s);
  const In = (path: string, p: any = {}) => <input className="input" value={get(path) ?? ""} onChange={(e) => set(path, e.target.value)} {...p} />;
  const Ta = (path: string, rows = 4, p: any = {}) => <textarea className="input" rows={rows} value={get(path) ?? ""} onChange={(e) => set(path, e.target.value)} {...p} />;
  const Sw = (path: string, label: string) => <label className="switch"><input type="checkbox" checked={!!get(path)} onChange={(e) => set(path, e.target.checked)} />{label}</label>;
  const save = () => run("settings.save", { patch: s }, "تم حفظ الإعدادات");
  const secretField = (path: string, has: boolean, label: string, hint: string) => (
    <F label={label} hint={has ? `محفوظ ✓ — اتركه فارغًا للإبقاء عليه. ${hint}` : hint}>
      <div className="row" style={{ gap: 6 }}>{In(path, { dir: "ltr", type: "password", placeholder: has ? "••••••••" : "", autoComplete: "new-password", style: { flex: 1 } })}{has && <Confirm text="حذف المفتاح المحفوظ؟" onYes={() => run("settings.clearSecret", { key: path }, "تم الحذف")} className="btn sm ghost">حذف</Confirm>}</div>
    </F>
  );
  return (
    <>
      <div className="adm-head"><h1>الإعدادات</h1><button className="btn primary sm" disabled={busy} onClick={save}>حفظ</button></div>
      <div className="tabs">{TABS.map((x, i) => <button key={x} className={tab === i ? "on" : ""} onClick={() => setTab(i)}>{x}</button>)}</div>
      <div className="card form">
        {tab === 0 && <div className="grid-2">
          <F label="اسم المكتب / العلامة">{In("brand")}</F><F label="الشعار النصي القصير">{In("tagline")}</F>
          <F label="رابط الشعار (صورة)" hint={hasBlob ? "ارفع الشعار من صفحة أي رحلة ثم الصق رابطه هنا" : "الصق رابط صورة الشعار"}>{In("logoUrl", { dir: "ltr" })}</F>
          <F label="المدينة">{In("city")}</F>
          <F label="نبذة عن المكتب (تظهر في من نحن والتذييل)" span>{Ta("about")}</F>
          <F label="السجل التجاري">{In("cr", { dir: "ltr" })}</F><F label="رقم ترخيص السياحة">{In("license", { dir: "ltr" })}</F>
          <F label="بادئة رقم الحجز" hint="مثل RH → RH-7K3M2P">{In("bookingPrefix", { dir: "ltr", maxLength: 4 })}</F>
          <F label="مهلة الدفع (دقائق)" hint="تبقى المقاعد محجوزة للعميل خلالها">{In("holdMinutes", { type: "number", min: 5 })}</F>
          <F label="أيام الإلغاء المسموحة قبل الرحلة">{In("cancelDays", { type: "number", min: 0 })}</F>
          <F label="عنوان الموقع في محركات البحث">{In("seo.title")}</F><F label="وصف الموقع في محركات البحث" span>{Ta("seo.description", 2)}</F>
        </div>}
        {tab === 1 && <div className="grid-2">
          <F label="رقم الواتساب للحجوزات" hint="يظهر للعملاء وزر الواتساب العائم">{In("whatsapp", { dir: "ltr", placeholder: "05xxxxxxxx" })}</F>
          <F label="رقم الجوال">{In("phone", { dir: "ltr" })}</F><F label="البريد الإلكتروني">{In("email", { dir: "ltr" })}</F><F label="العنوان">{In("address")}</F>
          <F label="إنستغرام">{In("social.instagram", { dir: "ltr" })}</F><F label="سناب شات">{In("social.snapchat", { dir: "ltr" })}</F><F label="تيك توك">{In("social.tiktok", { dir: "ltr" })}</F><F label="X (تويتر)">{In("social.x", { dir: "ltr" })}</F>
          <F label="رابط الموقع في خرائط قوقل" span>{In("social.maps", { dir: "ltr" })}</F>
        </div>}
        {tab === 2 && <>
          <div className="notice">بوابة الدفع: <b>ميسّر (Moyasar)</b>. افتح حسابك في dashboard.moyasar.com ← الإعدادات ← مفاتيح API، وانسخ المفتاحين هنا. ابدأ بمفاتيح الاختبار (test) ثم بدّلها بالحقيقية (live) بعد اعتماد الحساب.</div>
          <div className="grid-2">
            <F label="المفتاح المعلن (Publishable key)" hint="يبدأ بـ pk_test_ أو pk_live_">{In("payment.pk", { dir: "ltr" })}</F>
            {secretField("payment.sk", s.payment.hasSk, "المفتاح السري (Secret key)", "يبدأ بـ sk_")}
            {secretField("payment.webhookSecret", s.payment.hasWebhookSecret, "كلمة سر الويبهوك", `أنشئ ويبهوك في لوحة ميسّر بالرابط ${site}/api/pay/webhook مع نفس كلمة السر`)}
            <F label="اسم المتجر في Apple Pay" hint="أحرف إنجليزية فقط، يظهر في نافذة الدفع">{In("payment.applePayLabel", { dir: "ltr" })}</F>
          </div>
          <F label="طرق الدفع المفعّلة"><div className="row">{METHODS.map(([k, l]) => <label key={k} className="switch"><input type="checkbox" checked={s.payment.methods.includes(k)} onChange={(e) => set("payment.methods", e.target.checked ? [...s.payment.methods, k] : s.payment.methods.filter((x: string) => x !== k))} />{l}</label>)}</div></F>
          <F label="ملف تحقق نطاق Apple Pay" hint={`من لوحة ميسّر: Apple Pay ← أضف نطاق موقعك ← حمّل ملف التحقق والصق محتواه هنا. سيُنشر تلقائيًا على ${site}/.well-known/apple-developer-merchantid-domain-association`}>{Ta("payment.appleDomainFile", 3, { dir: "ltr", style: { fontFamily: "monospace", fontSize: ".75rem" } })}</F>
          <hr className="divider" />
          {Sw("payment.allowTransfer", "السماح بالتحويل البنكي (يؤكده الموظف يدويًا)")}
          <F label="بيانات الحساب البنكي (تظهر للعميل عند اختيار التحويل)">{Ta("payment.bankInfo", 3, { placeholder: "اسم البنك\nاسم المستفيد\nIBAN: SA..." })}</F>
        </>}
        {tab === 3 && <>
          {Sw("vat.enabled", "تفعيل ضريبة القيمة المضافة (تظهر فاتورة ضريبية مبسطة برمز QR معتمد من هيئة الزكاة)")}
          <div className="grid-2">
            <F label="الرقم الضريبي (15 رقم)">{In("vat.number", { dir: "ltr" })}</F>
            <F label="نسبة الضريبة %">{In("vat.rate", { type: "number" })}</F>
          </div>
          <F label="طريقة الحساب"><select className="input" value={s.vat.included ? "1" : "0"} onChange={(e) => set("vat.included", e.target.value === "1")}><option value="1">الأسعار المعروضة شاملة الضريبة</option><option value="0">تُضاف الضريبة فوق السعر عند الدفع</option></select></F>
        </>}
        {tab === 4 && <>
          <div className="notice">روابط «اضغط للمراسلة» تعمل دائمًا بدون أي ربط. الإرسال <b>التلقائي</b> (تأكيد الحجز والتذكير قبل الرحلة بيوم) يحتاج ربط مزوّد واتساب خارجي يعطيك رابط API، مثل الواتس الذكي.</div>
          {Sw("wa.enabled", "تفعيل الإرسال التلقائي")}
          <div className="grid-2">
            <F label="طريقة الطلب"><select className="input" value={s.wa.method} onChange={(e) => set("wa.method", e.target.value)}><option value="GET">GET (رابط)</option><option value="POST_FORM">POST (نموذج)</option><option value="POST_JSON">POST (JSON)</option></select></F>
            <F label="كلمة النجاح في الرد" hint="اختياري: مثل success">{In("wa.okWord", { dir: "ltr" })}</F>
            {secretField("wa.url", s.wa.hasUrl, "رابط الإرسال", "المتغيرات: {phone} رقم دولي 966، {phone0} يبدأ بـ 05، {message} النص")}
            <F label="جسم الطلب (للطريقة POST)" hint="نفس المتغيرات">{Ta("wa.body", 2, { dir: "ltr", placeholder: '{"to":"{phone}","text":"{message}"}' })}</F>
          </div>
          <div className="row"><input className="input" id="watest" dir="ltr" placeholder="05xxxxxxxx" style={{ maxWidth: 200 }} /><button className="btn sm ghost" onClick={async () => { try { await act("wa.test", { phone: (document.getElementById("watest") as HTMLInputElement).value }); toast("أُرسلت رسالة تجريبية"); } catch (e: any) { toast(e.message, true); } }}>اختبار الإرسال</button><span className="tiny muted">احفظ الإعدادات أولًا</span></div>
          <div className="row">{Sw("wa.autoConfirm", "إرسال تأكيد الحجز تلقائيًا بعد الدفع")}{Sw("wa.autoRemind", "تذكير تلقائي قبل الرحلة بيوم")}</div>
          <F label="قالب التأكيد" hint="المتغيرات: {الاسم} {الرحلة} {الرقم} {التاريخ} {المقاعد} {المبلغ} {التجمع} {الرابط} {الجهة}">{Ta("wa.tplConfirm", 6)}</F>
          <F label="قالب التذكير">{Ta("wa.tplRemind", 5)}</F>
          <F label="قالب الإلغاء">{Ta("wa.tplCancel", 3)}</F>
        </>}
        {tab === 5 && <>
          <F label="العنوان الرئيسي">{In("home.heroTitle")}</F>
          <F label="النص تحت العنوان">{Ta("home.heroText", 3)}</F>
          <h3>الأسئلة الشائعة</h3>
          <div className="list-edit">{s.home.faq.map((f: any, i: number) => <div className="it" key={i}><input className="input" placeholder="السؤال" value={f.q} onChange={(e) => set("home.faq", s.home.faq.map((y: any, k: number) => k === i ? { ...y, q: e.target.value } : y))} /><input className="input" placeholder="الجواب" value={f.a} onChange={(e) => set("home.faq", s.home.faq.map((y: any, k: number) => k === i ? { ...y, a: e.target.value } : y))} /><button className="btn icon sm danger" onClick={() => set("home.faq", s.home.faq.filter((_: any, k: number) => k !== i))}>✕</button></div>)}
            <button className="btn sm ghost" style={{ width: "fit-content" }} onClick={() => set("home.faq", [...s.home.faq, { q: "", a: "" }])}>+ سؤال</button></div>
        </>}
        {tab === 6 && <>
          <F label="الشروط والأحكام" hint="اتركها فارغة لاستخدام النص الافتراضي">{Ta("terms", 8)}</F>
          <F label="سياسة الإلغاء والاسترجاع">{Ta("refundPolicy", 6)}</F>
          <F label="سياسة الخصوصية">{Ta("privacy", 5)}</F>
        </>}
        {tab === 7 && <>
          <div className="row between"><h3 style={{ border: 0, padding: 0, margin: 0 }}>تصنيفات الرحلات</h3><button className="btn sm primary" onClick={() => setCat({ name: "", slug: "", icon: "🏕️", order: cats.length })}>+ تصنيف</button></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الأيقونة</th><th>الاسم</th><th>الرابط</th><th>الترتيب</th><th></th></tr></thead><tbody>
            {cats.map((c) => <tr key={c.id}><td>{c.icon}</td><td>{c.name}</td><td dir="ltr">{c.slug}</td><td>{c.order}</td><td className="row"><button className="btn sm ghost" onClick={() => setCat({ ...c })}>تعديل</button><Confirm text="حذف التصنيف؟ (الرحلات تبقى بدون تصنيف)" onYes={() => run("category.delete", { id: c.id }, "تم")}>حذف</Confirm></td></tr>)}
          </tbody></table></div>
        </>}
        {tab === 8 && <>
          <div className="row between"><h3 style={{ border: 0, padding: 0, margin: 0 }}>حسابات الموظفين</h3><button className="btn sm primary" onClick={() => setU({ name: "", username: "", password: "", role: "staff", status: "active" })}>+ موظف</button></div>
          <p className="small muted">المدير: كل الصلاحيات. الموظف: الحجوزات والمواعيد والتحضير فقط (بدون الإعدادات والاسترجاع).</p>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الاسم</th><th>المستخدم</th><th>الدور</th><th>الحالة</th><th>آخر دخول</th><th></th></tr></thead><tbody>
            {users.map((x) => <tr key={x.id}><td>{x.name}</td><td dir="ltr">{x.username}</td><td>{x.role === "admin" ? "مدير" : "موظف"}</td><td>{x.status === "active" ? "فعّال" : "موقوف"}</td><td className="tiny">{x.lastSeenAt ? fmtDT(x.lastSeenAt) : "—"}</td>
              <td className="row"><button className="btn sm ghost" onClick={() => setU({ ...x, password: "" })}>تعديل</button>{x.id !== meId && <Confirm text="حذف الحساب؟" onYes={() => run("user.delete", { id: x.id }, "تم")}>حذف</Confirm>}</td></tr>)}
          </tbody></table></div>
        </>}
      </div>
      {u && <Modal title={u.id ? "تعديل حساب" : "موظف جديد"} onClose={() => setU(null)}>
        <F label="الاسم"><input className="input" value={u.name} onChange={(e) => setU({ ...u, name: e.target.value })} /></F>
        <F label="اسم المستخدم" hint="أحرف إنجليزية صغيرة وأرقام"><input className="input" dir="ltr" value={u.username} onChange={(e) => setU({ ...u, username: e.target.value })} /></F>
        <F label={u.id ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}><input className="input" dir="ltr" type="password" value={u.password} onChange={(e) => setU({ ...u, password: e.target.value })} /></F>
        <div className="grid-2"><F label="الدور"><select className="input" value={u.role} onChange={(e) => setU({ ...u, role: e.target.value })}><option value="staff">موظف</option><option value="admin">مدير</option></select></F>
          <F label="الحالة"><select className="input" value={u.status} onChange={(e) => setU({ ...u, status: e.target.value })}><option value="active">فعّال</option><option value="disabled">موقوف</option></select></F></div>
        <button className="btn primary" disabled={busy} onClick={() => run("user.save", u).then(() => setU(null))}>حفظ</button>
      </Modal>}
      {cat && <Modal title="تصنيف" onClose={() => setCat(null)}>
        <div className="grid-2"><F label="الاسم"><input className="input" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} /></F><F label="الأيقونة (إيموجي)"><input className="input" value={cat.icon} onChange={(e) => setCat({ ...cat, icon: e.target.value })} /></F>
          <F label="الرابط (إنجليزي)"><input className="input" dir="ltr" value={cat.slug} onChange={(e) => setCat({ ...cat, slug: e.target.value })} /></F><F label="الترتيب"><input className="input" type="number" value={cat.order} onChange={(e) => setCat({ ...cat, order: e.target.value })} /></F></div>
        <button className="btn primary" disabled={busy} onClick={() => run("category.save", cat).then(() => setCat(null))}>حفظ</button>
      </Modal>}
    </>
  );
}
