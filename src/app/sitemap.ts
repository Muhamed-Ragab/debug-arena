import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  return [
    {
      changeFrequency: "daily",
      lastModified,
      priority: 1.0,
      url: baseUrl,
    },
    {
      changeFrequency: "monthly",
      lastModified,
      priority: 0.8,
      url: `${baseUrl}/register`,
    },
    {
      changeFrequency: "monthly",
      lastModified,
      priority: 0.6,
      url: `${baseUrl}/login`,
    },
  ];
}
