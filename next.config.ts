import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // Limited directives compatible with static Next.js hydration. Script nonces
          // require a separate rendering/deployment decision before a strict CSP.
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; object-src 'none'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
