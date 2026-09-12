import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/heavy server-only packages out of the bundler.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "puppeteer"],
};

export default nextConfig;
