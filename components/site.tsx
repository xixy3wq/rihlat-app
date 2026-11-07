import Link from "next/link";
import { Ic } from "./icons";
import type { PublicSettings } from "@/lib/settings";
import { waLink } from "@/lib/wa";
import { fmtMoney } from "@/lib/money";
import { fmtDay, fmtMon } from "@/lib/dates";

export function Logo({ s }: { s: PublicSettings }) {
  return (
    <Link href="/" className="logo" aria-label={s.brand}>
      {s.logoUrl ? <img src={s.logoUrl} alt={s.brand} /> : <span className="logo-mark">{Ic.sun(20)}</span>}
      <span>{s.brand}</span>
    </Link>
  );
}

export function SiteHeader({ s }: { s: PublicSettings }) {
  return (
    <header className="site-top">
      <div className="wrap in">
        <Logo s={s} />
        <nav className="nav">
          <Link href="/trips">الرحلات</Link>
          <Link href="/about">من نحن</Link>
          <Link href="/contact">تواصل</Link>
          <Link href="/my-booking" className="keep">حجزي</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ s }: { s: PublicSettings }) {
  const y = new Date().getFullYear();
  return (
    <footer className="site-foot">
      <div className="wrap in">
        <div>
          <h4 className="display" style={{ fontSize: "1.3rem" }}>{s.brand}</h4>
          <p className="small" style={{ maxWidth: 380 }}>{s.about}</p>
          {(s.cr || s.license) && <p className="tiny" style={{ marginTop: 10, opacity: .7 }}>{s.cr && `سجل تجاري: ${s.cr}`}{s.cr && s.license && " · "}{s.license && `ترخيص: ${s.license}`}</p>}
        </div>
        <div>
          <h4>روابط</h4>
          <Link href="/trips">كل الرحلات</Link>
          <Link href="/my-booking">استعراض حجزي</Link>
          <Link href="/terms">الشروط والأحكام</Link>
          <Link href="/refund-policy">سياسة الإلغاء والاسترجاع</Link>
          <Link href="/privacy">سياسة الخصوصية</Link>
        </div>
        <div>
          <h4>تواصل معنا</h4>
          {s.whatsapp && <a href={waLink(s.whatsapp)} target="_blank" rel="noopener">واتساب: {s.whatsapp}</a>}
          {s.phone && <a href={`tel:${s.phone}`}>جوال: {s.phone}</a>}
          {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
          {s.address && <span style={{ display: "block", padding: "3px 0" }}>{s.address}</span>}
          <div className="row" style={{ marginTop: 8, gap: 12 }}>
            {s.social.instagram && <a href={s.social.instagram} target="_blank" rel="noopener">إنستغرام</a>}
            {s.social.snapchat && <a href={s.social.snapchat} target="_blank" rel="noopener">سناب</a>}
            {s.social.tiktok && <a href={s.social.tiktok} target="_blank" rel="noopener">تيك توك</a>}
            {s.social.x && <a href={s.social.x} target="_blank" rel="noopener">X</a>}
          </div>
        </div>
      </div>
      <div className="wrap copy"><span>© {y} {s.brand}. جميع الحقوق محفوظة.</span><span>الدفع آمن عبر بوابة دفع معتمدة</span></div>
      {s.whatsapp && <a className="wa-float no-print" href={waLink(s.whatsapp, `السلام عليكم، أرغب بالاستفسار عن الرحلات`)} target="_blank" rel="noopener" aria-label="تواصل عبر واتساب">{Ic.wa(28)}</a>}
    </footer>
  );
}

export const COVER_FALLBACK = "/demo/placeholder.svg";

export function TripCard({ t, seats }: { t: any; seats?: Record<string, number> }) {
  const deps: any[] = (t.departures || []).filter((d: any) => d.status === "open" && new Date(d.startAt) > new Date());
  const prices = [t.priceAdult, ...deps.map((d) => d.priceAdult).filter((x) => x != null)];
  const from = Math.min(...prices);
  const allFull = deps.length > 0 && seats && deps.every((d) => (seats[d.id] || 0) >= d.capacity);
  return (
    <Link href={`/trips/${t.slug}`} className="trip">
      <div className="img">
        <img src={t.cover || COVER_FALLBACK} alt={t.title} loading="lazy" />
        <div className="badges">
          {t.featured && <span className="chip hot">مميزة</span>}
          {t.category && <span className="chip">{t.category.icon} {t.category.name}</span>}
        </div>
        {allFull && <div className="soldout">اكتملت المقاعد</div>}
      </div>
      <div className="body">
        <h3>{t.title}</h3>
        <div className="meta">
          {t.destination && <span>{Ic.pin(14)} {t.destination}</span>}
          <span>{Ic.clock(14)} {t.durationLabel || (t.durationDays === 1 ? "يوم واحد" : `${t.durationDays} أيام`)}</span>
          {t.city && <span>{Ic.bus(14)} الانطلاق من {t.city}</span>}
        </div>
        {deps.length > 0 && (
          <div className="dates-mini">
            {deps.slice(0, 3).map((d) => <span key={d.id}>{fmtDay(d.startAt)} {fmtMon(d.startAt)}</span>)}
            {deps.length > 3 && <span>+{deps.length - 3}</span>}
          </div>
        )}
        <div className="foot">
          <div className="price"><span className="from">يبدأ من</span><b>{fmtMoney(from)}</b><small>للشخص</small></div>
          <span className="btn sm navy">التفاصيل</span>
        </div>
      </div>
    </Link>
  );
}

export function Dunes() {
  return (
    <svg className="dunes" viewBox="0 0 1200 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 60 C 200 10, 320 95, 520 55 S 820 10, 1000 50 S 1150 80, 1200 60 L1200 90 L0 90 Z" fill="var(--bg)" opacity=".25" />
      <path d="M0 75 C 180 40, 360 95, 560 70 S 860 30, 1040 68 S 1160 90, 1200 78 L1200 90 L0 90 Z" fill="var(--bg)" />
    </svg>
  );
}
