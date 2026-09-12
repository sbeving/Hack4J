import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/heavy server-only packages out of the bundler.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "puppeteer"],
  experimental: {
    // Evidence files (up to 10 MB) upload through Server Actions.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
