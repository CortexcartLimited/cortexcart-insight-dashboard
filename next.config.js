/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This prevents ESLint warnings from failing the production build. config
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
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.impactradius-go.com',
        pathname: '/**',
      }
    ],
  },
  // --- SECURITY HEADERS IMPLEMENTATION ---
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            // Forces HTTPS for 2 years (63072000 seconds) and includes subdomains
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            // Prevents your site from being embedded in iframes (stops Clickjacking)
            // Use 'SAMEORIGIN' if you need to iframe your own pages, otherwise 'DENY' is safest.
            value: 'SAMEORIGIN', 
          },
          {
            key: 'X-Content-Type-Options',
            // Prevents the browser from trying to guess the file type (MIME sniffing)
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            // (Optional Bonus) Controls how much referrer info is sent to other sites
            value: 'strict-origin-when-cross-origin', 
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;