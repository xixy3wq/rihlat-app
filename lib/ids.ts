import { randomInt, randomBytes } from "crypto";
/** حروف وأرقام بدون المتشابه (0/O، 1/I/L) */
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function bookingCode(prefix = "RH") {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHA[randomInt(ALPHA.length)];
  return `${prefix}-${s}`;
}
export const token = (n = 24) => randomBytes(n).toString("base64url");
/** معرّف قصير للإضافات والبنود داخل JSON */
export const shortId = () => randomBytes(4).toString("hex");
/** slug من العنوان العربي: نبقي العربية كما هي مع شرطات */
export function slugify(s: string) {
  return String(s || "").trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || token(4);
}
