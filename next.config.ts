import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
