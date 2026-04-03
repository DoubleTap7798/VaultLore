import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@vaultlore/api-client", "@vaultlore/shared", "@vaultlore/ui"]
};

export default nextConfig;
