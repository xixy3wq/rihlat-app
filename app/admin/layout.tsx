import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Ic } from "@/components/icons";
import { AdmNav, Toaster } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  if (!me) return <>{children}<Toaster /></>;
  const s = await getSettings();
  const admin = me.role === "admin";
  const links = [
    ["/admin", "الرئيسية", "home"], ["/admin/bookings", "الحجوزات", "ticket"], ["/admin/departures", "المواعيد", "cal"], ["/admin/trips", "الرحلات", "map"],
    ["/admin/customers", "العملاء", "users"], ["/admin/checkin", "تحضير QR", "qr"],
    ...(admin ? [["/admin/coupons", "الكوبونات", "tag"], ["/admin/reviews", "التقييمات", "star"], ["/admin/messages", "الرسائل", "chat"], ["/admin/settings", "الإعدادات", "settings"]] : []),
  ] as [string, string, keyof typeof Ic][];
  return (
    <div className="adm">
      <aside className="adm-side no-print">
        <div className="brand">{Ic.sun(22)} {s.brand}</div>
        <AdmNav links={links.map(([href, label, ic]) => ({ href, label, icon: ic }))} />
        <div className="sp" />
        <div className="user small" style={{ padding: "6px 12px", opacity: .8 }}>{me.name} · {admin ? "مدير" : "موظف"}</div>
        <Link href="/" target="_blank">{Ic.arrow(16)} الموقع</Link>
        <a href="/api/admin/logout">{Ic.logout(16)} خروج</a>
      </aside>
      <main className="adm-main">{children}</main>
      <Toaster />
    </div>
  );
}
