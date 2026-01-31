import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-side subscription utilities
 * These functions work with the browser Supabase client
 */

export async function canUserGenerate(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  // Check user's subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // If user has active subscription, they can generate
  if (subscription) {
    return true;
  }

  // Check free tier usage
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  // Check monthly usage for free tier
  const { data: monthlyUsage } = await supabase
    .from('usage')
    .select('theses_generated')
    .eq('user_id', userId)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0]);

  const totalThisMonth = monthlyUsage?.reduce((sum, u) => sum + (u.theses_generated || 0), 0) || 0;

  // Free users get 1 thesis per month
  return totalThisMonth < 1;
}

export async function getClientUsageStats(
  userId: string,
  supabase: SupabaseClient
): Promise<{
  thesesGenerated: number;
  chaptersGenerated: number;
  wordsGenerated: number;
}> {
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const { data: usage } = await supabase
    .from('usage')
    .select('theses_generated, chapters_generated, words_generated')
    .eq('user_id', userId)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0]);

  return {
    thesesGenerated: usage?.reduce((sum, u) => sum + (u.theses_generated || 0), 0) || 0,
    chaptersGenerated: usage?.reduce((sum, u) => sum + (u.chapters_generated || 0), 0) || 0,
    wordsGenerated: usage?.reduce((sum, u) => sum + (u.words_generated || 0), 0) || 0,
  };
}
