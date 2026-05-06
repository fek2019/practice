import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module and must not be bundled by webpack;
  // it must be required at runtime from node_modules.
  serverExternalPackages: ["better-sqlite3"],
  webpack: (config, { dev }) => {
    if (dev) {
      // OneDrive can interfere with webpack filesystem cache writes in `.next/cache`,
      // which leads to missing chunk errors like "Cannot find module './738.js'".
      // Use in-memory cache in dev to keep rebuilds stable.
      config.cache = { type: "memory" };
    }
    return config;
  }
};

export default nextConfig;
