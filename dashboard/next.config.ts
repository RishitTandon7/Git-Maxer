import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for Supabase ESM import issues
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  // Transpile Supabase packages
  transpilePackages: ['@supabase/supabase-js', '@supabase/ssr'],
};

export default nextConfig;
