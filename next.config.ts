import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // Firebase Hosting용 정적 사이트 출력
  trailingSlash: true,
  images: {
    unoptimized: true, // 정적 export 시 필요
  },
};

export default nextConfig;
