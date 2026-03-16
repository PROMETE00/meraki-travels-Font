import type { NextConfig } from "next";

const backendBaseUrl = process.env.INTERNAL_API_BASE_URL ?? "https://merakitravelsbackend.prome.works";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendBaseUrl}/api/:path*` },
      { source: "/media/:path*", destination: `${backendBaseUrl}/media/:path*` },
    ];
  },
};

export default nextConfig;
