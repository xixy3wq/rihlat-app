import { getSettings, publicSettings } from "@/lib/settings";
import { SiteHeader, SiteFooter } from "@/components/site";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = publicSettings(await getSettings());
  return (
    <>
      <SiteHeader s={s} />
      <main>{children}</main>
      <SiteFooter s={s} />
    </>
  );
}
