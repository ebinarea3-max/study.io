import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { verifySubscriptionPaymentSignature, syncSubscriptionRecord } from '@/lib/server/billing';

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

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters.' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error: Razorpay secret not set.' },
        { status: 500 }
      );
    }

    // 3. Timing-safe HMAC SHA256 signature verification
    const isValid = verifySubscriptionPaymentSignature({
      paymentId: razorpay_payment_id,
      subscriptionId: razorpay_subscription_id,
      signature: razorpay_signature,
      secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid payment signature verification failed.' },
        { status: 400 }
      );
    }

    // 4. Synchronize subscription record in database
    const syncResult = await syncSubscriptionRecord({
      userId: user.id,
      subscriptionId: razorpay_subscription_id,
    });

    return NextResponse.json({
      success: true,
      isPremium: syncResult.isPremium,
      status: syncResult.status,
      plan: syncResult.plan,
      premiumUntil: syncResult.premiumUntil,
    });
  } catch (error: any) {
    console.error('Error verifying subscription payment:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
