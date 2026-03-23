import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // This should be protected in production (admin only)
    const body = await request.json();
    const { email, plan = 'unlimited' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Find user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if subscription exists
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSub) {
      // Update existing subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          lemonsqueezy_subscription_id: `admin-grant-${Date.now()}`,
          plan_type: plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (subError) {
        console.error('Error updating subscription:', subError);
        return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
      }
    } else {
      // Create new subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          lemonsqueezy_subscription_id: `admin-grant-${Date.now()}`,
          lemonsqueezy_customer_id: null,
          plan_type: plan,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          cancel_at_period_end: false,
        });

      if (subError) {
        console.error('Error creating subscription:', subError);
        return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
      }
    }

    // Also create profile if doesn't exist
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    return NextResponse.json({ 
      success: true, 
      message: `${plan} access granted to ${email}`,
      userId: user.id 
    });
  } catch (error: any) {
    console.error('Grant access error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to grant access' },
      { status: 500 }
    );
  }
}
