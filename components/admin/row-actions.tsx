"use client";
import { useAct } from "./ui";
export default function RowActions({ actions }: { actions: { label: string; op: string; data: any; cls?: string; confirm?: string }[] }) {
  const { run, busy } = useAct();
  return <div className="row" style={{ gap: 4 }}>{actions.map((a) => <button key={a.label} className={`btn sm ${a.cls || ""}`} disabled={busy} onClick={() => { if (!a.confirm || confirm(a.confirm)) run(a.op, a.data, "تم"); }}>{a.label}</button>)}</div>;
}
