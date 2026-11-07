import { getSettings, publicSettings } from "@/lib/settings";
import { SiteHeader, SiteFooter } from "@/components/site";
import { Announce, BottomNav } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = publicSettings(await getSettings());
  return (
    <div className="site">
      <Announce text={s.home.announce} />
      <SiteHeader s={s} />
      <main>{children}</main>
      <SiteFooter s={s} />
      <BottomNav />
    </div>
  );
}
