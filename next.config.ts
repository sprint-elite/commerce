import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1GB 인스턴스에서 빌드 워커가 스왑을 밀지 않도록 1개만 사용
  experimental: {
    cpus: 1,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
