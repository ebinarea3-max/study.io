import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/server/razorpay';
import { createClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPlan = body?.plan;
    const plan: 'monthly' | 'yearly' = rawPlan === 'yearly' ? 'yearly' : 'monthly';

    // Pricing in paise (smallest currency unit for INR):
    // Monthly: ₹99 -> 9900 paise
    // Yearly: ₹999 -> 99900 paise
    const amount = plan === 'yearly' ? 99900 : 9900;

    // Optional user identification from cookie or body
    let userId = body?.userId || '';
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Allow guest/fallback
    }

    const razorpay = getRazorpayClient();
    const receipt = `rcpt_${userId ? userId.slice(0, 8) : 'guest'}_${Date.now()}`.slice(0, 40);

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        plan,
        userId: userId || 'anonymous',
        app: 'study.io',
      },
    });

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      'rzp_test_TxMMb1eZs7gIB7';

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      plan,
    });
  } catch (error: any) {
    console.error('[Razorpay create-order] Error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
