import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import { getBaseUrl, SITE_CONFIG } from "@/lib/seo/config";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  authors: [{ name: SITE_CONFIG.author.name, url: SITE_CONFIG.author.url }],
  creator: SITE_CONFIG.creator,
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    description: SITE_CONFIG.description,
    locale: "en_US",
    siteName: SITE_CONFIG.name,
    title: {
      default: "Debug Arena - Master Software Debugging",
      template: "%s | Debug Arena",
    },
    type: "website",
    url: getBaseUrl(),
  },
  publisher: SITE_CONFIG.name,
  title: {
    default: "Debug Arena - Master Software Debugging",
    template: "%s | Debug Arena",
  },
  twitter: {
    card: "summary_large_image",
    creator: SITE_CONFIG.creator,
    description: SITE_CONFIG.description,
    title: {
      default: "Debug Arena - Master Software Debugging",
      template: "%s | Debug Arena",
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      className={cn("font-sans", geist.variable)}
      lang="en"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JWHPCBPHYL"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-JWHPCBPHYL');
          `}
        </Script>
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
