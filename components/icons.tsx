// أيقونات SVG خفيفة (بدون مكتبة)
const P = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const I = ({ d, size = 18, ...r }: { d: React.ReactNode; size?: number; [k: string]: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...P} aria-hidden="true" {...r}>{d}</svg>
);
export const Ic = {
  pin: (s?: number) => <I size={s} d={<><path d="M12 22s7-7.1 7-12a7 7 0 1 0-14 0c0 4.9 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></>} />,
  clock: (s?: number) => <I size={s} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  cal: (s?: number) => <I size={s} d={<><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></>} />,
  users: (s?: number) => <I size={s} d={<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.5A5 5 0 0 1 21.5 19" /></>} />,
  star: (s?: number) => <svg width={s || 16} height={s || 16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 17l-5.8 3.3 1.4-6.4L2.7 9.5l6.5-.7z" /></svg>,
  check: (s?: number) => <I size={s} d={<path d="M5 12.5l4.5 4.5L19 7.5" />} />,
  x: (s?: number) => <I size={s} d={<path d="M6 6l12 12M18 6L6 18" />} />,
  arrow: (s?: number) => <I size={s} d={<path d="M19 12H5M11 6l-6 6 6 6" />} />,
  wa: (s?: number) => <svg width={s || 22} height={s || 22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.8.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.3-.4.8-1.4.1-.2 0-.4 0-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6z" /></svg>,
  phone: (s?: number) => <I size={s} d={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />} />,
  shield: (s?: number) => <I size={s} d={<><path d="M12 2l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" /><path d="M9 12l2 2 4-4" /></>} />,
  ticket: (s?: number) => <I size={s} d={<><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" /><path d="M14 6v12" strokeDasharray="2 2" /></>} />,
  sun: (s?: number) => <I size={s} d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>} />,
  home: (s?: number) => <I size={s} d={<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>} />,
  map: (s?: number) => <I size={s} d={<><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" /><path d="M9 4v14M15 6v14" /></>} />,
  card: (s?: number) => <I size={s} d={<><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></>} />,
  print: (s?: number) => <I size={s} d={<><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="7" /></>} />,
  menu: (s?: number) => <I size={s} d={<path d="M4 7h16M4 12h16M4 17h16" />} />,
  search: (s?: number) => <I size={s} d={<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>} />,
  plus: (s?: number) => <I size={s} d={<path d="M12 5v14M5 12h14" />} />,
  trash: (s?: number) => <I size={s} d={<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>} />,
  edit: (s?: number) => <I size={s} d={<><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17z" /><path d="M13 7l3 3" /></>} />,
  logout: (s?: number) => <I size={s} d={<><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 3h6v18h-6" /></>} />,
  tag: (s?: number) => <I size={s} d={<><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>} />,
  chat: (s?: number) => <I size={s} d={<path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5A8 8 0 1 1 21 12z" />} />,
  settings: (s?: number) => <I size={s} d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>} />,
  chart: (s?: number) => <I size={s} d={<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>} />,
  qr: (s?: number) => <I size={s} d={<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v3M17 20h4M14 20h1" /></>} />,
  list: (s?: number) => <I size={s} d={<><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>} />,
  bus: (s?: number) => <I size={s} d={<><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M7 21v-4M17 21v-4" /><circle cx="8" cy="14" r="1" /><circle cx="16" cy="14" r="1" /></>} />,
  user: (s?: number) => <I size={s} d={<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>} />,
  heart: (s?: number) => <I size={s} d={<path d="M12 21s-7.5-4.6-9.5-9.3A5.2 5.2 0 0 1 12 6.6a5.2 5.2 0 0 1 9.5 5.1C19.5 16.4 12 21 12 21z" />} />,
};
export const Stars = ({ n }: { n: number }) => <span className="stars" aria-label={`${n} من 5`}>{"★".repeat(Math.round(n))}{"☆".repeat(5 - Math.round(n))}</span>;
