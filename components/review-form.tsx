"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "./book-form";

export default function ReviewForm({ code }: { code: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form className="card pad-sm stack" style={{ background: "var(--gold-soft)", boxShadow: "none" }} onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(""); try { await api("/api/review", { code, rating, text }); router.refresh(); } catch (x: any) { setErr(x.message); setBusy(false); } }}>
      <b>كيف كانت الرحلة؟ شاركنا رأيك</b>
      <div className="row">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} style={{ background: "none", border: 0, fontSize: "1.6rem", cursor: "pointer", color: n <= rating ? "var(--gold)" : "var(--line-2)" }}>★</button>)}</div>
      <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب تعليقك (اختياري)" />
      {err && <span className="err-msg">{err}</span>}
      <button className="btn sm navy" disabled={busy} style={{ width: "fit-content" }}>إرسال التقييم</button>
    </form>
  );
}
