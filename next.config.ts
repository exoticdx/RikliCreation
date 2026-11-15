import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  },
  allowedDevOrigins: [
    '192.168.1.6', 'http://192.168.1.6:3000',
    '192.168.29.171', 'http://192.168.29.171:3000',
    '192.168.1.54', 'http://192.168.1.54:3000',
    '192.168.1.19', 'http://192.168.1.19:3000'
  ],
};

export default nextConfig;
