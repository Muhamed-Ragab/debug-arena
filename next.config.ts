import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [{ source: "/health", destination: "/api/health" }];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/i18n/request.ts",
  experimental: {
    extract: true,
    messages: {
      path: "./messages",
      format: "po",
      locales: "infer",
      sourceLocale: "en",
    },
    srcPath: "./src",
  },
});

export default withNextIntl(nextConfig);
