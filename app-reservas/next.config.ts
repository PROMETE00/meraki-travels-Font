import type { NextConfig } from "next";

const backendBaseUrl = process.env.INTERNAL_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "https://merakitravelsbackend.prome.works";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "merakitravelsbackend.prome.works",
        port: "",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "**.stripe.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendBaseUrl}/api/:path*` },
      { source: "/media/:path*", destination: `${backendBaseUrl}/media/:path*` },
    ];
  },
};

export default nextConfig;
