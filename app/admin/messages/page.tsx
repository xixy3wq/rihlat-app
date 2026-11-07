import { guard } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { fmtDT } from "@/lib/dates";
import { waLink } from "@/lib/wa";
import RowActions from "@/components/admin/row-actions";
export default async function Messages() {
  await guard(true);
  const list = await prisma.message.findMany({ orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 200 });
  return <><div className="adm-head"><h1>رسائل التواصل</h1></div>
    <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الاسم</th><th>الجوال</th><th>الرسالة</th><th>التاريخ</th><th></th></tr></thead><tbody>
      {list.map((m) => <tr key={m.id} style={m.read ? undefined : { fontWeight: 700 }}><td>{m.name}</td><td dir="ltr"><a href={waLink(m.phone)} target="_blank">{m.phone}</a></td><td className="wrap" style={{ fontWeight: 400 }}>{m.text}</td><td className="tiny">{fmtDT(m.createdAt)}</td>
        <td><RowActions actions={[{ label: m.read ? "غير مقروءة" : "مقروءة", op: "message.read", data: { id: m.id, read: !m.read }, cls: "ghost" }, { label: "حذف", op: "message.delete", data: { id: m.id }, cls: "danger", confirm: "حذف الرسالة؟" }]} /></td></tr>)}
      {!list.length && <tr><td colSpan={5} className="center muted">لا توجد رسائل</td></tr>}
    </tbody></table></div></>;
}
