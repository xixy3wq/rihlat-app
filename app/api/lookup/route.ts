import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanPhone } from "@/lib/auth";
import { SITE_URL } from "@/lib/settings";
export const dynamic = "force-dynamic";

/** البحث عن حجز برقمه ورقم الجوال ثم التحويل لصفحة التذكرة */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = (u.searchParams.get("code") || "").trim().toUpperCase().replace(/\s/g, "");
  const phone = cleanPhone(u.searchParams.get("phone"));
  const b = code ? await prisma.booking.findUnique({ where: { code }, include: { customer: true } }) : null;
  const site = SITE_URL();
  if (!b || b.customer.phone !== phone) return NextResponse.redirect(`${site}/?err=1#my-booking`, 303);
  return NextResponse.redirect(`${site}/booking/${b.code}`, 303);
}
