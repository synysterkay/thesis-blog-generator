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
