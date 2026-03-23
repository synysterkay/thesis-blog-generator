import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { CookieConsent } from "@/components/cookie-consent";
import { ExitIntentPopup } from "@/components/exit-intent-popup";
import { MobileAppBanner } from "@/components/mobile-app-banner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
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

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Thesis Generator",
    "operatingSystem": "Web, Android, iOS",
    "applicationCategory": "EducationalApplication",
    "url": "https://www.thesisgenerator.io",
    "description": "AI-powered thesis and dissertation generator that creates complete 90+ page academic papers with proper structure, auto-generated tables & charts, and human-like academic writing.",
    "screenshot": "https://www.thesisgenerator.io/og-image.png",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free",
        "price": "0",
        "priceCurrency": "USD",
        "description": "1 thesis per month, up to 10 chapters, 7-day access"
      },
      {
        "@type": "Offer",
        "name": "Pro",
        "price": "9.00",
        "priceCurrency": "USD",
        "billingIncrement": 1,
        "description": "5 theses per month, unlimited chapters, PDF/DOCX/LaTeX export"
      },
      {
        "@type": "Offer",
        "name": "Pro Unlimited",
        "price": "19.00",
        "priceCurrency": "USD",
        "billingIncrement": 1,
        "description": "Unlimited theses, priority AI processing, all export formats"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5"
    },
    "featureList": "Complete thesis generation, Auto tables & charts, AI humanization, PDF/DOCX/LaTeX export, Multi-language support, Reference uploads, APA/MLA/Chicago citations"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Thesis Generator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Thesis Generator is an AI-powered tool that creates complete 90+ page academic theses with proper chapter structure, auto-generated tables and charts, citations, and human-like academic writing. It supports all major academic fields and export formats (PDF, DOCX, LaTeX)."
        }
      },
      {
        "@type": "Question",
        "name": "Will the generated content pass plagiarism checks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The AI generates 100% original content. Each thesis is uniquely created based on your specific topic and requirements. The AI humanization feature ensures content passes Turnitin and other AI detection tools."
        }
      },
      {
        "@type": "Question",
        "name": "How much does Thesis Generator cost?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Thesis Generator offers a Free plan (1 thesis/month), Pro plan at $9/month (5 theses/month with exports), and Pro Unlimited at $19/month (unlimited theses with priority processing). There's also a $4 one-time export option for individual theses."
        }
      },
      {
        "@type": "Question",
        "name": "What academic fields are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All major academic fields are supported including Computer Science, Business, Psychology, Engineering, Medicine, Law, Social Sciences, Humanities, Education, Environmental Science, and more. The AI adapts its writing style to your specific field."
        }
      },
      {
        "@type": "Question",
        "name": "How long does thesis generation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A complete 90+ page thesis typically takes 20-40 minutes to generate, depending on complexity. You can watch the progress in real-time and start editing sections as they are completed."
        }
      },
      {
        "@type": "Question",
        "name": "Can I edit the generated content?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, you have full control over every section. You can edit text, regenerate specific parts, add your own content, and modify tables and charts. It's your thesis to customize."
        }
      },
      {
        "@type": "Question",
        "name": "Is my data secure and private?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All thesis content is encrypted and never shared with third parties. The platform complies with GDPR and CCPA regulations. You can delete your data at any time from your dashboard."
        }
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Microsoft Clarity */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vwy4jn74di");
            `,
          }}
        />
        {/* Google Ads (gtag.js) - must be first in head for detection */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-17949582063"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17949582063');
            `,
          }}
        />
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
        {/* Meta (Facebook) Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2466464767141425');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2466464767141425&ev=PageView&noscript=1"
          />
        </noscript>
        {/* Capture fbclid from URL and store in cookies */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var params = new URLSearchParams(window.location.search);
                  var fbclid = params.get('fbclid');
                  if (fbclid) {
                    var fbc = 'fb.1.' + Date.now() + '.' + fbclid;
                    document.cookie = '_fbc=' + fbc + ';max-age=7776000;path=/;SameSite=Lax';
                    document.cookie = 'fbclid=' + fbclid + ';max-age=7776000;path=/;SameSite=Lax';
                  }
                  if (!document.cookie.match(/_fbp=/)) {
                    var fbp = 'fb.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e10);
                    document.cookie = '_fbp=' + fbp + ';max-age=7776000;path=/;SameSite=Lax';
                  }
                } catch(e){}
              })();
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
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
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
          <MobileAppBanner />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
