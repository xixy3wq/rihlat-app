"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ic } from "./icons";

/** شريط الإعلان أعلى الموقع (يُغلق ويُحفظ الإغلاق في الجهاز) */
export function Announce({ text }: { text: string }) {
  const [hide, setHide] = useState(true);
  const key = "announce:" + text.slice(0, 40);
  useEffect(() => { try { setHide(localStorage.getItem(key) === "1"); } catch { setHide(false); } }, [key]);
  if (!text || hide) return null;
  return (
    <div className="announce">
      <span className="bell">{Ic.sun(14)}</span>
      <span>{text}</span>
      <button type="button" className="x" aria-label="إغلاق" onClick={() => { setHide(true); try { localStorage.setItem(key, "1"); } catch {} }}>{Ic.x(14)}</button>
    </div>
  );
}

/** قائمة الثلاث نقاط في الرأس */
export function HeaderMenu({ links }: { links: [string, string][] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; const h = () => setOpen(false); window.addEventListener("click", h); return () => window.removeEventListener("click", h); }, [open]);
  return (
    <span style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="ibtn" aria-label="القائمة" onClick={() => setOpen(!open)}>{Ic.menu(20)}</button>
      {open && <div className="menu">{links.map(([h, l]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{l}</Link>)}</div>}
    </span>
  );
}

/** شريط التنقّل السفلي (جوال) */
export function BottomNav() {
  const p = usePathname();
  const [hash, setHash] = useState("");
  useEffect(() => { const h = () => setHash(location.hash); h(); window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); }, []);
  const items: [string, string, React.ReactNode, boolean][] = [
    ["/", "الرئيسية", Ic.home(22), p === "/" && !hash],
    ["/#trips", "الرحلات", Ic.map(22), p === "/" && hash === "#trips" || p.startsWith("/trips")],
    ["/#my-booking", "حجزي", Ic.ticket(22), hash === "#my-booking" || p.startsWith("/booking") || p === "/my-booking"],
  ];
  return <nav className="bottom-nav">{items.map(([h, l, ic, on]) => <Link key={h} href={h} className={on ? "on" : ""}>{ic}<span>{l}</span></Link>)}</nav>;
}
