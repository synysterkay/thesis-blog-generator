import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsent } from "@/components/cookie-consent";
import { ExitIntentPopup } from "@/components/exit-intent-popup";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Thesis Generator - Generate Complete Academic Theses with AI",
    template: "%s | Thesis Generator",
  },
  description: "Create 90+ page research papers with proper structure, auto-generated tables & charts, and human-like academic writing. The most advanced AI thesis generator.",
  keywords: [
    "thesis generator",
    "AI thesis writer",
    "academic writing",
    "thesis help",
    "dissertation generator",
    "research paper writer",
    "AI academic assistant",
    "essay ai",
    "write my dissertation ai",
    "free thesis writer",
    "literature review generator",
    "thesis statement generator",
    "academic paper generator",
    "dissertation writing ai",
  ],
  authors: [{ name: "Thesis Generator" }],
  creator: "Thesis Generator",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.thesisgenerator.io",
    title: "Thesis Generator - Generate Complete Academic Theses with AI",
    description: "Create 90+ page research papers with proper structure, auto-generated tables & charts, and human-like academic writing.",
    siteName: "Thesis Generator",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Thesis Generator - AI Thesis Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Thesis Generator - Generate Complete Academic Theses with AI",
    description: "Create 90+ page research papers with proper structure, auto-generated tables & charts, and human-like academic writing.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon-16x16.svg",
    apple: "/apple-touch-icon.svg",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Thesis Generator",
    "alternateName": "Thesis Generator",
    "url": "https://www.thesisgenerator.io",
    "logo": "https://www.thesisgenerator.io/logo.png",
    "description": "AI-powered thesis and dissertation generator for graduate students and researchers",
    "sameAs": [
      "https://twitter.com/thesisgenerator"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "url": "https://www.thesisgenerator.io/support"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Thesis Generator - AI Thesis Generator",
    "url": "https://www.thesisgenerator.io",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.thesisgenerator.io/blog?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* TikTok Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                ttq.load('D63O03RC77U6E0JT80VG');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-NCXDFHSW');`,
          }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${inter.variable} font-sans`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NCXDFHSW"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              },
            }}
          />
          <CookieConsent />
          <ExitIntentPopup />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
