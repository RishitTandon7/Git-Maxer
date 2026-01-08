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
};

export default nextConfig;
