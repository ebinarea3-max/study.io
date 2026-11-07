import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabaseServer';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function verifyOrderSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan: rawPlan,
      userId: explicitUserId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing payment verification parameters (order_id, payment_id, signature).' },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: 'Server configuration error: RAZORPAY_KEY_SECRET is not configured.' },
        { status: 500 }
      );
    }

    // 1. Verify Razorpay signature using HMAC-SHA256
    const isValid = verifyOrderSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      secret,
    });

    if (!isValid) {
      console.warn('[Razorpay verify] Invalid payment signature:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: 'Invalid payment signature verification failed.' },
        { status: 400 }
      );
    }

    // 2. Resolve user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const targetUserId = user?.id || explicitUserId;
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Cannot attach subscription: No authenticated user identified.' },
        { status: 401 }
      );
    }

    const plan: 'monthly' | 'yearly' = rawPlan === 'yearly' ? 'yearly' : 'monthly';

    // 3. Calculate expiration date (+30 days for monthly, +365 days for yearly)
    const expiration = new Date();
    if (plan === 'yearly') {
      expiration.setDate(expiration.getDate() + 365);
    } else {
      expiration.setDate(expiration.getDate() + 30);
    }

    const payload = {
      user_id: targetUserId,
      provider: 'razorpay',
      provider_subscription_id: razorpay_payment_id,
      plan,
      status: 'active',
      premium_until: expiration.toISOString(),
      cancel_at_cycle_end: false,
      updated_at: new Date().toISOString(),
    };

    // 4. Update Supabase subscriptions table securely
    let updateSuccess = false;
    let updateError: string | null = null;

    // Try service role admin client first (bypasses RLS)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (serviceKey) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .upsert(payload, { onConflict: 'user_id' });

        if (!error) {
          updateSuccess = true;
        } else {
          updateError = error.message;
        }
      } catch (adminErr: any) {
        updateError = adminErr?.message || 'Admin upsert failed';
      }
    }

    // If service role not configured or failed, try user client
    if (!updateSuccess) {
      try {
        const { error } = await supabase
          .from('subscriptions')
          .upsert(payload, { onConflict: 'user_id' });
        if (!error) {
          updateSuccess = true;
        } else {
          updateError = updateError || error.message;
        }
      } catch (userErr: any) {
        updateError = updateError || userErr?.message;
      }
    }

    return NextResponse.json({
      success: true,
      isPremium: true,
      status: 'active',
      plan,
      premiumUntil: expiration.toISOString(),
      expires_at: expiration.toISOString(),
      databaseSynced: updateSuccess,
      warning: updateSuccess ? undefined : updateError,
    });
  } catch (error: any) {
    console.error('[Razorpay verify] Unexpected error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Internal payment verification error' },
      { status: 500 }
    );
  }
}
