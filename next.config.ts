import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server.js + pruned node_modules — needed for cPanel's
  // Node.js App Manager (Passenger), which just runs a single startup file
  // rather than `next start` inside a full project checkout.
  output: "standalone",
  experimental: {
    // Next.js silently truncates any request body over 10MB before it
    // reaches route handlers (since every request passes through
    // src/middleware.ts). That truncation broke uploads of resource PDFs
    // over 10MB with no useful error — raised to match /api/uploads' own
    // 25MB cap, with headroom so that cap's error message is what fires.
    proxyClientMaxBodySize: "30mb",
  },
};

export default nextConfig;
