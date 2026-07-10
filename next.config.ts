import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ext.same-assets.com" },
      { protocol: "https", hostname: "ugc.same-assets.com" },
    ],
  },
};

export default nextConfig;
