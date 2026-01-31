// User types
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'lifetime' | 'refunded';
  created_at: string;
  updated_at: string;
}

// Subscription types
export interface Subscription {
  id: string;
  user_id: string;
  lemon_squeezy_id: string | null;
  lemon_squeezy_order_id: string | null;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'refunded';
  plan_name: string | null;
  plan_interval: string | null;
  price: number | null;
  currency: string;
  renews_at: string | null;
  ends_at: string | null;
  cancelled_at: string | null;
  customer_portal_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isPremium: boolean;
  planType: 'free' | 'monthly' | 'yearly' | 'lifetime' | null;
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'refunded' | null;
  renewsAt: Date | null;
  endsAt: Date | null;
  customerPortalUrl: string | null;
}

// Thesis types
export interface Thesis {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  academic_field: string | null;
  writing_style: 'academic' | 'technical' | 'descriptive';
  language: string;
  status: 'draft' | 'generating' | 'completed' | 'exported';
  total_chapters: number;
  total_words: number;
  total_pages: number;
  outline: ThesisOutline | null;
  metadata: ThesisMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface ThesisOutline {
  chapters: OutlineChapter[];
}

export interface OutlineChapter {
  number: number;
  title: string;
  sections: OutlineSection[];
}

export interface OutlineSection {
  number: string;
  title: string;
  subsections?: OutlineSubsection[];
}

export interface OutlineSubsection {
  number: string;
  title: string;
}

export interface ThesisMetadata {
  targetLength?: 'short' | 'medium' | 'long';
  citationStyle?: 'APA' | 'MLA' | 'Harvard' | 'Chicago';
  university?: string;
  department?: string;
  supervisor?: string;
}

// Chapter types
export interface Chapter {
  id: string;
  thesis_id: string;
  title: string;
  chapter_number: number;
  content: string | null;
  word_count: number;
  status: 'pending' | 'generating' | 'completed' | 'editing' | 'locked';
  subheadings: Subheading[] | null;
  tables: TableData[] | null;
  charts: ChartData[] | null;
  created_at: string;
  updated_at: string;
}

export interface Subheading {
  number: string;
  title: string;
  content?: string;
}

// Table data structure
export interface TableData {
  id?: string;
  caption: string;
  columns: string[];
  rows: string[][];
  source: string;
  position?: 'start' | 'middle' | 'end';
}

// Chart data structure
export interface ChartData {
  id?: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut';
  caption: string;
  labels: string[];
  data: number[];
  xlabel: string;
  ylabel: string;
  source: string;
  position?: 'start' | 'middle' | 'end';
}

// Generation progress types
export interface GenerationProgress {
  thesisId: string;
  currentChapter: number;
  totalChapters: number;
  currentSection: string;
  progress: number;
  wordsGenerated: number;
  estimatedTimeRemaining: number;
  status: 'initializing' | 'generating' | 'completed' | 'error';
  error?: string;
}

export interface ChapterProgress {
  chapterNumber: number;
  title: string;
  status: 'waiting' | 'generating' | 'completed' | 'error';
  progress: number;
  wordCount: number;
  errorMessage?: string;
  startTime?: Date;
  completedTime?: Date;
}

// Usage tracking
export interface Usage {
  id: string;
  user_id: string;
  date: string;
  theses_generated: number;
  chapters_generated: number;
  words_generated: number;
}

// Blog types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  author: string;
  category: string | null;
  tags: string[] | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Checkout types
export interface CheckoutRequest {
  plan: 'monthly' | 'yearly' | 'lifetime';
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

// Export types
export type ExportFormat = 'pdf' | 'docx' | 'latex' | 'markdown' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  includeTableOfContents: boolean;
  includeCoverPage: boolean;
  includeReferences: boolean;
  pageSize: 'A4' | 'Letter';
}

// Pricing plans
export interface PricingPlan {
  id: 'monthly' | 'yearly' | 'lifetime';
  name: string;
  price: number;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  popular?: boolean;
  savings?: string;
  badge?: string;
}

// Academic fields
export const ACADEMIC_FIELDS = [
  'Computer Science',
  'Business Administration',
  'Psychology',
  'Engineering',
  'Medicine',
  'Law',
  'Social Sciences',
  'Humanities',
  'Natural Sciences',
  'Economics',
  'Education',
  'Environmental Science',
  'Political Science',
  'Communications',
  'Other',
] as const;

export type AcademicField = typeof ACADEMIC_FIELDS[number];

// Writing styles
export const WRITING_STYLES = [
  { value: 'academic', label: 'Academic', description: 'Formal academic tone with citations' },
  { value: 'technical', label: 'Technical', description: 'Technical writing with detailed explanations' },
  { value: 'descriptive', label: 'Descriptive', description: 'Descriptive and narrative style' },
] as const;

export type WritingStyle = 'academic' | 'technical' | 'descriptive';

// Target lengths
export const TARGET_LENGTHS = [
  { value: 'short', label: 'Short (~50 pages)', pages: 50, chapters: 5 },
  { value: 'medium', label: 'Medium (~90 pages)', pages: 90, chapters: 7 },
  { value: 'long', label: 'Long (~150 pages)', pages: 150, chapters: 9 },
] as const;

export type TargetLength = 'short' | 'medium' | 'long';

// Languages
export const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'pl', label: 'Polish' },
  { value: 'nl', label: 'Dutch' },
] as const;
