import { MetadataRoute } from 'next'

const SITE_URL = 'https://thesisgenerator.io'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/app/settings',
          '/app/thesis/*/chapter/*', // Private chapter editing
          '/_next/static/',
          '/*.woff2$',
          '/*.woff$',
          '/*?plan=',
          '/*?_rsc=',
          '/*?ref=',
          '/*?utm_',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/app/settings',
          '/_next/static/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/app/settings',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
