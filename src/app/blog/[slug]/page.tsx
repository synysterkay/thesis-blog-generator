import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostBySlug, getAllPosts, BlogPost } from '@/lib/blog/github-fetcher';
import { getBlogImageByIndex } from '@/lib/blog-images';
import BlogPostClient from './BlogPostClient';

const SITE_URL = 'https://www.thesisgenerator.io';

// Static fallback posts for when GitHub is unavailable
const staticPosts: Record<string, BlogPost> = {
  'how-to-write-thesis-introduction': {
    slug: 'how-to-write-thesis-introduction',
    title: 'How to Write a Compelling Thesis Introduction in 2026',
    excerpt: 'Learn the key elements of a strong thesis introduction that captures your readers attention and sets up your research effectively.',
    description: 'Learn the key elements of a strong thesis introduction that captures your readers attention.',
    category: 'Writing Tips',
    author: 'Thesis Generator Research Team',
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

Start with something that captures attention. This could be a striking statistic, a thought-provoking question, or a brief anecdote that illustrates the problem you are addressing.

### 2. Background Context

Provide enough background information so readers can understand your topic without being experts in the field.

### 3. Problem Statement

Clearly articulate the gap in knowledge or the problem that your research addresses.

### 4. Research Objectives

State your research objectives or questions clearly and concisely.

### 5. Thesis Statement

End with a clear thesis statement that presents your main argument.

## Try Thesis Generator Today

Ready to write your thesis introduction faster? [Thesis Generator](https://www.thesisgenerator.io) can help you brainstorm ideas, structure your arguments, and refine your writing.

## Frequently Asked Questions

### How long should a thesis introduction be?

A thesis introduction is typically 5-10% of your total thesis length.

### Can I use AI to help write my thesis introduction?

Yes, AI tools like [Thesis Generator](https://www.thesisgenerator.io) can help you brainstorm and organize ideas.
`,
  },
  'literature-review-best-practices': {
    slug: 'literature-review-best-practices',
    title: 'Literature Review Best Practices for Graduate Students',
    excerpt: 'A comprehensive guide to conducting and writing an effective literature review that demonstrates your scholarly expertise.',
    description: 'Master the art of writing literature reviews with best practices for graduate students.',
    category: 'Research',
    author: 'Thesis Generator Research Team',
    date: 'January 25, 2026',
    readTime: '12 min read',
    image: getBlogImageByIndex(1),
    featured: true,
    tags: ['literature review', 'research', 'graduate school'],
    keywords: ['literature review', 'how to write literature review', 'research methods'],
    content: `## What is a Literature Review?

A literature review is a comprehensive survey of scholarly sources on a specific topic. It provides an overview of current knowledge, allowing you to identify relevant theories, methods, and gaps in the existing research.

## Steps to Write an Effective Literature Review

### 1. Define Your Research Question

Before diving into the literature, clearly define what you want to learn about.

### 2. Search for Relevant Literature

Use academic databases like Google Scholar, JSTOR, and PubMed to find peer-reviewed articles.

### 3. Evaluate Sources

Critically assess each source for relevance, credibility, and contribution to your research.

### 4. Analyze and Synthesize

Look for patterns, themes, debates, and gaps across your sources.

### 5. Write Your Review

Organize your review thematically or chronologically, and include critical analysis.

## Try Thesis Generator Today

[Thesis Generator](https://www.thesisgenerator.io) can help you organize and synthesize your literature review efficiently.

## Frequently Asked Questions

### How many sources should a literature review have?

For a master's thesis, typically 40-50 sources; for a PhD, 100+ sources.

### How long should a literature review be?

Usually 20-40% of your total thesis length.
`,
  },
  'ai-thesis-writing-guide': {
    slug: 'ai-thesis-writing-guide',
    title: 'How AI Can Help You Write Your Thesis Faster',
    excerpt: 'Discover how AI-powered tools like Thesis Generator can accelerate your thesis writing process while maintaining academic integrity.',
    description: 'Learn how AI tools can help you write your thesis faster while maintaining quality.',
    category: 'Technology',
    author: 'Thesis Generator Research Team',
    date: 'January 22, 2026',
    readTime: '10 min read',
    image: getBlogImageByIndex(15),
    featured: true,
    tags: ['AI writing', 'thesis generator', 'productivity'],
    keywords: ['AI thesis writing', 'thesis generator', 'AI academic writing'],
    content: `## The AI Revolution in Academic Writing

Artificial Intelligence is transforming how we approach academic writing. Tools like [Thesis Generator](https://www.thesisgenerator.io) can help you work smarter, not harder.

## How AI Helps with Thesis Writing

### 1. Outline Generation

AI can help you create structured outlines for your chapters based on your research topic.

### 2. Writing Assistance

Get help overcoming writer's block with AI-powered suggestions and drafts.

### 3. Research Organization

AI can help you organize and synthesize research from multiple sources.

### 4. Citation Management

Automated citation formatting saves hours of tedious work.

## Maintaining Academic Integrity

While AI is a powerful tool, remember:
- Always verify AI-generated content
- Use AI as an assistant, not a replacement for your thinking
- Cite your sources properly
- Follow your institution's guidelines on AI use

## Try Thesis Generator Today

Ready to accelerate your thesis writing? [Start with Thesis Generator](https://www.thesisgenerator.io) and experience the future of academic writing.

## Frequently Asked Questions

### Is using AI for thesis writing ethical?

Yes, when used as a tool to assist your own work, not to replace it.

### Can AI write my entire thesis?

AI should assist your writing, not replace your original research and analysis.
`,
  },
  'thesis-methodology-chapter-guide': {
    slug: 'thesis-methodology-chapter-guide',
    title: 'Writing Your Methodology Chapter: A Step-by-Step Guide',
    excerpt: 'Master the art of explaining your research methodology with clarity and precision.',
    description: 'A complete guide to writing your thesis methodology chapter.',
    category: 'Guides',
    author: 'Thesis Generator Research Team',
    date: 'January 18, 2026',
    readTime: '15 min read',
    image: getBlogImageByIndex(20),
    featured: false,
    tags: ['methodology', 'research methods', 'thesis writing'],
    keywords: ['thesis methodology', 'research methodology', 'methodology chapter'],
    content: `## What is a Methodology Chapter?

The methodology chapter explains how you conducted your research. It justifies your research design and methods.

## Key Components

### 1. Research Design

Explain whether your study is qualitative, quantitative, or mixed methods.

### 2. Data Collection Methods

Describe how you gathered your data (surveys, interviews, experiments, etc.).

### 3. Sampling Strategy

Explain how you selected your participants or data sources.

### 4. Data Analysis

Describe the analytical techniques you used.

### 5. Limitations

Acknowledge the limitations of your methodology.

## Try Thesis Generator Today

[Thesis Generator](https://www.thesisgenerator.io) can help you structure your methodology chapter effectively.
`,
  },
  'overcome-writers-block-thesis': {
    slug: 'overcome-writers-block-thesis',
    title: "Overcoming Writer's Block During Your Thesis Journey",
    excerpt: 'Practical strategies and techniques to push through creative blocks.',
    description: "Strategies to overcome writer's block while writing your thesis.",
    category: 'Productivity',
    author: 'Thesis Generator Research Team',
    date: 'January 15, 2026',
    readTime: '7 min read',
    image: getBlogImageByIndex(25),
    featured: false,
    tags: ['productivity', 'writers block', 'motivation'],
    keywords: ['writers block', 'thesis writing tips', 'academic productivity'],
    content: `## Understanding Writer's Block

Writer's block is common among graduate students. Understanding its causes can help you overcome it.

## Strategies to Overcome Writer's Block

### 1. Start with the Easiest Section

Don't force yourself to write in order. Start where you feel most confident.

### 2. Set Small Goals

Write for 25 minutes at a time using the Pomodoro technique.

### 3. Use AI Tools

[Thesis Generator](https://www.thesisgenerator.io) can help generate initial drafts to get you started.

### 4. Change Your Environment

Sometimes a new location can spark creativity.

### 5. Talk Through Your Ideas

Explain your research to someone else to clarify your thoughts.

## Try Thesis Generator Today

Stuck on your thesis? [Thesis Generator](https://www.thesisgenerator.io) can help you break through writer's block.
`,
  },
  'citation-styles-apa-mla-chicago': {
    slug: 'citation-styles-apa-mla-chicago',
    title: 'APA, MLA, Chicago: Which Citation Style Should You Use?',
    excerpt: 'A detailed comparison of major citation styles.',
    description: 'Compare APA, MLA, and Chicago citation styles to choose the right one.',
    category: 'Research',
    author: 'Thesis Generator Research Team',
    date: 'January 12, 2026',
    readTime: '9 min read',
    image: getBlogImageByIndex(2),
    featured: false,
    tags: ['citations', 'APA', 'MLA', 'Chicago style'],
    keywords: ['citation styles', 'APA format', 'MLA format', 'Chicago style'],
    content: `## Understanding Citation Styles

Different academic disciplines use different citation styles. Here's a guide to help you choose.

## APA Style

Used primarily in social sciences, education, and psychology.

## MLA Style

Commonly used in humanities, literature, and language studies.

## Chicago Style

Popular in history, fine arts, and some social sciences.

## How to Choose

Follow your department's requirements or ask your advisor.

## Try Thesis Generator Today

[Thesis Generator](https://www.thesisgenerator.io) supports multiple citation styles and can format your references automatically.
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
      title: 'Post Not Found | Thesis Generator Blog',
    };
  }

  return {
    title: `${post.title} | Thesis Generator Blog`,
    description: post.description || post.excerpt,
    keywords: post.keywords || post.tags,
    authors: [{ name: post.author || 'Thesis Generator Team' }],
    openGraph: {
      title: post.title,
      description: post.description || post.excerpt,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: 'Thesis Generator',
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'Thesis Generator Team'],
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

  // Fetch related posts for SEO internal linking
  const allPosts = await getAllPosts();
  const staticPostsList = Object.values(staticPosts);
  const combinedPosts = [...allPosts, ...staticPostsList.filter(sp => !allPosts.find(p => p.slug === sp.slug))];
  
  // Get related posts: same category or matching tags, exclude current post
  const relatedPosts = combinedPosts
    .filter(p => p.slug !== slug)
    .map(p => {
      let score = 0;
      // Same category = high score
      if (p.category === post!.category) score += 10;
      // Matching tags = bonus score
      const postTags = post!.tags || [];
      const pTags = p.tags || [];
      const matchingTags = postTags.filter(t => pTags.includes(t)).length;
      score += matchingTags * 3;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score, ...p }) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      date: p.date,
      readTime: p.readTime,
      image: p.image,
    }));

  return <BlogPostClient post={post} relatedPosts={relatedPosts} />;
}
