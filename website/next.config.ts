import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "**.ytimg.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
      { protocol: "https", hostname: "music.youtube.com" },
      { protocol: "https", hostname: "www.youtube.com" },
      { protocol: "https", hostname: "**.youtube.com" },
    ],
  },
};

export default nextConfig;
