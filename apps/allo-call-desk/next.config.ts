import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stall the webhook raw-body route and the SSE feed.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
