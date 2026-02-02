#!/usr/bin/env node

/**
 * Blog Post Generator Script for Thesis Generator
 * Generates SEO-optimized MDX blog posts using DeepSeek API
 * with unique images per category and diverse topics
 * 
 * Usage: npm run generate-blog
 * Environment variables:
 *   - DEEPSEEK_API_KEY: DeepSeek API key
 *   - TOPIC: Blog post topic (optional - will pick random if empty)
 *   - KEYWORDS: Comma-separated SEO keywords
 *   - STYLE: Writing style (informative, tutorial, comparison, news)
 */

import fs from 'fs';
import path from 'path';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!DEEPSEEK_API_KEY) {
  console.error('❌ DEEPSEEK_API_KEY environment variable is required');
  process.exit(1);
}

// Diverse topic pool with predefined categories and featured status
const TOPIC_POOL = [
  // Writing Tips Category
  { topic: "How to Write a Compelling Thesis Introduction", category: "Writing Tips", featured: true },
  { topic: "Mastering Academic Writing Style: Tips for Graduate Students", category: "Writing Tips", featured: false },
  { topic: "Common Thesis Writing Mistakes and How to Avoid Them", category: "Writing Tips", featured: true },
  { topic: "How to Write a Strong Thesis Conclusion That Impresses", category: "Writing Tips", featured: false },
  { topic: "Transition Words and Phrases for Academic Writing", category: "Writing Tips", featured: false },
  { topic: "How to Improve Your Academic Vocabulary", category: "Writing Tips", featured: false },
  
  // Research Category
  { topic: "Qualitative vs Quantitative Research: Choosing the Right Method", category: "Research", featured: true },
  { topic: "How to Conduct a Systematic Literature Review", category: "Research", featured: true },
  { topic: "Primary vs Secondary Sources: A Complete Guide", category: "Research", featured: false },
  { topic: "Research Ethics: Guidelines Every Graduate Student Must Know", category: "Research", featured: false },
  { topic: "How to Find Credible Sources for Your Thesis", category: "Research", featured: false },
  { topic: "Data Collection Methods for Academic Research", category: "Research", featured: false },
  
  // Technology Category
  { topic: "AI Tools That Will Transform Your Thesis Writing in 2026", category: "Technology", featured: true },
  { topic: "Best Reference Management Software for Researchers", category: "Technology", featured: false },
  { topic: "How AI is Revolutionizing Academic Writing", category: "Technology", featured: true },
  { topic: "Plagiarism Detection Tools: What Every Student Should Know", category: "Technology", featured: false },
  { topic: "Using AI for Literature Review: A Complete Guide", category: "Technology", featured: false },
  { topic: "Digital Tools for Organizing Your Research", category: "Technology", featured: false },
  
  // Productivity Category
  { topic: "Time Management Strategies for Thesis Writers", category: "Productivity", featured: true },
  { topic: "How to Overcome Writer's Block When Writing Your Thesis", category: "Productivity", featured: false },
  { topic: "Creating a Realistic Thesis Writing Schedule", category: "Productivity", featured: false },
  { topic: "Work-Life Balance During Graduate School", category: "Productivity", featured: false },
  { topic: "Productivity Apps Every Graduate Student Needs", category: "Productivity", featured: false },
  { topic: "How to Stay Motivated During Long Research Projects", category: "Productivity", featured: true },
  
  // Guides Category
  { topic: "Complete Guide to Thesis Formatting and Structure", category: "Guides", featured: true },
  { topic: "APA vs MLA vs Chicago: Citation Styles Explained", category: "Guides", featured: false },
  { topic: "How to Prepare for Your Thesis Defense", category: "Guides", featured: true },
  { topic: "Step-by-Step Guide to Writing Your Methodology Chapter", category: "Guides", featured: false },
  { topic: "Understanding the Thesis Approval Process", category: "Guides", featured: false },
  { topic: "How to Choose the Perfect Thesis Topic", category: "Guides", featured: true },
];

// Curated Unsplash images organized by category (indices for tracking)
const categoryImages: Record<string, string[]> = {
  'Writing Tips': [
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80', // pen writing
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80', // laptop work
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80', // laptop coffee
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80', // writing desk
    'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&q=80', // writing
    'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80', // writing notes
  ],
  'Research': [
    'https://images.unsplash.com/photo-1456324463128-7ff6903988d8?w=800&q=80', // research
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80', // books
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80', // books stacked
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', // book stack
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80', // library
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', // study
  ],
  'Technology': [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80', // AI brain
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80', // AI robot
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80', // tech
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80', // circuit
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80', // robot
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80', // team laptops
  ],
  'Productivity': [
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80', // checklist
    'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80', // calendar
    'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80', // planning
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80', // team work
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80', // business
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80', // group study
  ],
  'Guides': [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', // graduation
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80', // graduation caps
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80', // university
    'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', // campus
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80', // graduation
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', // education
  ],
};

// Get recently used images from posts index
function getRecentlyUsedImages(): string[] {
  const indexPath = path.join(process.cwd(), 'posts', 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  
  try {
    const posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    // Get images from last 15 posts to avoid repetition
    return posts.slice(0, 15).map((p: { image: string }) => p.image);
  } catch {
    return [];
  }
}

// Get recently used topics
function getRecentTopics(): string[] {
  const indexPath = path.join(process.cwd(), 'posts', 'index.json');
  if (!fs.existsSync(indexPath)) return [];
  
  try {
    const posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    return posts.map((p: { title: string }) => p.title.toLowerCase());
  } catch {
    return [];
  }
}

// Select a unique image for the category
function selectUniqueImage(category: string, usedImages: string[]): string {
  const images = categoryImages[category] || categoryImages['Guides'];
  
  // Filter out recently used images
  const availableImages = images.filter(img => !usedImages.includes(img));
  
  // If all are used, pick from full list
  const imagesToChooseFrom = availableImages.length > 0 ? availableImages : images;
  
  return imagesToChooseFrom[Math.floor(Math.random() * imagesToChooseFrom.length)];
}

// Select a unique topic that hasn't been covered recently
function selectUniqueTopic(usedTopics: string[]): { topic: string; category: string; featured: boolean } {
  // Filter out topics similar to recently used ones
  const availableTopics = TOPIC_POOL.filter(t => {
    const topicLower = t.topic.toLowerCase();
    return !usedTopics.some(used => {
      // Check for significant word overlap
      const topicWords = topicLower.split(' ').filter(w => w.length > 4);
      const usedWords = used.split(' ').filter(w => w.length > 4);
      const matches = topicWords.filter(w => usedWords.includes(w));
      return matches.length > topicWords.length * 0.4; // 40% overlap threshold
    });
  });
  
  // If we've used most topics, allow reuse but prefer unused
  const topicsToChoose = availableTopics.length > 5 ? availableTopics : TOPIC_POOL;
  
  return topicsToChoose[Math.floor(Math.random() * topicsToChoose.length)];
}

const providedTopic = process.env.TOPIC || '';
const keywords = process.env.KEYWORDS?.split(',').map((k) => k.trim()) || [];
const style = process.env.STYLE || 'informative';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 60);
}

// SEO keywords for thesis/academic content
const seoKeywords = {
  primary: [
    'thesis generator',
    'AI thesis writing',
    'thesis writing help',
    'dissertation writing',
    'academic writing AI',
    'thesis writing tool',
    'research paper generator',
    'AI academic writing',
    'essay ai',
    'write my dissertation ai',
    'free thesis writer',
  ],
  secondary: [
    'how to write a thesis',
    'thesis writing tips',
    'dissertation help',
    'research methodology',
    'literature review generator',
    'thesis structure',
    'academic writing guide',
    'thesis introduction',
    'thesis conclusion',
    'thesis defense',
    'academic paper generator',
  ],
  longtail: [
    'how to write a thesis introduction',
    'best AI thesis generator 2026',
    'thesis writing software free',
    'how to structure a dissertation',
    'AI tools for academic writing',
    'thesis writing step by step guide',
    'how to write methodology chapter',
    'thesis literature review example',
    'automatic thesis statement generator',
    'ai for literature review',
    'best dissertation writing services ai',
  ],
};

async function generateBlogPost() {
  // Get recently used images and topics to avoid duplicates
  const usedImages = getRecentlyUsedImages();
  const usedTopics = getRecentTopics();
  
  // Select topic - use provided or pick random unused one
  let selectedTopic: { topic: string; category: string; featured: boolean };
  
  if (providedTopic && providedTopic.trim() !== '') {
    // Manual topic provided - try to match to a predefined one or create new
    const matchedTopic = TOPIC_POOL.find(t => 
      t.topic.toLowerCase().includes(providedTopic.toLowerCase()) ||
      providedTopic.toLowerCase().includes(t.topic.toLowerCase())
    );
    
    selectedTopic = matchedTopic || {
      topic: providedTopic,
      category: 'Guides',
      featured: false
    };
  } else {
    // Auto-select unique topic
    selectedTopic = selectUniqueTopic(usedTopics);
  }
  
  // Select unique image for this category
  const selectedImage = selectUniqueImage(selectedTopic.category, usedImages);
  
  console.log(`🚀 Generating blog post about: ${selectedTopic.topic}`);
  console.log(`📁 Category: ${selectedTopic.category}`);
  console.log(`⭐ Featured: ${selectedTopic.featured}`);
  console.log(`📝 Style: ${style}`);
  console.log(`🖼️  Image: ${selectedImage}`);
  console.log(`🔑 Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'Auto-generated'}\n`);

  // Select relevant SEO keywords if none provided
  const selectedKeywords = keywords.length > 0 
    ? keywords 
    : [
        seoKeywords.primary[Math.floor(Math.random() * seoKeywords.primary.length)],
        seoKeywords.secondary[Math.floor(Math.random() * seoKeywords.secondary.length)],
        seoKeywords.longtail[Math.floor(Math.random() * seoKeywords.longtail.length)],
      ];

  const prompt = `Generate a comprehensive, SEO-optimized blog post about "${selectedTopic.topic}" for Thesis Generator, an AI-powered thesis and dissertation writing tool.

Website: https://www.thesisgenerator.io

Style: ${style}
Category: ${selectedTopic.category}
Target keywords: ${selectedKeywords.join(', ')}

Requirements:
1. Write in a professional but engaging academic tone
2. Include practical tips, examples, and actionable advice
3. Optimize for SEO with proper heading structure (H2, H3 only - no H1)
4. Include a compelling introduction that hooks readers
5. Add a strong conclusion with call-to-action linking to https://www.thesisgenerator.io
6. Length: 2000-3000 words (high-quality, in-depth content)
7. Include relevant statistics or research data where appropriate
8. Naturally incorporate the keywords without keyword stuffing
9. IMPORTANT: Include 2-3 natural mentions of Thesis Generator with direct links to https://www.thesisgenerator.io throughout the article
10. Include FAQ section at the end with 4-5 common questions
11. Make content helpful for graduate students, researchers, and academics
12. Add a "Try Thesis Generator Today" section near the end with link to https://www.thesisgenerator.io
13. Use markdown link format: [Thesis Generator](https://www.thesisgenerator.io) or [Try Thesis Generator Free](https://www.thesisgenerator.io)

IMPORTANT: The title MUST be unique and specific to "${selectedTopic.topic}". Do NOT use generic titles.

Meta description requirements:
- Max 155 characters
- Include primary keyword
- Be compelling and click-worthy

Output format (in JSON):
{
  "title": "SEO-optimized title specific to topic (50-60 chars)",
  "slug": "url-friendly-slug",
  "description": "Meta description (max 155 chars)",
  "excerpt": "Short excerpt for previews (100-150 chars)",
  "author": "Thesis Generator Research Team",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["seo", "keyword", "list"],
  "readTime": "X min read",
  "content": "Full MDX content with markdown formatting"
}`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert academic content writer specializing in thesis writing, dissertation help, research methodology, and academic writing. You create engaging, well-researched, SEO-optimized blog posts that help students and researchers with their academic work. Your content is informative, practical, and always maintains academic integrity standards. Each article you write has a UNIQUE title that doesn't repeat previous articles.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Slightly higher for more variety
        max_tokens: 5000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const blogData = JSON.parse(content);
    const date = new Date().toISOString().split('T')[0];
    const slug = blogData.slug || generateSlug(blogData.title);
    const filename = `${date}-${slug}.mdx`;

    // Create MDX content with frontmatter
    const mdxContent = `---
title: "${blogData.title}"
description: "${blogData.description}"
excerpt: "${blogData.excerpt}"
date: "${date}"
publishedAt: "${new Date().toISOString()}"
author: "${blogData.author}"
category: "${selectedTopic.category}"
tags: ${JSON.stringify(blogData.tags)}
keywords: ${JSON.stringify(blogData.keywords || selectedKeywords)}
image: "${selectedImage}"
readTime: "${blogData.readTime}"
featured: ${selectedTopic.featured}
slug: "${slug}"
filename: "${filename}"
---

${blogData.content}
`;

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'generated-posts');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the MDX file
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, mdxContent, 'utf-8');

    // Also create/update index.json for the GitHub repo
    const indexPath = path.join(outputDir, 'index.json');
    let posts: Array<Record<string, unknown>> = [];
    
    if (fs.existsSync(indexPath)) {
      posts = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    // Add new post to the beginning
    const newPost = {
      slug,
      title: blogData.title,
      excerpt: blogData.excerpt,
      description: blogData.description,
      date: date,
      publishedAt: new Date().toISOString(),
      author: blogData.author,
      category: selectedTopic.category,
      tags: blogData.tags,
      keywords: blogData.keywords || selectedKeywords,
      image: selectedImage,
      readTime: blogData.readTime,
      featured: selectedTopic.featured,
      filename,
    };

    // Remove duplicate if exists
    posts = posts.filter((p) => p.slug !== slug);
    posts.unshift(newPost);

    fs.writeFileSync(indexPath, JSON.stringify(posts, null, 2), 'utf-8');

    console.log('\n✅ Blog post generated successfully!');
    console.log(`📄 File: ${filepath}`);
    console.log(`📌 Title: ${blogData.title}`);
    console.log(`🔗 Slug: ${slug}`);
    console.log(`🖼️  Image: ${selectedImage}`);
    console.log(`🏷️  Tags: ${blogData.tags.join(', ')}`);
    console.log(`🔑 Keywords: ${(blogData.keywords || selectedKeywords).join(', ')}`);
    console.log(`📂 Category: ${selectedTopic.category}`);
    console.log(`⭐ Featured: ${selectedTopic.featured}`);
    console.log(`⏱️  Read Time: ${blogData.readTime}`);
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated content');
    console.log('2. Copy files to your thesispost GitHub repository');
    console.log('3. Push to trigger the blog update');

    return filepath;
  } catch (error) {
    console.error('❌ Failed to generate blog post:', error);
    process.exit(1);
  }
}

generateBlogPost();
