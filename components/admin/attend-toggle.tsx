"use client";
import { useAct } from "./ui";
export default function AttendToggle({ id, attended }: { id: string; attended: boolean }) {
  const { run, busy } = useAct();
  return <button className={`btn sm ${attended ? "sea" : "ghost"}`} disabled={busy} onClick={() => run("booking.attend", { id }, attended ? "أُلغي الحضور" : "تم تسجيل الحضور")}>{attended ? "✓ حضر" : "تسجيل حضور"}</button>;
}
