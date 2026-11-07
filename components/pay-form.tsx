"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { fmtMoney } from "@/lib/money";
import { api } from "./book-form";
import { PAY_LABEL } from "./book-box";
import { Ic } from "./icons";

declare global { interface Window { Moyasar?: any } }

type Props = {
  code: string; amount: number; description: string; pk: string; ready: boolean; methods: string[]; applePayLabel: string; callbackUrl: string; holdUntil: string | null;
  allowTransfer: boolean; bankInfo: string; whatsapp: string; customer: { name: string; phone: string };
};

function Countdown({ until, onEnd }: { until: string; onEnd: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(until).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => { const l = Math.max(0, new Date(until).getTime() - Date.now()); setLeft(l); if (l <= 0) { clearInterval(t); onEnd(); } }, 1000);
    return () => clearInterval(t);
  }, [until, onEnd]);
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return <span className="timer num">{m}:{String(s).padStart(2, "0")}</span>;
}

export default function PayForm(p: Props) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"online" | "transfer">("online");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const inited = useRef(false);

  useEffect(() => {
    if (!loaded || inited.current || !p.ready || mode !== "online") return;
    if (!window.Moyasar) return;
    inited.current = true;
    const methods = p.methods.filter((m) => ["creditcard", "applepay", "stcpay", "samsungpay"].includes(m));
    try {
      window.Moyasar.init({
        element: ".mysr-form",
        amount: p.amount,
        currency: "SAR",
        description: p.description,
        publishable_api_key: p.pk,
        callback_url: p.callbackUrl,
        methods: methods.length ? methods : ["creditcard"],
        language: "ar",
        supported_networks: ["mada", "visa", "mastercard", "amex"],
        metadata: { booking_code: p.code, customer_phone: p.customer.phone },
        apple_pay: { country: "SA", label: p.applePayLabel || "Rihlat", validate_merchant_url: "https://api.moyasar.com/v1/applepay/initiate" },
        on_completed: async (payment: any) => {
          // نربط رقم العملية بالحجز قبل التحويل لصفحة التحقق، حتى لو أغلق العميل الصفحة
          try { await api("/api/pay/attach", { code: p.code, paymentId: payment?.id }); } catch {}
        },
        on_failure: (e: any) => setErr(String(e?.message || "فشلت عملية الدفع")),
      });
    } catch (e: any) { setErr(e?.message || "تعذر تحميل نموذج الدفع"); }
  }, [loaded, p, mode]);

  const transfer = async () => {
    setBusy(true); setErr("");
    try { await api("/api/pay/transfer", { code: p.code }); router.push(`/booking/${p.code}`); }
    catch (e: any) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="stack">
      <link rel="stylesheet" href="/vendor/moyasar/moyasar.css" />
      <Script src="/vendor/moyasar/moyasar.umd.js" strategy="afterInteractive" onLoad={() => setLoaded(true)} onReady={() => setLoaded(true)} />
      {p.holdUntil && <div className="notice row between"><span>المقاعد محجوزة لك حتى انتهاء العدّاد</span><Countdown until={p.holdUntil} onEnd={() => router.refresh()} /></div>}
      {p.allowTransfer && (
        <div className="tabs">
          <button type="button" className={mode === "online" ? "on" : ""} onClick={() => setMode("online")}>دفع إلكتروني</button>
          <button type="button" className={mode === "transfer" ? "on" : ""} onClick={() => setMode("transfer")}>تحويل بنكي</button>
        </div>
      )}
      {mode === "online" ? (
        <div className="card stack">
          <div className="row between"><h2>{Ic.card(20)} الدفع الإلكتروني</h2><b className="num">{fmtMoney(p.amount)}</b></div>
          <div className="pay-methods">{p.methods.map((m) => <span className="m" key={m}>{PAY_LABEL[m] || m}</span>)}</div>
          {!p.ready ? (
            <div className="notice warn">بوابة الدفع الإلكتروني لم تُفعَّل بعد. {p.whatsapp ? "يرجى التواصل معنا عبر الواتساب لإتمام الحجز." : "يرجى التواصل مع إدارة الرحلات لإتمام الحجز."}</div>
          ) : (
            <>
              {!loaded && <div className="skeleton" style={{ height: 160 }} />}
              <div className="mysr-form" dir="rtl" />
              {err && <div className="notice bad">{err}</div>}
              <p className="tiny muted">{Ic.shield(12)} تتم معالجة الدفع عبر بوابة ميسّر المعتمدة من البنك المركزي السعودي. لا نحتفظ ببيانات بطاقتك. زر Apple Pay يظهر في متصفح Safari على أجهزة Apple.</p>
            </>
          )}
        </div>
      ) : (
        <div className="card stack">
          <h2>التحويل البنكي</h2>
          <div className="notice" style={{ whiteSpace: "pre-wrap" }}>{p.bankInfo || "سيتم تزويدك ببيانات الحساب عبر الواتساب."}</div>
          <p className="small muted">بعد التحويل أرسل صورة الإيصال على الواتساب مع رقم الحجز <b>{p.code}</b>. يبقى الحجز محجوزًا لك 24 ساعة حتى تأكيد التحويل.</p>
          {err && <div className="notice bad">{err}</div>}
          <button className="btn primary lg" onClick={transfer} disabled={busy}>{busy ? "…" : "سأحوّل المبلغ — تأكيد الحجز مبدئيًا"}</button>
        </div>
      )}
    </div>
  );
}
