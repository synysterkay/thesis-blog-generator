import { Metadata } from 'next';
import { getBlogImageByIndex } from '@/lib/blog-images';
import BlogPageClient from './BlogPageClient';

const SITE_URL = 'https://thesisgenerator.io';

export const metadata: Metadata = {
  title: 'Blog - Thesis Writing Tips & AI Research Guides | Thesis Generator',
  description: 'Expert guides on thesis writing, dissertation help, research methodology, and AI-powered academic writing. Tips for graduate students, PhD candidates, and researchers.',
  keywords: [
    'thesis writing tips',
    'dissertation help',
    'AI thesis generator',
    'research methodology guide',
    'how to write a thesis',
    'thesis writing software',
    'academic writing tips',
    'literature review guide',
    'thesis structure',
    'PhD dissertation help',
    'graduate thesis writing',
    'thesis introduction tips',
    'research paper writing',
    'AI academic writing',
  ],
  openGraph: {
    title: 'Blog - Thesis Writing Tips & AI Research Guides | Thesis Generator',
    description: 'Expert guides on thesis writing, dissertation help, and AI-powered academic writing for graduate students and researchers.',
    url: `${SITE_URL}/blog`,
    siteName: 'Thesis Generator',
    type: 'website',
    images: [
      {
        url: getBlogImageByIndex(0),
        width: 800,
        height: 600,
        alt: 'Thesis Generator Blog - Academic Writing Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Thesis Writing Tips & AI Research Guides | Thesis Generator',
    description: 'Expert guides on thesis writing, dissertation help, and AI-powered academic writing.',
    images: [getBlogImageByIndex(0)],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

interface BlogPost {
  slug: string;
  title: string;
  filename?: string;
  category: string;
  imageIndex?: number;
  image?: string;
  date: string;
  excerpt?: string;
  readTime?: string;
  featured?: boolean;
  author?: string;
  tags?: string[];
}

// Static fallback posts for initial render
const staticPosts: BlogPost[] = [
  {
    slug: 'how-to-write-thesis-introduction',
    title: 'How to Write a Compelling Thesis Introduction in 2026',
    excerpt: 'Learn the key elements of a strong thesis introduction that captures your reader\'s attention and sets up your research effectively.',
    category: 'Writing Tips',
    date: 'January 28, 2026',
    readTime: '8 min read',
    image: getBlogImageByIndex(0),
    featured: true,
    author: 'Thesis Generator Research Team',
    tags: ['thesis writing', 'introduction', 'academic writing'],
  },
  {
    slug: 'literature-review-best-practices',
    title: 'Literature Review Best Practices for Graduate Students',
    excerpt: 'A comprehensive guide to conducting and writing an effective literature review that demonstrates your scholarly expertise.',
    category: 'Research',
    date: 'January 25, 2026',
    readTime: '12 min read',
    image: getBlogImageByIndex(1),
    featured: true,
    author: 'Thesis Generator Research Team',
    tags: ['literature review', 'research', 'graduate school'],
  },
  {
    slug: 'ai-thesis-writing-guide',
    title: 'How AI Can Help You Write Your Thesis Faster',
    excerpt: 'Discover how AI-powered tools like Thesis Generator can accelerate your thesis writing process while maintaining academic integrity.',
    category: 'Technology',
    date: 'January 22, 2026',
    readTime: '10 min read',
    image: getBlogImageByIndex(15),
    featured: true,
    author: 'Thesis Generator Research Team',
    tags: ['AI writing', 'thesis generator', 'productivity'],
  },
  {
    slug: 'thesis-methodology-chapter-guide',
    title: 'Writing Your Methodology Chapter: A Step-by-Step Guide',
    excerpt: 'Master the art of explaining your research methodology with clarity and precision that will impress your thesis committee.',
    category: 'Guides',
    date: 'January 18, 2026',
    readTime: '15 min read',
    image: getBlogImageByIndex(20),
    featured: false,
    author: 'Thesis Generator Research Team',
    tags: ['methodology', 'research methods', 'thesis writing'],
  },
  {
    slug: 'overcome-writers-block-thesis',
    title: 'Overcoming Writer\'s Block During Your Thesis Journey',
    excerpt: 'Practical strategies and techniques to push through creative blocks and maintain momentum in your thesis writing.',
    category: 'Productivity',
    date: 'January 15, 2026',
    readTime: '7 min read',
    image: getBlogImageByIndex(25),
    featured: false,
    author: 'Thesis Generator Research Team',
    tags: ['productivity', 'writers block', 'motivation'],
  },
  {
    slug: 'citation-styles-apa-mla-chicago',
    title: 'APA, MLA, Chicago: Which Citation Style Should You Use?',
    excerpt: 'A detailed comparison of major citation styles and guidance on choosing the right one for your academic discipline.',
    category: 'Research',
    date: 'January 12, 2026',
    readTime: '9 min read',
    image: getBlogImageByIndex(2),
    featured: false,
    author: 'Thesis Generator Research Team',
    tags: ['citations', 'APA', 'MLA', 'Chicago style'],
  },
];

async function getGitHubPosts(): Promise<BlogPost[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      'https://raw.githubusercontent.com/synysterkay/thesis-blog-generator/main/posts/index.json',
      { 
        next: { revalidate: 300 }, // Revalidate every 5 minutes
        signal: controller.signal 
      }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) return [];
    
    const posts = await response.json();
    return posts.map((post: BlogPost, index: number) => ({
      ...post,
      image: post.image || getBlogImageByIndex(post.imageIndex || index),
    }));
  } catch (error) {
    console.warn('Failed to fetch blog posts from GitHub:', error);
    return [];
  }
}

export default async function BlogPage() {
  const githubPosts = await getGitHubPosts();
  
  // Use GitHub posts if available, otherwise fallback to static
  const posts = githubPosts.length > 0 ? githubPosts : staticPosts;

  return <BlogPageClient posts={posts} />;
}
