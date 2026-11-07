import { guard, j } from "@/lib/guard";
import { prisma } from "@/lib/db";
import CustomersTable from "@/components/admin/customers";

export default async function Customers({ searchParams }: { searchParams: { q?: string } }) {
  await guard();
  const q = (searchParams.q || "").trim();
  const list = await prisma.customer.findMany({ where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] } : {}, orderBy: { createdAt: "desc" }, take: 200, include: { bookings: { where: { status: "paid" }, select: { total: true } } } });
  return <><div className="adm-head"><h1>العملاء</h1><span className="small muted">{list.length}</span></div>
    <form className="toolbar" method="get"><input className="input" name="q" defaultValue={q} placeholder="اسم أو جوال" /><button className="btn sm navy">بحث</button></form>
    <CustomersTable list={j(list.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, city: c.city, note: c.note, hasAccount: !!c.passwordHash, n: c.bookings.length, total: c.bookings.reduce((a, b) => a + b.total, 0), createdAt: c.createdAt })))} /></>;
}
