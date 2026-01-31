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
  
  // Get user's premium status
  const { data: user } = await supabase
    .from('users')
    .select('is_premium, subscription_status')
    .eq('id', userId)
    .single();
  
  if (!subscription || subscription.status !== 'active') {
    return {
      isActive: false,
      isPremium: false,
      planType: 'free',
      status: subscription?.status || null,
      renewsAt: null,
      endsAt: subscription?.ends_at ? new Date(subscription.ends_at) : null,
      customerPortalUrl: subscription?.customer_portal_url || null,
    };
  }
  
  // Determine plan type from plan_name
  let planType: 'monthly' | 'yearly' | 'lifetime' = 'monthly';
  if (subscription.plan_name?.toLowerCase().includes('lifetime')) {
    planType = 'lifetime';
  } else if (subscription.plan_name?.toLowerCase().includes('year')) {
    planType = 'yearly';
  }
  
  return {
    isActive: true,
    isPremium: user?.is_premium || false,
    planType,
    status: subscription.status,
    renewsAt: subscription.renews_at ? new Date(subscription.renews_at) : null,
    endsAt: subscription.ends_at ? new Date(subscription.ends_at) : null,
    customerPortalUrl: subscription.customer_portal_url,
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
