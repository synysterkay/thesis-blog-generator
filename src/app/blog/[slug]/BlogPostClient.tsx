'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark, Tag, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  category: string;
  author?: string;
  authorRole?: string;
  date: string;
  readTime?: string;
  image?: string;
  tags?: string[];
  content: string;
}

interface RelatedPost {
  slug: string;
  title: string;
  excerpt?: string;
  category: string;
  date: string;
  readTime?: string;
  image?: string;
}

interface BlogPostClientProps {
  post: BlogPost;
  relatedPosts?: RelatedPost[];
}

export default function BlogPostClient({ post, relatedPosts = [] }: BlogPostClientProps) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.excerpt || post.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Article Header */}
      <article className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to blog
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                {post.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
              {post.title}
            </h1>

            <p className="text-xl text-slate-600 mb-8">
              {post.excerpt || post.description}
            </p>

            {/* Featured Image */}
            {post.image && (
              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-6 pb-8 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {(post.author || 'TA').split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{post.author || 'Thesis Generator Team'}</p>
                  <p className="text-sm text-slate-500">{post.authorRole || 'Research Team'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime || '5 min read'}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={handleShare}
                  className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Article Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg prose-slate max-w-none mt-12 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:mb-4 prose-li:ml-4 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
          >
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </motion.div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-12 pt-8 border-t border-slate-200"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-slate-400" />
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <Card className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">
                Ready to Start Your Thesis?
              </h3>
              <p className="text-blue-100 mb-6">
                Let Thesis Generator help you write your best academic work yet.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Get Started Free
              </Link>
            </Card>
          </motion.div>
        </div>

        {/* Recommended Articles */}
        {relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Recommended Articles</h2>
              <Link 
                href="/blog" 
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                View all articles
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost, index) => (
                <motion.div
                  key={relatedPost.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Link href={`/blog/${relatedPost.slug}`}>
                    <Card hover className="overflow-hidden h-full bg-white">
                      <div className="aspect-[16/10] relative bg-gradient-to-br from-slate-100 to-slate-50">
                        {relatedPost.image ? (
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-4xl opacity-40">📝</div>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                            {relatedPost.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {relatedPost.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {relatedPost.readTime || '5 min read'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </article>

      <Footer />
    </main>
  );
}
