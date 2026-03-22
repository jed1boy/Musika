import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "svgl.app",
        pathname: "/library/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/listen/search", destination: "/", permanent: true },
      { source: "/listen/library", destination: "/", permanent: true },
      { source: "/listen/liked", destination: "/", permanent: true },
      { source: "/listen", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
