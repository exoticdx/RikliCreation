import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'rcimitation.yeildops.com',
        '*.yeildops.com',
        'localhost:3000',
        '192.168.0.110:3000',
        '192.168.1.6:3000',
      ],
    },
  },
  images: {
    formats: ['image/webp'],
    qualities: [75],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: [
    'rcimitation.yeildops.com',
    '192.168.0.110', '192.168.0.110:3000', 'http://192.168.0.110:3000',
    '192.168.1.6', 'http://192.168.1.6:3000',
    '192.168.29.171', 'http://192.168.29.171:3000',
    '192.168.1.54', 'http://192.168.1.54:3000',
    '192.168.1.19', 'http://192.168.1.19:3000'
  ],
};

export default nextConfig;
