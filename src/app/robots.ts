import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        allow: ["/$", "/login", "/register"],
        disallow: [
          "/challenges",
          "/leaderboard",
          "/profile",
          "/settings",
          "/submissions",
          "/admin",
          "/api",
          "/forgot-password",
        ],
        userAgent: "*",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
