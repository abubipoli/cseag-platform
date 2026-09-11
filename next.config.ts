import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server.js + pruned node_modules — needed for cPanel's
  // Node.js App Manager (Passenger), which just runs a single startup file
  // rather than `next start` inside a full project checkout.
  output: "standalone",
};

export default nextConfig;
