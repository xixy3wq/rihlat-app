import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { SITE_URL } from "@/lib/settings";
export const dynamic = "force-dynamic";
export async function GET() {
  const res = NextResponse.redirect(`${SITE_URL()}/admin/login`, 303);
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
