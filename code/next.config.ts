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
        // Proxy non-app routes to Framer after checking for static files
        // This will only match paths that don't start with our app routes
        {
          source: '/:path((?!student|company|auth|api|_next).*)*',
          destination: `${process.env.FRAMER_URL || 'https://sensible-trust-772264.framer.app/'}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
