/**
 * Next.js build configuration and PWA wrapper. Development caching is disabled to keep local
 * edits visible. This configuration does not by itself implement offline form saving or
 * synchronization.
 */
import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  cacheStartUrl: false,
  // Cache build assets only. Authenticated API responses and pages must never enter
  // a shared service-worker cache on a school device.
  runtimeCaching: [{
    urlPattern: /\/_next\/static\//,
    handler: "CacheFirst",
    options: { cacheName: "nedecen-build-assets", expiration: { maxEntries: 200 } },
  }],
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};

module.exports = withPWA(nextConfig);