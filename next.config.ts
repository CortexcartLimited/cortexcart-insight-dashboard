// next.config.ts
import { config } from 'dotenv';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // This prevents ESLint warnings from failing the production build.
    ignoreDuringBuilds: true,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cortexcart.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**.fbcdn.net', // This allows all subdomains of fbcdn.net
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;