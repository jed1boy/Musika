import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
