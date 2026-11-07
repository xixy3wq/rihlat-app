import { SITE_URL } from "@/lib/settings";
export default function robots() { return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/pay", "/booking"] }], sitemap: `${SITE_URL()}/sitemap.xml` }; }
