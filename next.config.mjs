/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "qrcode"] },
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  async rewrites() {
    return [
      // ملف تحقق أبل باي (يُلصق محتواه من لوحة ميسّر في إعدادات الدفع)
      { source: "/.well-known/apple-developer-merchantid-domain-association", destination: "/api/pay/apple-domain" },
    ];
  },
};
export default nextConfig;
