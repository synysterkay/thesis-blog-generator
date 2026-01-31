import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/auth-provider";

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
  ],
  authors: [{ name: "Thesis Generator" }],
  creator: "Thesis Generator",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thesisai.io",
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
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
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
        </AuthProvider>
      </body>
    </html>
  );
}
