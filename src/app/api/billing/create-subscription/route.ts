import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { getRazorpayClient, getPlanIds } from '@/lib/server/razorpay';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    // 2. Parse and validate body
    const body = await req.json().catch(() => ({}));
    const { plan } = body;

    if (plan !== 'monthly' && plan !== 'yearly') {
      return NextResponse.json(
        { error: "Invalid plan specified. Must be 'monthly' or 'yearly'." },
        { status: 400 }
      );
    }

    // 3. Resolve Razorpay Plan ID
    const planIds = getPlanIds();
    const planId = plan === 'yearly' ? planIds.yearly : planIds.monthly;

    if (!planId) {
      return NextResponse.json(
        {
          error: `Razorpay Plan ID for '${plan}' is not configured in server environment.`,
        },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayClient();

    // 4. Create subscription in Razorpay
    // total_count: 120 cycles (10 years) for monthly, 10 cycles for yearly
    const totalCount = plan === 'yearly' ? 10 : 120;

    const subscription: any = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: totalCount,
      quantity: 1,
      customer_notify: 1,
      notes: {
        user_id: user.id,
        plan,
      },
    });

    if (!subscription || !subscription.id) {
      return NextResponse.json(
        { error: 'Failed to create subscription in Razorpay' },
        { status: 502 }
      );
    }

    // 5. Track subscription creation state in public.subscriptions
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin.from('subscriptions').upsert(
      {
        user_id: user.id,
        provider: 'razorpay',
        provider_subscription_id: subscription.id,
        plan,
        status: subscription.status || 'created',
        cancel_at_cycle_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return NextResponse.json({
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error creating subscription' },
      { status: 500 }
    );
  }
}
