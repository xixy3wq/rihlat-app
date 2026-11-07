import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentCustomer, publicCustomer } from "@/lib/customer";
import { fmtMoney } from "@/lib/money";
import { fmtDT } from "@/lib/dates";
import { Ic } from "@/components/icons";
import { AccountAuth, AccountProfile } from "@/components/account";

export const metadata = { title: "حسابي" };
const ST: Record<string, [string, string]> = { pending: ["بانتظار الدفع", "warn"], paid: ["مؤكد", "ok"], cancelled: ["مُلغى", "bad"], refunded: ["مُسترجع", "info"], expired: ["منتهي", ""] };

export default async function Account({ searchParams }: { searchParams: { next?: string } }) {
  const me = await currentCustomer();
  const next = (searchParams.next || "").startsWith("/") ? searchParams.next! : "/account";
  if (!me) return <div className="wrap section" style={{ maxWidth: 480 }}><AccountAuth next={next} /></div>;
  const list = await prisma.booking.findMany({ where: { customerId: me.id }, orderBy: { createdAt: "desc" }, take: 100, include: { trip: { select: { title: true, slug: true, cover: true } }, departure: { select: { startAt: true } } } });
  const now = new Date();
  const upcoming = list.filter((b) => b.departure.startAt >= now && ["paid", "pending"].includes(b.status) && !(b.status === "pending" && b.holdUntil && b.holdUntil < now));
  const others = list.filter((b) => !upcoming.includes(b));
  const Row = ({ b }: { b: (typeof list)[number] }) => {
    const [t, c] = ST[b.status] || [b.status, ""];
    return (
      <Link href={b.status === "pending" && b.payMethod !== "transfer" ? `/pay/${b.code}` : `/booking/${b.code}`} className="card pad-sm row" style={{ gap: 12, color: "inherit", textDecoration: "none", alignItems: "center", flexWrap: "nowrap" }}>
        {b.trip.cover && <img src={b.trip.cover} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10 }} />}
        <div className="grow" style={{ display: "grid", gap: 2, minWidth: 0 }}>
          <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.trip.title}</b>
          <span className="small muted">{fmtDT(b.departure.startAt)}</span>
          <span className="tiny muted" dir="ltr" style={{ textAlign: "end" }}>{b.code} · {b.adults + b.children} مقعد · {fmtMoney(b.total)}</span>
        </div>
        <span className={`chip ${c}`}>{t}</span>
      </Link>
    );
  };
  return (
    <div className="wrap section stack-lg" style={{ maxWidth: 760 }}>
      <div className="row between">
        <div><span className="eyebrow">حسابي</span><h1 className="display">أهلًا {me.name.split(" ")[0]}</h1></div>
        <Link href="/#trips" className="btn primary sm">{Ic.plus(14)} حجز جديد</Link>
      </div>
      <section className="stack">
        <h2>رحلاتي القادمة</h2>
        {upcoming.length ? upcoming.map((b) => <Row key={b.id} b={b} />) : <div className="card empty"><span className="big">🧭</span><b>لا توجد رحلات قادمة</b><Link href="/#trips" className="btn sm">تصفّح الرحلات</Link></div>}
      </section>
      {others.length > 0 && <section className="stack"><h2>حجوزات سابقة</h2>{others.map((b) => <Row key={b.id} b={b} />)}</section>}
      <AccountProfile me={publicCustomer(me)} />
    </div>
  );
}
