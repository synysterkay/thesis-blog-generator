import { NextResponse } from 'next/server'

const SITE_URL = 'https://thesisgenerator.io'

interface BlogPost {
  slug: string;
  date: string;
  publishedAt?: string;
}

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority: string;
  changefreq: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(
      'https://raw.githubusercontent.com/synysterkay/thesis-blog-generator/main/posts/index.json',
      { 
        next: { revalidate: 3600 },
        signal: controller.signal
      }
    )
    clearTimeout(timeoutId)
    
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const posts = await getBlogPosts()
  
  // Core pages with high priority
  const staticUrls: SitemapUrl[] = [
    // Homepage - highest priority
    { loc: SITE_URL, priority: '1.0', changefreq: 'daily', lastmod: today },
    
    // Main app pages
    { loc: `${SITE_URL}/app`, priority: '0.9', changefreq: 'weekly', lastmod: today },
    
    // Blog main page
    { loc: `${SITE_URL}/blog`, priority: '0.9', changefreq: 'daily', lastmod: today },
    
    // About page
    { loc: `${SITE_URL}/about`, priority: '0.8', changefreq: 'monthly', lastmod: today },
    
    // Help/Documentation
    { loc: `${SITE_URL}/help`, priority: '0.7', changefreq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/documentation`, priority: '0.7', changefreq: 'monthly', lastmod: today },
    
    // Contact
    { loc: `${SITE_URL}/contact`, priority: '0.6', changefreq: 'monthly', lastmod: today },
    
    // Legal pages
    { loc: `${SITE_URL}/privacy`, priority: '0.4', changefreq: 'yearly', lastmod: today },
    { loc: `${SITE_URL}/terms`, priority: '0.4', changefreq: 'yearly', lastmod: today },
  ]

  // Blog posts with dynamic lastmod dates
  const blogUrls: SitemapUrl[] = posts.map((post: BlogPost) => ({
    loc: `${SITE_URL}/blog/${post.slug}`,
    lastmod: formatDate(post.publishedAt || post.date),
    priority: '0.8',
    changefreq: 'monthly'
  }))

  const allUrls = [...staticUrls, ...blogUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod || today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
