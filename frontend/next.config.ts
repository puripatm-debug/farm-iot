import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5001';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/auth/register',
        destination: '/register',
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
