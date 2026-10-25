import type { Metadata } from "next";
import { getBaseUrl, SITE_CONFIG } from "./config";

export interface CreatePageMetadataOptions {
  description?: string;
  image?: string;
  path?: string;
  robots?: Metadata["robots"];
  title?: string;
}

/**
 * Builds a type-safe Metadata object adhering to Next.js metadata standards.
 */
export function createPageMetadata({
  description = SITE_CONFIG.description,
  image,
  path,
  robots,
  title,
}: CreatePageMetadataOptions = {}): Metadata {
  const baseUrl = getBaseUrl();
  let canonicalPath: string | undefined;
  if (path) {
    canonicalPath = path.startsWith("/") ? path : `/${path}`;
  }

  const canonicalUrl =
    canonicalPath === "/" || !canonicalPath
      ? baseUrl
      : `${baseUrl}${canonicalPath}`;

  const ogImageUrl = image ?? `${baseUrl}/opengraph-image`;
  const twitterImageUrl = image ?? `${baseUrl}/twitter-image`;
  const imageAlt = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`;

  return {
    alternates: {
      canonical: canonicalUrl,
    },
    description,
    openGraph: {
      description,
      images: [
        {
          alt: imageAlt,
          height: 630,
          url: ogImageUrl,
          width: 1200,
        },
      ],
      locale: "en_US",
      siteName: SITE_CONFIG.name,
      title,
      type: "website",
      url: canonicalUrl,
    },
    robots,
    title,
    twitter: {
      card: "summary_large_image",
      creator: SITE_CONFIG.creator,
      description,
      images: [twitterImageUrl],
      title,
    },
  };
}
