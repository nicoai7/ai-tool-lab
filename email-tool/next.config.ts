import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/email",
  assetPrefix: "/email",
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
