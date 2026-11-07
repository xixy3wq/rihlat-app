import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/session";
import { cleanUsername } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const username = cleanUsername(b.username);
  const u = username ? await prisma.user.findUnique({ where: { username } }) : null;
  const ok = u && (await bcrypt.compare(String(b.password ?? ""), u.passwordHash));
  if (!u || !ok) return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 });
  if (u.status !== "active") return NextResponse.json({ error: "هذا الحساب موقوف" }, { status: 403 });
  await prisma.user.update({ where: { id: u.id }, data: { lastSeenAt: new Date() } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(u.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
