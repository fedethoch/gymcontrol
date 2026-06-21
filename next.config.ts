import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: supabaseHost
    ? {
        remotePatterns: [
          {
            protocol: supabaseHost.protocol.replace(":", "") as "https",
            hostname: supabaseHost.hostname,
            port: supabaseHost.port,
            pathname: "/storage/v1/object/public/**",
          },
          {
            protocol: "https",
            hostname: "fitnessprogramer.com",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
