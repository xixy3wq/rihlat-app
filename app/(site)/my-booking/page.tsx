import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { cleanPhone } from "@/lib/auth";
import { Ic } from "@/components/icons";

export const metadata = { title: "استعراض حجزي" };

export default function MyBooking({ searchParams }: { searchParams: { err?: string } }) {
  async function find(fd: FormData) {
    "use server";
    const code = String(fd.get("code") || "").trim().toUpperCase().replace(/\s/g, "");
    const phone = cleanPhone(fd.get("phone"));
    const b = code ? await prisma.booking.findUnique({ where: { code }, include: { customer: true } }) : null;
    if (!b || b.customer.phone !== phone) redirect("/my-booking?err=1");
    redirect(`/booking/${b.code}`);
  }
  return (
    <div className="wrap section" style={{ maxWidth: 480 }}>
      <form className="card stack" action={find}>
        <h1 className="display">{Ic.ticket(26)} استعراض حجزي</h1>
        <p className="muted small">اكتب رقم الحجز (مثل RH-7K3M2P) ورقم الجوال المستخدم في الحجز.</p>
        {searchParams.err && <div className="notice bad">لم نجد حجزًا بهذه البيانات.</div>}
        <div className="field"><label>رقم الحجز</label><input className="input" name="code" dir="ltr" required placeholder="RH-XXXXXX" /></div>
        <div className="field"><label>رقم الجوال</label><input className="input" name="phone" dir="ltr" inputMode="tel" required placeholder="05xxxxxxxx" /></div>
        <button className="btn primary lg">عرض الحجز</button>
      </form>
    </div>
  );
}
