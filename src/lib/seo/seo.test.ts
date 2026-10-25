import { render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import AppleIcon, {
  contentType as appleContentType,
  size as appleSize,
} from "@/app/apple-icon";
import Icon, {
  contentType as iconContentType,
  size as iconSize,
} from "@/app/icon";
import OgImage, {
  alt as ogAlt,
  contentType as ogContentType,
  size as ogSize,
} from "@/app/opengraph-image";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import TwitterImage, {
  alt as twitterAlt,
  contentType as twitterContentType,
  size as twitterSize,
} from "@/app/twitter-image";
import { env } from "@/lib/env/env";
import { DEFAULT_PRODUCTION_URL, getBaseUrl, SITE_CONFIG } from "./config";
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from "./json-ld";
import { createPageMetadata } from "./metadata";
import { SocialCard } from "./social-card";

describe("SEO Configuration & getBaseUrl", () => {
  const originalVercelProjectProdUrl = env.VERCEL_PROJECT_PRODUCTION_URL;
  const originalVercelUrl = env.VERCEL_URL;
  const originalAppUrl = env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    (
      env as { VERCEL_PROJECT_PRODUCTION_URL?: string }
    ).VERCEL_PROJECT_PRODUCTION_URL = undefined;
    (env as { VERCEL_URL?: string }).VERCEL_URL = undefined;
    (env as { NEXT_PUBLIC_APP_URL?: string }).NEXT_PUBLIC_APP_URL = undefined;
  });

  afterEach(() => {
    (
      env as { VERCEL_PROJECT_PRODUCTION_URL?: string }
    ).VERCEL_PROJECT_PRODUCTION_URL = originalVercelProjectProdUrl;
    (env as { VERCEL_URL?: string }).VERCEL_URL = originalVercelUrl;
    (env as { NEXT_PUBLIC_APP_URL?: string }).NEXT_PUBLIC_APP_URL =
      originalAppUrl;
  });

  it("falls back to DEFAULT_PRODUCTION_URL when no environment variables are set", () => {
    expect(getBaseUrl()).toBe(DEFAULT_PRODUCTION_URL);
  });

  it("prioritizes env.NEXT_PUBLIC_APP_URL over Vercel variables", () => {
    (env as { NEXT_PUBLIC_APP_URL?: string }).NEXT_PUBLIC_APP_URL =
      "https://custom-domain.com/";
    (
      env as { VERCEL_PROJECT_PRODUCTION_URL?: string }
    ).VERCEL_PROJECT_PRODUCTION_URL = "production.vercel.app";
    (env as { VERCEL_URL?: string }).VERCEL_URL = "preview.vercel.app";

    expect(getBaseUrl()).toBe("https://custom-domain.com");
  });

  it("uses VERCEL_PROJECT_PRODUCTION_URL when NEXT_PUBLIC_APP_URL is absent", () => {
    (
      env as { VERCEL_PROJECT_PRODUCTION_URL?: string }
    ).VERCEL_PROJECT_PRODUCTION_URL = "debug-arena-prod.vercel.app";
    (env as { VERCEL_URL?: string }).VERCEL_URL = "preview-123.vercel.app";

    expect(getBaseUrl()).toBe("https://debug-arena-prod.vercel.app");
  });

  it("uses VERCEL_URL when neither NEXT_PUBLIC_APP_URL nor VERCEL_PROJECT_PRODUCTION_URL is set", () => {
    (env as { VERCEL_URL?: string }).VERCEL_URL =
      "debug-arena-branch.vercel.app";

    expect(getBaseUrl()).toBe("https://debug-arena-branch.vercel.app");
  });

  it("safely handles whitespace or empty strings by falling back to DEFAULT_PRODUCTION_URL", () => {
    (env as { NEXT_PUBLIC_APP_URL?: string }).NEXT_PUBLIC_APP_URL = "   ";
    expect(getBaseUrl()).toBe(DEFAULT_PRODUCTION_URL);
  });

  it("strips trailing slashes correctly", () => {
    (env as { NEXT_PUBLIC_APP_URL?: string }).NEXT_PUBLIC_APP_URL =
      "https://example.com///";
    expect(getBaseUrl()).toBe("https://example.com");
  });

  it("exposes consistent SITE_CONFIG details", () => {
    expect(SITE_CONFIG.name).toBe("Debug Arena");
    expect(SITE_CONFIG.tagline).toBe("Master Software Debugging");
    expect(SITE_CONFIG.keywords.length).toBeGreaterThan(0);
    expect(SITE_CONFIG.creator).toBe("@debugarena");
    expect(SITE_CONFIG.author.name).toBe("Debug Arena Team");
  });
});

describe("createPageMetadata", () => {
  it("builds default metadata when no options are provided", () => {
    const meta = createPageMetadata();
    expect(meta.title).toBeUndefined();
    expect(meta.description).toBe(SITE_CONFIG.description);
    expect(meta.alternates?.canonical).toBe(getBaseUrl());
    expect(meta.openGraph?.title).toBeUndefined();
    expect(
      meta.openGraph && "type" in meta.openGraph ? meta.openGraph.type : null
    ).toBe("website");
    expect(
      meta.twitter && "card" in meta.twitter ? meta.twitter.card : null
    ).toBe("summary_large_image");
    expect(meta.twitter?.creator).toBe(SITE_CONFIG.creator);
    expect(meta.openGraph?.images).toEqual([
      {
        alt: `${SITE_CONFIG.name} - ${SITE_CONFIG.tagline}`,
        height: 630,
        url: `${getBaseUrl()}/opengraph-image`,
        width: 1200,
      },
    ]);
    expect(meta.twitter?.images).toEqual([`${getBaseUrl()}/twitter-image`]);
  });

  it("constructs canonical URL and assigns un-suffixed titles for layout template delegation", () => {
    const meta = createPageMetadata({
      description: "Sign in to Debug Arena",
      path: "/login",
      title: "Sign In",
    });

    const expectedUrl = `${getBaseUrl()}/login`;
    expect(meta.title).toBe("Sign In");
    expect(meta.description).toBe("Sign in to Debug Arena");
    expect(meta.alternates?.canonical).toBe(expectedUrl);
    expect(meta.openGraph?.url).toBe(expectedUrl);
    expect(meta.openGraph?.title).toBe("Sign In");
    expect(meta.twitter?.title).toBe("Sign In");
  });

  it("supports custom og and twitter image override", () => {
    const customImage = "https://example.com/custom-card.png";
    const meta = createPageMetadata({
      image: customImage,
      path: "/custom",
      title: "Custom",
    });

    expect(meta.openGraph?.images).toEqual([
      {
        alt: `Custom | ${SITE_CONFIG.name}`,
        height: 630,
        url: customImage,
        width: 1200,
      },
    ]);
    expect(meta.twitter?.images).toEqual([customImage]);
  });

  it("handles root path without duplicate slashes", () => {
    const meta = createPageMetadata({
      path: "/",
    });
    expect(meta.alternates?.canonical).toBe(getBaseUrl());
  });

  it("attaches robots options when provided", () => {
    const meta = createPageMetadata({
      robots: { follow: false, index: false },
      title: "Reset Password",
    });
    expect(meta.robots).toEqual({ follow: false, index: false });
  });
});

describe("robots route", () => {
  it("produces valid robots directives with expected allowed and disallowed routes", () => {
    const result = robots();
    const baseUrl = getBaseUrl();

    expect(result.sitemap).toBe(`${baseUrl}/sitemap.xml`);
    expect(result.rules).toBeDefined();

    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.userAgent).toBe("*");
    expect(rules.allow).toEqual(["/$", "/login", "/register"]);
    expect(rules.disallow).toEqual([
      "/challenges",
      "/leaderboard",
      "/profile",
      "/settings",
      "/submissions",
      "/admin",
      "/api",
      "/forgot-password",
    ]);
  });
});

describe("sitemap route", () => {
  it("generates entries for all indexed public routes with correct priorities", () => {
    const entries = sitemap();
    const baseUrl = getBaseUrl();

    expect(entries).toHaveLength(3);

    const rootEntry = entries.find((e) => e.url === baseUrl);
    expect(rootEntry).toBeDefined();
    expect(rootEntry?.priority).toBe(1.0);
    expect(rootEntry?.changeFrequency).toBe("daily");

    const registerEntry = entries.find((e) => e.url === `${baseUrl}/register`);
    expect(registerEntry).toBeDefined();
    expect(registerEntry?.priority).toBe(0.8);
    expect(registerEntry?.changeFrequency).toBe("monthly");

    const loginEntry = entries.find((e) => e.url === `${baseUrl}/login`);
    expect(loginEntry).toBeDefined();
    expect(loginEntry?.priority).toBe(0.6);
    expect(loginEntry?.changeFrequency).toBe("monthly");
  });
});

describe("JSON-LD components", () => {
  it("renders valid Organization JSON-LD script with valid logo dimensions and clean fields", () => {
    const { container } = render(React.createElement(OrganizationJsonLd));
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent ?? "{}");
    expect(json["@type"]).toBe("Organization");
    expect(json.name).toBe("Debug Arena");
    expect(json.url).toBe(getBaseUrl());
    expect(json.logo).toBe(`${getBaseUrl()}/apple-icon`);
    expect(json.sameAs).toBeUndefined();
  });

  it("renders valid WebSite JSON-LD script", () => {
    const { container } = render(React.createElement(WebSiteJsonLd));
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent ?? "{}");
    expect(json["@type"]).toBe("WebSite");
    expect(json.name).toBe("Debug Arena");
    expect(json.url).toBe(getBaseUrl());
    expect(json.description).toBe(SITE_CONFIG.description);
  });

  it("renders valid SoftwareApplication JSON-LD script", () => {
    const { container } = render(
      React.createElement(SoftwareApplicationJsonLd)
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const json = JSON.parse(script?.textContent ?? "{}");
    expect(json["@type"]).toBe("SoftwareApplication");
    expect(json.name).toBe("Debug Arena");
    expect(json.applicationCategory).toBe("DeveloperApplication");
    expect(json.offers?.price).toBe("0");
  });

  describe("SocialCard Component", () => {
    it("renders default social card branding, headline, and feature badges", () => {
      const { container } = render(React.createElement(SocialCard));
      expect(container.textContent).toContain("Debug Arena");
      expect(container.textContent).toContain("Master Software Debugging");
      expect(container.textContent).toContain("AI Bug Injection");
      expect(container.textContent).toContain("Real-World Scenarios");
      expect(container.textContent).toContain("Diagnostic Radar");
      expect(container.textContent).toContain("Live Evaluation");
    });
  });

  describe("Dynamic visual asset routes", () => {
    it("exports valid size, contentType, and alt for opengraph-image", () => {
      expect(ogSize).toEqual({ height: 630, width: 1200 });
      expect(ogContentType).toBe("image/png");
      expect(ogAlt).toBe("Debug Arena - Master Software Debugging");
      const res = OgImage();
      expect(res).toBeInstanceOf(Response);
    });

    it("exports valid size, contentType, and alt for twitter-image", () => {
      expect(twitterSize).toEqual({ height: 630, width: 1200 });
      expect(twitterContentType).toBe("image/png");
      expect(twitterAlt).toBe("Debug Arena - Master Software Debugging");
      const res = TwitterImage();
      expect(res).toBeInstanceOf(Response);
    });

    it("exports valid size and contentType for favicon icon (32x32)", () => {
      expect(iconSize).toEqual({ height: 32, width: 32 });
      expect(iconContentType).toBe("image/png");
      const res = Icon();
      expect(res).toBeInstanceOf(Response);
    });

    it("exports valid size (180x180) and contentType for apple-icon", () => {
      expect(appleSize).toEqual({ height: 180, width: 180 });
      expect(appleContentType).toBe("image/png");
      const res = AppleIcon();
      expect(res).toBeInstanceOf(Response);
    });
  });
});
