import { prisma } from "./db";

export const DEF = {
  brand: process.env.SEED_BRAND || "رحلات",
  tagline: "رحلات ترفيهية منظّمة بعناية",
  logoUrl: "",
  about: "نُنظّم رحلات ترفيهية وسياحية داخل المملكة بإشراف فريق متخصص: برامج مدروسة، مواصلات مريحة، وتجربة لا تُنسى.",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "الرياض",
  social: { instagram: "", snapchat: "", tiktok: "", x: "", maps: "" },
  /// السجل التجاري ورقم ترخيص السياحة
  cr: "",
  license: "",
  /// ضريبة القيمة المضافة: included = الأسعار شاملة الضريبة
  vat: { enabled: false, number: "", rate: 15, included: true },
  /// مدة حجز المقاعد بانتظار الدفع (دقائق)
  holdMinutes: 20,
  bookingPrefix: "RH",
  /// الإلغاء من العميل: عدد الأيام قبل الرحلة اللي يُسمح فيها بطلب الإلغاء
  cancelDays: 3,
  terms: "",
  privacy: "",
  refundPolicy: "",
  payment: {
    pk: "", sk: "", webhookSecret: "",
    /// طرق الدفع المفعّلة: creditcard | applepay | stcpay | samsungpay
    methods: ["creditcard", "applepay", "stcpay"] as string[],
    applePayLabel: process.env.SEED_APPLE_LABEL || "Rihlat",
    appleDomainFile: "",
    /// السماح بالحجز بدون دفع إلكتروني (تحويل بنكي / نقدًا عند الحضور)
    allowTransfer: false,
    bankInfo: "",
  },
  /// ربط الواتساب عبر مزوّد خارجي (مثل الواتس الذكي): المتغيرات {phone} {phone0} {message}
  wa: {
    enabled: false, method: "GET" as "GET" | "POST_FORM" | "POST_JSON", url: "", body: "", okWord: "",
    autoConfirm: true, autoRemind: true,
    tplConfirm: "السلام عليكم {الاسم}،\nتم تأكيد حجزكم في *{الرحلة}* ✅\n▫️ رقم الحجز: *{الرقم}*\n▫️ الموعد: {التاريخ}\n▫️ المقاعد: {المقاعد}\n▫️ المبلغ: {المبلغ}\n\nتذكرتكم وتفاصيل نقطة التجمع:\n{الرابط}\n\nنتشرف بخدمتكم 🌿",
    tplRemind: "السلام عليكم {الاسم}،\nنذكّركم بموعد رحلة *{الرحلة}* غدًا 🗓️\n▫️ الموعد: {التاريخ}\n▫️ نقطة التجمع: {التجمع}\n▫️ رقم الحجز: {الرقم}\n\nالتذكرة: {الرابط}\n\nننتظركم 🌿",
    tplCancel: "السلام عليكم {الاسم}،\nنفيدكم بإلغاء حجزكم رقم *{الرقم}* في رحلة *{الرحلة}*.\nللاستفسار يرجى التواصل معنا.",
  },
  seo: { title: "", description: "" },
  home: {
    heroTitle: "اكتشف المملكة مع رحلات مُنظّمة",
    heroText: "برامج يومية وعطلات نهاية الأسبوع: بر، بحر، جبال، وتجارب عائلية. احجز مقعدك وادفع بأمان بأبل باي أو مدى أو STC Pay.",
    faq: [
      { q: "كيف أحجز؟", a: "اختر الرحلة، ثم الموعد وعدد المقاعد، وأكمل الدفع إلكترونيًا. تصلك التذكرة فورًا على الواتساب." },
      { q: "هل يمكن الإلغاء؟", a: "نعم، وفق سياسة الإلغاء الموضحة في صفحة كل رحلة. يُرجى التواصل معنا عبر الواتساب لطلب الإلغاء." },
      { q: "ما طرق الدفع المتاحة؟", a: "أبل باي، مدى، فيزا وماستركارد، وSTC Pay عبر بوابة دفع آمنة." },
    ] as { q: string; a: string }[],
  },
};
export type Settings = typeof DEF;

const deepMerge = (a: any, b: any): any => {
  if (Array.isArray(a) || Array.isArray(b) || typeof a !== "object" || a === null || typeof b !== "object" || b === null) return b === undefined ? a : b;
  const o: any = { ...a };
  for (const k of Object.keys(b)) o[k] = deepMerge(a[k], b[k]);
  return o;
};

/** الإعدادات كاملة (بما فيها المفاتيح السرية) — للخادم فقط */
export async function getSettings(): Promise<Settings> {
  const r = await prisma.setting.findUnique({ where: { key: "main" } });
  return deepMerge(DEF, (r?.value as any) || {});
}
export async function saveSettings(patch: any) {
  const cur = await getSettings();
  const next = deepMerge(cur, patch);
  await prisma.setting.upsert({ where: { key: "main" }, create: { key: "main", value: next }, update: { value: next } });
  return next as Settings;
}

/** نسخة آمنة للمتصفح: بدون أي مفتاح سري */
export function publicSettings(s: Settings) {
  const { payment, wa, ...rest } = s;
  return {
    ...rest,
    payment: { pk: payment.pk, methods: payment.methods, applePayLabel: payment.applePayLabel, allowTransfer: payment.allowTransfer, bankInfo: payment.bankInfo, live: payment.pk.startsWith("pk_live_"), ready: !!payment.pk && !!payment.sk },
  };
}
export type PublicSettings = ReturnType<typeof publicSettings>;

/** نسخة لوحة الإدارة: المفاتيح السرية تُستبدل بعلامة وجود فقط */
export function adminSettings(s: Settings) {
  return {
    ...s,
    payment: { ...s.payment, sk: "", webhookSecret: "", hasSk: !!s.payment.sk, hasWebhookSecret: !!s.payment.webhookSecret },
    wa: { ...s.wa, url: "", body: "", hasUrl: !!s.wa.url },
  };
}

export const SITE_URL = () => (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")).replace(/\/$/, "");
