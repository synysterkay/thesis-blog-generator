/**
 * GitHub Blog Fetcher
 * Fetches blog posts from GitHub repository: synysterkay/thesispost
 */

const GITHUB_REPO = 'thesispost';
const GITHUB_OWNER = 'synysterkay';
const GITHUB_BRANCH = 'main';
const POSTS_PATH = 'posts';

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  description?: string;
  date: string;
  publishedAt?: string;
  author: string;
  category: string;
  tags: string[];
  image: string;
  imageIndex?: number;
  readTime: string;
  featured: boolean;
  filename?: string;
  keywords?: string[];
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

// Cache for posts
let postsCache: BlogPostMeta[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch posts index from GitHub
 */
export async function fetchPostsIndex(): Promise<BlogPostMeta[]> {
  // Check cache
  if (postsCache && Date.now() - cacheTime < CACHE_DURATION) {
    return postsCache;
  }

  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${POSTS_PATH}/index.json`;
    const response = await fetch(url, {
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      console.warn('Failed to fetch posts index from GitHub');
      return [];
    }

    const posts = await response.json();
    postsCache = posts;
    cacheTime = Date.now();
    return posts;
  } catch (error) {
    console.error('Error fetching posts index:', error);
    return [];
  }
}

/**
 * Fetch single post content from GitHub
 */
export async function fetchPost(filename: string): Promise<string | null> {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${POSTS_PATH}/${filename}`;
    const response = await fetch(url, {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}

/**
 * Parse MDX frontmatter
 */
export function parseFrontmatter(content: string): { meta: Partial<BlogPostMeta>; content: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { meta: {}, content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const meta: Partial<BlogPostMeta> = {};
  
  // Parse YAML-like frontmatter
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();
    
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    // Parse arrays
    if (value.startsWith('[')) {
      try {
        (meta as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {
        (meta as Record<string, unknown>)[key] = value;
      }
    } else if (value === 'true') {
      (meta as Record<string, unknown>)[key] = true;
    } else if (value === 'false') {
      (meta as Record<string, unknown>)[key] = false;
    } else if (!isNaN(Number(value)) && value !== '') {
      (meta as Record<string, unknown>)[key] = Number(value);
    } else {
      (meta as Record<string, unknown>)[key] = value;
    }
  }

  return { meta, content: body };
}

/**
 * Get all blog posts
 */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  return fetchPostsIndex();
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(): Promise<BlogPostMeta[]> {
  const posts = await fetchPostsIndex();
  return posts.filter(post => post.featured);
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(category: string): Promise<BlogPostMeta[]> {
  const posts = await fetchPostsIndex();
  return posts.filter(post => post.category.toLowerCase() === category.toLowerCase());
}

/**
 * Get post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await fetchPostsIndex();
  const postMeta = posts.find(p => p.slug === slug);
  
  if (!postMeta) {
    return null;
  }

  // Find the filename (it includes the date)
  const filename = postMeta.filename || `${slug}.mdx`;
  const rawContent = await fetchPost(filename);
  
  if (!rawContent) {
    return null;
  }

  const { meta, content } = parseFrontmatter(rawContent);
  
  return {
    ...postMeta,
    ...meta,
    content
  } as BlogPost;
}

/**
 * Get recent posts
 */
export async function getRecentPosts(count: number = 6): Promise<BlogPostMeta[]> {
  const posts = await fetchPostsIndex();
  return posts.slice(0, count);
}

/**
 * Search posts
 */
export async function searchPosts(query: string): Promise<BlogPostMeta[]> {
  const posts = await fetchPostsIndex();
  const lowerQuery = query.toLowerCase();
  
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt.toLowerCase().includes(lowerQuery) ||
    post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    (post.keywords || []).some(kw => kw.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const posts = await fetchPostsIndex();
  return posts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get all categories
 */
export async function getAllCategories(): Promise<string[]> {
  const posts = await fetchPostsIndex();
  const categories = new Set(posts.map(post => post.category));
  return Array.from(categories);
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await fetchPostsIndex();
  const tags = new Set(posts.flatMap(post => post.tags));
  return Array.from(tags);
}
