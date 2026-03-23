'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';
import { ArrowRight, Calendar, Clock, User, MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  author?: string;
  date: string;
  readTime?: string;
  image?: string;
  featured?: boolean;
  tags?: string[];
}

interface BlogPageClientProps {
  posts: BlogPost[];
}

const POSTS_PER_PAGE = 12;
const categories = ['All', 'Writing Tips', 'Research', 'Technology', 'Productivity', 'Guides'];

export default function BlogPageClient({ posts }: BlogPageClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPosts = filteredPosts.filter(post => post.featured).slice(0, 2);
  // Show ALL posts in Latest Articles (including featured ones that didn't fit in Featured section)
  const featuredSlugs = new Set(featuredPosts.map(p => p.slug));
  const regularPosts = filteredPosts.filter(post => !featuredSlugs.has(post.slug));
  
  // Pagination
  const totalPages = Math.ceil(regularPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = regularPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              Thesis Generator Blog
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Expert insights, writing tips, and resources to help you succeed in your academic journey.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
              />
            </div>
            
            {/* Article count */}
            <p className="text-sm text-slate-500 mt-4">
              {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''} available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === selectedCategory
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map((post, index) => (
                <motion.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card hover className="overflow-hidden h-full bg-white border border-slate-200 shadow-sm">
                      <div className="aspect-[16/9] relative bg-slate-50">
                        {post.image ? (
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-6xl opacity-30">📚</div>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded-full">
                            {post.category}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {post.readTime || '5 min read'}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <User size={16} />
                            {post.author || 'Thesis Generator Team'}
                          </div>
                          <div className="flex items-center gap-1 text-slate-900 text-sm font-medium">
                            Read more
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {selectedCategory === 'All' ? 'Latest Articles' : selectedCategory}
          </h2>
          
          {regularPosts.length === 0 && featuredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No articles found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post, index) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <Card hover className="overflow-hidden h-full bg-white border border-slate-200 shadow-sm">
                        <div className="aspect-[16/10] relative bg-slate-50">
                          {post.image ? (
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl opacity-20">📝</div>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                              {post.category}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {post.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {post.readTime || '5 min read'}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CaretLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and neighbors
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, idx, arr) => {
                      // Add ellipsis
                      const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-2">
                          {showEllipsisBefore && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CaretRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 md:p-12 bg-slate-50 border border-slate-200 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
              Stay Updated with Thesis Writing Tips
            </h2>
            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
              Get weekly insights, research strategies, and productivity tips delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <button className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </Card>
        </div>
      </section>

      <Footer />
    </main>
  );
}
