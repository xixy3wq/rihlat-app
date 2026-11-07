import Link from "next/link";
export default function NotFound() { return <div className="wrap section empty" style={{ minHeight: "60vh" }}><span className="big">🧭</span><h1>الصفحة غير موجودة</h1><Link href="/" className="btn primary">العودة للرئيسية</Link></div>; }
