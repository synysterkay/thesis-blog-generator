/**
 * Enroll a user into a lifecycle email sequence.
 * Upserts into `email_lifecycle` — if already enrolled, reactivates and resets step.
 */
import { SupabaseClient } from '@supabase/supabase-js';

export type LifecycleSequence = 'onboarding' | 'post_generation' | 'conversion' | 'retention';

export async function enrollInSequence(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  sequence: LifecycleSequence,
  name?: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('email_lifecycle')
    .upsert(
      {
        user_id: userId,
        email: email.toLowerCase(),
        name: name || null,
        sequence,
        step: 1,
        active: true,
        enrolled_at: new Date().toISOString(),
        last_sent_at: null,
      },
      { onConflict: 'user_id,sequence' },
    );

  if (error) {
    console.error(`Failed to enroll ${email} in ${sequence}:`, error);
    return false;
  }
  console.log(`📧 Enrolled ${email} in ${sequence} sequence`);
  return true;
}

/**
 * Deactivate a sequence for a user (e.g. stop conversion emails when they purchase).
 */
export async function deactivateSequence(
  supabase: SupabaseClient,
  userId: string,
  sequence: LifecycleSequence,
): Promise<void> {
  const { error } = await supabase
    .from('email_lifecycle')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('sequence', sequence);

  if (error) {
    console.error(`Failed to deactivate ${sequence} for ${userId}:`, error);
  } else {
    console.log(`📧 Deactivated ${sequence} for ${userId}`);
  }
}
