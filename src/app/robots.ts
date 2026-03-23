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
      // AI crawlers — explicitly allowed
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'Bytespider',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
      {
        userAgent: 'cohere-ai',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/auth/', '/app/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
