import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly expose environment variables to browser
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  // Fix for Supabase ESM import issues
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],

  // Optimize for production
  reactStrictMode: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // CRITICAL: Prevent stale chunk cache issues
  generateBuildId: async () => {
    // Use timestamp to force new build ID each deployment
    return `build-${Date.now()}`
  },

  // Add aggressive cache headers to prevent stale chunks
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
