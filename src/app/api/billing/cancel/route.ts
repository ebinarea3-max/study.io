import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getRazorpayClient } from '@/lib/server/razorpay';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

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

    // 2. Fetch user's subscription ID from Supabase
    const supabaseAdmin = getSupabaseAdmin();
    const { data: subRecord, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('provider_subscription_id, status, premium_until, cancel_at_cycle_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError || !subRecord || !subRecord.provider_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found to cancel.' },
        { status: 404 }
      );
    }

    if (subRecord.cancel_at_cycle_end) {
      return NextResponse.json({
        success: true,
        message: 'Subscription is already scheduled to cancel at the end of the billing cycle.',
        cancelAtCycleEnd: true,
      });
    }

    // 3. Call Razorpay subscriptions.cancel with cancel_at_cycle_end = true
    const razorpay = getRazorpayClient();
    let rzpResponse: any = null;
    try {
      // Second parameter `true` instructs Razorpay to cancel at the end of the current cycle
      rzpResponse = await razorpay.subscriptions.cancel(
        subRecord.provider_subscription_id,
        true
      );
    } catch (rzpErr: any) {
      console.error('Razorpay cancellation error:', rzpErr?.message || rzpErr);
      // If Razorpay returns that it is already cancelled, continue updating DB
      if (!rzpErr?.message?.toLowerCase().includes('already')) {
        return NextResponse.json(
          { error: rzpErr?.message || 'Failed to cancel subscription with payment provider.' },
          { status: 502 }
        );
      }
    }

    // 4. Update local record with cancel_at_cycle_end = true
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        cancel_at_cycle_end: true,
        status: rzpResponse?.status || subRecord.status,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Failed to update cancellation flag locally:', updateError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully scheduled for cancellation at the end of the current billing cycle.',
      cancelAtCycleEnd: true,
      status: rzpResponse?.status || subRecord.status,
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal error cancelling subscription' },
      { status: 500 }
    );
  }
}
