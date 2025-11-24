import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy root to Framer (but only if not a static file)
        {
          source: '/',
          destination: process.env.FRAMER_URL || 'https://sensible-trust-772264.framer.app/',
        },
      ],
      afterFiles: [
        // Proxy other non-app routes to Framer after checking for static files
        {
          source: '/:path*',
          destination: `${process.env.FRAMER_URL || 'https://sensible-trust-772264.framer.app/'}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
