import { getBaseUrl, SITE_CONFIG } from "./config";

function formatJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function OrganizationJsonLd() {
  const baseUrl = getBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    logo: `${baseUrl}/apple-icon`,
    name: SITE_CONFIG.name,
    url: baseUrl,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: formatJsonLd(schema) }}
      type="application/ld+json"
    />
  );
}

export function WebSiteJsonLd() {
  const baseUrl = getBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    description: SITE_CONFIG.description,
    name: SITE_CONFIG.name,
    url: baseUrl,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: formatJsonLd(schema) }}
      type="application/ld+json"
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const baseUrl = getBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    applicationCategory: "DeveloperApplication",
    description: SITE_CONFIG.description,
    name: SITE_CONFIG.name,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystem: "Any",
    url: baseUrl,
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: formatJsonLd(schema) }}
      type="application/ld+json"
    />
  );
}
