import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts, BlogPost } from '@/lib/blog/github-fetcher';
import { getBlogImageByIndex } from '@/lib/blog-images';
import BlogPostClient from './BlogPostClient';

const SITE_URL = 'https://thesisgenerator.io';

// Static fallback posts for when GitHub is unavailable
const staticPosts: Record<string, BlogPost> = {
  'how-to-write-thesis-introduction': {
    slug: 'how-to-write-thesis-introduction',
    title: 'How to Write a Compelling Thesis Introduction in 2026',
    excerpt: 'Learn the key elements of a strong thesis introduction that captures your readers attention and sets up your research effectively.',
    description: 'Learn the key elements of a strong thesis introduction that captures your readers attention.',
    category: 'Writing Tips',
    author: 'ThesisAI Research Team',
    date: 'January 28, 2026',
    readTime: '8 min read',
    image: getBlogImageByIndex(0),
    featured: true,
    tags: ['thesis writing', 'introduction', 'academic writing'],
    keywords: ['thesis introduction', 'how to write thesis', 'thesis writing tips'],
    content: `## The Foundation of Your Research

Your thesis introduction is more than just an opening - its the foundation upon which your entire research project stands. A well-crafted introduction accomplishes several critical objectives: it engages your reader, establishes the context of your research, and clearly articulates the significance of your work.

## Key Elements of a Strong Introduction

### 1. The Hook

Start with something that captures attention. This could be a striking statistic, a thought-provoking question, or a brief anecdote that illustrates the problem you are addressing. The goal is to make your reader want to continue.

### 2. Background Context

Provide enough background information so readers can understand your topic without being experts in the field. This section should progressively narrow from the broad topic area to your specific research focus.

### 3. Problem Statement

Clearly articulate the gap in knowledge or the problem that your research addresses. This is where you justify why your research matters and needs to be done.

### 4. Research Objectives

State your research objectives or questions clearly and concisely. These should flow naturally from your problem statement and set up the structure for the rest of your thesis.

### 5. Thesis Statement

End with a clear thesis statement that presents your main argument or the central claim of your research. This gives readers a roadmap of what to expect.

## Common Mistakes to Avoid

- **Being too broad**: Do not try to cover too much ground. Focus on your specific contribution.
- **Burying the thesis**: Do not make readers hunt for your main argument.
- **Overpromising**: Be realistic about what your research achieves.
- **Neglecting significance**: Always explain why your research matters.

## Using AI to Enhance Your Introduction

Tools like ThesisAI can help you brainstorm ideas, identify gaps in your logic, and refine your language. However, remember that AI is a tool to enhance your thinking, not replace it. Your unique perspective and scholarly voice should always shine through.

## Final Thoughts

Writing a compelling thesis introduction takes time and multiple revisions. Do not expect perfection on your first draft. Instead, focus on getting your ideas down, then refine them through iterative revision.

## Frequently Asked Questions

### How long should a thesis introduction be?

A thesis introduction is typically 5-10% of your total thesis length. For a 10,000-word thesis, aim for 500-1000 words.

### Should I write the introduction first or last?

Many experienced writers recommend drafting your introduction first, then revising it after completing the rest of your thesis. This allows you to ensure it accurately reflects your final work.

### Can I use AI to help write my thesis introduction?

Yes, AI tools like ThesisAI can help you brainstorm, organize ideas, and refine your writing. Just ensure you maintain your own voice and verify all content.
`,
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  let post = await getPostBySlug(slug);
  
  if (!post && staticPosts[slug]) {
    post = staticPosts[slug];
  }

  if (!post) {
    return {
      title: 'Post Not Found | ThesisAI Blog',
    };
  }

  return {
    title: `${post.title} | ThesisAI Blog`,
    description: post.description || post.excerpt,
    keywords: post.keywords || post.tags,
    authors: [{ name: post.author || 'ThesisAI Team' }],
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: 'ThesisAI',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'ThesisAI Team'],
      images: post.image ? [
        {
          url: post.image,
          width: 800,
          height: 600,
          alt: post.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description || post.excerpt,
      images: post.image ? [post.image] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  const staticSlugs = Object.keys(staticPosts);
  const githubSlugs = posts.map(p => p.slug);
  const allSlugs = [...new Set([...staticSlugs, ...githubSlugs])];
  
  return allSlugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  let post = await getPostBySlug(slug);
  
  if (!post && staticPosts[slug]) {
    post = staticPosts[slug];
  }

  if (!post) {
    notFound();
  }

  return <BlogPostClient post={post} />;
}
