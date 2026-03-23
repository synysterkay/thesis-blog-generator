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
    .select('status, plan_type')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  // If user has active subscription, check plan limits
  if (subscription) {
    // Unlimited plans have no generation cap
    if (subscription.plan_type === 'unlimited') {
      return true;
    }
    
    // Pro monthly: 5 theses per month
    if (subscription.plan_type === 'monthly') {
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: monthlyUsage } = await supabase
        .from('usage')
        .select('theses_generated')
        .eq('user_id', userId)
        .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
      
      const totalThisMonth = monthlyUsage?.reduce((sum, u) => sum + (u.theses_generated || 0), 0) || 0;
      return totalThisMonth < 5;
    }
    
    return true;
  }

  // No active subscription — must subscribe to generate
  return false;
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
