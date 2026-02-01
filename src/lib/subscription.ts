import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { SubscriptionStatus } from '@/types';

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = await createServerSupabaseClient();
  
  // Get user's subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // No subscription found or plan is free
  if (!subscription || subscription.plan_type === 'free' || subscription.status !== 'active') {
    return {
      isActive: false,
      isPremium: false,
      planType: 'free',
      status: subscription?.status || null,
      renewsAt: null,
      endsAt: subscription?.current_period_end ? new Date(subscription.current_period_end) : null,
      customerPortalUrl: null,
    };
  }
  
  // Determine plan type from plan_type field
  const planType = subscription.plan_type as 'monthly' | 'yearly' | 'lifetime';
  
  return {
    isActive: true,
    isPremium: true,
    planType,
    status: subscription.status,
    renewsAt: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
    endsAt: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
    customerPortalUrl: null, // Will be fetched dynamically when needed
  };
}

export async function canUserGenerate(userId: string): Promise<{
  canGenerate: boolean;
  reason?: string;
  upgradeRequired: boolean;
}> {
  const status = await getSubscriptionStatus(userId);
  
  if (status.isActive && status.isPremium) {
    return { canGenerate: true, upgradeRequired: false };
  }
  
  // Check free tier usage
  const supabase = await createServerSupabaseClient();
  
  // Get first day of current month
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);
  
  // Check monthly usage for free tier
  const { data: monthlyUsage } = await supabase
    .from('usage')
    .select('theses_generated')
    .eq('user_id', userId)
    .gte('date', firstDayOfMonth.toISOString().split('T')[0]);
  
  const totalThisMonth = monthlyUsage?.reduce((sum, u) => sum + u.theses_generated, 0) || 0;
  
  // Free users get 1 thesis per month
  if (totalThisMonth >= 1) {
    return {
      canGenerate: false,
      reason: "You've used your free thesis this month. Upgrade for unlimited generation.",
      upgradeRequired: true,
    };
  }
  
  return { canGenerate: true, upgradeRequired: false };
}

export async function incrementUsage(
  userId: string,
  type: 'thesis' | 'chapter' | 'words',
  amount: number = 1
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  const column = type === 'thesis' ? 'theses_generated' 
    : type === 'chapter' ? 'chapters_generated' 
    : 'words_generated';
  
  // Try to get existing usage record
  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();
  
  if (existing) {
    await supabase
      .from('usage')
      .update({ [column]: (existing[column] || 0) + amount })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('usage')
      .insert({
        user_id: userId,
        date: today,
        [column]: amount,
      });
  }
}

export async function getMonthlyUsage(userId: string): Promise<{
  thesesGenerated: number;
  chaptersGenerated: number;
  wordsGenerated: number;
}> {
  const supabase = await createServerSupabaseClient();
  
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
