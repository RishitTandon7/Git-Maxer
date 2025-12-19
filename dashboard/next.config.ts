import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for Supabase ESM import issues
  // serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr'],
};

export default nextConfig;
