import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client"],
  env: {
    AUTH_TOKEN: process.env.AUTH_TOKEN,
  },
};

export default nextConfig;
