import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import { syncSubscriptionRecord } from '@/lib/server/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch existing subscription ID for user
    const supabaseAdmin = getSupabaseAdmin();
    const { data: subRecord, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_subscription_id, status, plan, premium_until, cancel_at_cycle_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription record:', subError.message);
      return NextResponse.json(
        { error: 'Failed to retrieve current subscription status' },
        { status: 500 }
      );
    }

    if (!subRecord || !subRecord.provider_subscription_id) {
      return NextResponse.json({
        isPremium: false,
        status: 'none',
        plan: null,
        premiumUntil: null,
        cancelAtCycleEnd: false,
      });
    }

    // 3. Fetch latest details from Razorpay and update local database
    const syncResult = await syncSubscriptionRecord({
      userId: user.id,
      subscriptionId: subRecord.provider_subscription_id,
    });

    return NextResponse.json({
      success: true,
      isPremium: syncResult.isPremium,
      status: syncResult.status,
      plan: syncResult.plan,
      premiumUntil: syncResult.premiumUntil,
      cancelAtCycleEnd: syncResult.cancelAtCycleEnd,
    });
  } catch (error: any) {
    console.error('Error in subscription sync:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
