// رمز QR للفاتورة الضريبية المبسطة حسب مواصفة هيئة الزكاة والضريبة والجمارك (TLV ثم Base64)
function tlv(tag: number, value: string) {
  const v = Buffer.from(value, "utf8");
  return Buffer.concat([Buffer.from([tag, v.length]), v]);
}
export function zatcaQr(o: { seller: string; vatNumber: string; at: Date; total: number; vat: number }) {
  const money = (h: number) => (h / 100).toFixed(2);
  return Buffer.concat([
    tlv(1, o.seller), tlv(2, o.vatNumber), tlv(3, o.at.toISOString()), tlv(4, money(o.total)), tlv(5, money(o.vat)),
  ]).toString("base64");
}
