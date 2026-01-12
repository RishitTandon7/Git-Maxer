import type { NextConfig } from "next";

// Generate build ID at config time
const BUILD_ID = `build-${Date.now()}`;

const nextConfig: NextConfig = {
  // Explicitly expose environment variables to browser
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },

  // Fix for Supabase ESM import issues
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],

  // Optimize for production
  reactStrictMode: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // CRITICAL: New build ID every deployment to bust cache
  generateBuildId: async () => {
    return BUILD_ID
  },

  // AGGRESSIVE cache headers to prevent stale chunk issues
  async headers() {
    return [
      // HTML pages - never cache
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/setup',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/pricing',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      // API routes - never cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      // Static JS/CSS - cache with unique build ID (immutable)
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Everything else - short cache with revalidation
      {
        source: '/:path((?!_next/static).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
