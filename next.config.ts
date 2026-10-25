/**
 * Next.js build configuration and PWA wrapper. Development caching is disabled to keep local
 * edits visible. This configuration does not by itself implement offline form saving or
 * synchronization.
 */
import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  turbopack: {},
};

module.exports = withPWA(nextConfig);