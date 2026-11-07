import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import { Stars } from "@/components/icons";
import RowActions from "@/components/admin/row-actions";
export default async function Reviews() {
  await guard(true);
  const list = await prisma.review.findMany({ orderBy: [{ approved: "asc" }, { createdAt: "desc" }], take: 200, include: { trip: { select: { title: true } } } });
  return <><div className="adm-head"><h1>التقييمات</h1></div>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>التقييم</th><th>الاسم</th><th>الرحلة</th><th>النص</th><th>التاريخ</th><th></th></tr></thead><tbody>
      {list.map((r) => <tr key={r.id} style={r.approved ? undefined : { background: "var(--warn-soft)" }}><td><Stars n={r.rating} /></td><td>{r.name}</td><td className="wrap">{r.trip.title}</td><td className="wrap">{r.text}</td><td className="tiny">{fmtDate(r.createdAt)}</td>
        <td><RowActions actions={[{ label: r.approved ? "إخفاء" : "اعتماد", op: "review.approve", data: { id: r.id, approved: !r.approved }, cls: r.approved ? "ghost" : "sea" }, { label: "حذف", op: "review.delete", data: { id: r.id }, cls: "danger", confirm: "حذف التقييم؟" }]} /></td></tr>)}
      {!list.length && <tr><td colSpan={6} className="center muted">لا توجد تقييمات</td></tr>}
    </tbody></table></div></>;
}
