#!/usr/bin/env node

/**
 * Blog Post Generator Script for ThesisAI
 * Generates SEO-optimized MDX blog posts using DeepSeek API
 * with random Unsplash images
 * 
 * Usage: npm run generate-blog
 * Environment variables:
 *   - DEEPSEEK_API_KEY: DeepSeek API key
 *   - TOPIC: Blog post topic
 *   - KEYWORDS: Comma-separated SEO keywords
 *   - STYLE: Writing style (informative, tutorial, comparison, news)
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

const topic = process.env.TOPIC || 'Thesis Writing Tips';
const keywords = process.env.KEYWORDS?.split(',').map((k) => k.trim()) || [];
const style = process.env.STYLE || 'informative';

// Curated Unsplash images for thesis/academic content
const blogImages = [
  // Academic/Research
  'https://images.unsplash.com/photo-1456324463128-7ff6903988d8?w=800&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
  
  // Writing/Typing
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&q=80',
  
  // Graduation/Academia
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80',
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
  
  // AI/Technology
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
  'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
  
  // Research/Data
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
];

function getRandomImage(): string {
  return blogImages[Math.floor(Math.random() * blogImages.length)];
}

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
  ],
  secondary: [
    'how to write a thesis',
    'thesis writing tips',
    'dissertation help',
    'research methodology',
    'literature review',
    'thesis structure',
    'academic writing guide',
    'thesis introduction',
    'thesis conclusion',
    'thesis defense',
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
  ],
};

async function generateBlogPost() {
  console.log(`🚀 Generating blog post about: ${topic}`);
  console.log(`📝 Style: ${style}`);
  console.log(`🔑 Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'Auto-generated'}`);

  // Select relevant SEO keywords if none provided
  const selectedKeywords = keywords.length > 0 
    ? keywords 
    : [
        seoKeywords.primary[Math.floor(Math.random() * seoKeywords.primary.length)],
        seoKeywords.secondary[Math.floor(Math.random() * seoKeywords.secondary.length)],
        seoKeywords.longtail[Math.floor(Math.random() * seoKeywords.longtail.length)],
      ];

  const prompt = `Generate a comprehensive, SEO-optimized blog post about "${topic}" for ThesisAI (https://thesisgenerator.io), an AI-powered thesis and dissertation writing tool.

Style: ${style}
Target keywords: ${selectedKeywords.join(', ')}

Requirements:
1. Write in a professional but engaging academic tone
2. Include practical tips, examples, and actionable advice
3. Optimize for SEO with proper heading structure (H2, H3 only - no H1)
4. Include a compelling introduction that hooks readers
5. Add a strong conclusion with call-to-action mentioning ThesisAI
6. Length: 1800-2500 words
7. Include relevant statistics or research data where appropriate
8. Naturally incorporate the keywords without keyword stuffing
9. Add internal linking suggestions to other thesis-related topics
10. Include FAQ section at the end with 3-4 common questions
11. Make content helpful for graduate students, researchers, and academics
12. Mention how AI tools like ThesisAI can help with the topic

Meta description requirements:
- Max 155 characters
- Include primary keyword
- Be compelling and click-worthy

Output format (in JSON):
{
  "title": "SEO-optimized title (50-60 chars)",
  "slug": "url-friendly-slug",
  "description": "Meta description (max 155 chars)",
  "excerpt": "Short excerpt for previews (100-150 chars)",
  "author": "ThesisAI Research Team",
  "category": "One of: Writing Tips, Research, Technology, Productivity, Guides",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "keywords": ["seo", "keyword", "list"],
  "readTime": "X min read",
  "featured": false,
  "content": "Full MDX content with markdown formatting"
}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are an expert academic content writer specializing in thesis writing, dissertation help, research methodology, and academic writing. You create engaging, well-researched, SEO-optimized blog posts that help students and researchers with their academic work. Your content is informative, practical, and always maintains academic integrity standards.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const blogData = JSON.parse(content);
    const date = new Date().toISOString().split('T')[0];
    const randomImage = getRandomImage();
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
category: "${blogData.category}"
tags: ${JSON.stringify(blogData.tags)}
keywords: ${JSON.stringify(blogData.keywords || selectedKeywords)}
image: "${randomImage}"
readTime: "${blogData.readTime}"
featured: ${blogData.featured || false}
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
      category: blogData.category,
      tags: blogData.tags,
      keywords: blogData.keywords || selectedKeywords,
      image: randomImage,
      readTime: blogData.readTime,
      featured: blogData.featured || false,
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
    console.log(`🖼️  Image: ${randomImage}`);
    console.log(`🏷️  Tags: ${blogData.tags.join(', ')}`);
    console.log(`🔑 Keywords: ${(blogData.keywords || selectedKeywords).join(', ')}`);
    console.log(`📂 Category: ${blogData.category}`);
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
