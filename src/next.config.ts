import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://dev-admin-api.72.62.40.154.nip.io:31416',
    NEXT_PUBLIC_MAIN_BACKEND_URL: process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8080',
  },
};

export default nextConfig;

