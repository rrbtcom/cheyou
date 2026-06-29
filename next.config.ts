import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.autohome.com.cn" },
      { protocol: "https", hostname: "**.dcar.com.cn" },
      { protocol: "https", hostname: "**.pcauto.com.cn" },
      { protocol: "https", hostname: "**.yiche.com" },
      { protocol: "https", hostname: "**.toutiao.com" },
      { protocol: "https", hostname: "**.weixin.com" },
      { protocol: "https", hostname: "**.xiaohongshu.com" },
      { protocol: "https", hostname: "**.douyin.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
