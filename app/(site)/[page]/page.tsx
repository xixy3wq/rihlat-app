import { notFound } from "next/navigation";
import { getSettings, publicSettings } from "@/lib/settings";
import { waLink } from "@/lib/wa";
import { Ic } from "@/components/icons";
import ContactForm from "@/components/contact-form";

const PAGES: Record<string, string> = { about: "من نحن", contact: "تواصل معنا", terms: "الشروط والأحكام", privacy: "سياسة الخصوصية", "refund-policy": "سياسة الإلغاء والاسترجاع" };
export function generateMetadata({ params }: { params: { page: string } }) { return { title: PAGES[params.page] || "" }; }

const DEF_TERMS = (b: string) => `1. الحجز يُعدّ مؤكدًا بعد إتمام الدفع واستلام رقم الحجز.\n2. يلتزم المشارك بالحضور في نقطة التجمع قبل موعد الانطلاق بالوقت المحدد، ولا يُسترجع المبلغ عند التأخر أو عدم الحضور.\n3. يحق لـ${b} تعديل البرنامج أو إلغاء الرحلة لظروف الطقس أو السلامة، ويُسترجع المبلغ كاملًا عند الإلغاء من جهتنا.\n4. يلتزم المشاركون بتعليمات المشرفين والأنظمة والآداب العامة.\n5. الأطفال بصحبة ولي أمرهم ومسؤوليته طوال الرحلة.`;
const DEF_REFUND = (d: number) => `• طلب الإلغاء قبل موعد الرحلة بـ ${d} أيام أو أكثر: استرجاع كامل المبلغ.\n• طلب الإلغاء قبل الموعد بأقل من ${d} أيام: لا يُسترجع المبلغ، ويمكن تحويل الحجز لموعد آخر حسب التوفر.\n• يُعاد المبلغ بنفس وسيلة الدفع خلال 5–14 يوم عمل.\n• لطلب الإلغاء تواصل معنا عبر الواتساب مع رقم الحجز.`;
const DEF_PRIVACY = (b: string) => `نحترم خصوصيتك. يستخدم ${b} بياناتك (الاسم ورقم الجوال والبريد) لإتمام الحجز والتواصل بخصوصه فقط، ولا نشاركها مع أي طرف ثالث باستثناء بوابة الدفع لإتمام العملية. لا نحتفظ ببيانات بطاقتك البنكية؛ تتم معالجتها بالكامل لدى بوابة دفع معتمدة.`;

export default async function Page({ params }: { params: { page: string } }) {
  const title = PAGES[params.page];
  if (!title) notFound();
  const s = publicSettings(await getSettings());
  let body = "";
  if (params.page === "about") body = s.about;
  if (params.page === "terms") body = s.terms || DEF_TERMS(s.brand);
  if (params.page === "privacy") body = s.privacy || DEF_PRIVACY(s.brand);
  if (params.page === "refund-policy") body = s.refundPolicy || DEF_REFUND(s.cancelDays);
  return (
    <div className="wrap section stack-lg" style={{ maxWidth: 820 }}>
      <h1 className="display">{title}</h1>
      {params.page === "contact" ? (
        <div className="trip-layout">
          <ContactForm />
          <div className="card stack">
            {s.whatsapp && <a className="btn wa" href={waLink(s.whatsapp)} target="_blank" rel="noopener">{Ic.wa(18)} واتساب {s.whatsapp}</a>}
            {s.phone && <a className="btn ghost" href={`tel:${s.phone}`}>{Ic.phone(18)} {s.phone}</a>}
            {s.email && <a className="btn ghost" href={`mailto:${s.email}`}>{s.email}</a>}
            {s.address && <p className="small muted">{Ic.pin(14)} {s.address}</p>}
            {s.social.maps && <a className="btn ghost" href={s.social.maps} target="_blank" rel="noopener">{Ic.map(18)} موقعنا على الخريطة</a>}
          </div>
        </div>
      ) : (
        <div className="card prose">{body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      )}
    </div>
  );
}
