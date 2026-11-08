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

  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');

  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Accept both standard Razorpay naming and snake_case / camelCase variants
    const orderId =
      body.razorpay_order_id ||
      body.order_id ||
      body.orderId;
    const paymentId =
      body.razorpay_payment_id ||
      body.payment_id ||
      body.paymentId;
    const signature =
      body.razorpay_signature ||
      body.signature;

    // Missing fields validation
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: order_id, payment_id, and signature are required.',
          success: false,
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[verify-payment] RAZORPAY_KEY_SECRET is not configured.');
      return NextResponse.json(
        {
          error: 'Server configuration error: RAZORPAY_KEY_SECRET is not configured.',
          success: false,
        },
        { status: 500 }
      );
    }

    // Verify HMAC-SHA256 signature
    const isValid = verifyOrderSignature({
      orderId,
      paymentId,
      signature,
      secret,
    });

    // Signature mismatch: return 400 and do NOT mark as paid
    if (!isValid) {
      console.warn('[verify-payment] Invalid payment signature:', {
        orderId,
        paymentId,
      });
      return NextResponse.json(
        {
          error: 'Invalid payment signature. Verification failed.',
          success: false,
        },
        { status: 400 }
      );
    }

    // Determine plan and duration
    const rawPlan = body.plan;
    const plan: 'monthly' | 'yearly' = rawPlan === 'yearly' ? 'yearly' : 'monthly';
    const expiration = new Date();
    if (plan === 'yearly') {
      expiration.setDate(expiration.getDate() + 365);
    } else {
      expiration.setDate(expiration.getDate() + 30);
    }

    // Resolve user if available
    let targetUserId = body.userId || '';
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) targetUserId = user.id;
    } catch {
      // Allow guest/fallback
    }

    // Update database if user is identified
    let databaseSynced = false;
    if (targetUserId) {
      const payload = {
        user_id: targetUserId,
        provider: 'razorpay',
        provider_subscription_id: paymentId,
        plan,
        status: 'active',
        premium_until: expiration.toISOString(),
        cancel_at_cycle_end: false,
        updated_at: new Date().toISOString(),
      };

      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      if (serviceKey) {
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { error } = await supabaseAdmin
            .from('subscriptions')
            .upsert(payload, { onConflict: 'user_id' });
          if (!error) databaseSynced = true;
        } catch (adminErr) {
          console.warn('[verify-payment] Admin subscription upsert failed:', adminErr);
        }
      }

      if (!databaseSynced) {
        try {
          const supabase = await createClient();
          const { error } = await supabase
            .from('subscriptions')
            .upsert(payload, { onConflict: 'user_id' });
          if (!error) databaseSynced = true;
        } catch (userErr) {
          console.warn('[verify-payment] User subscription upsert failed:', userErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      order_id: orderId,
      orderId,
      payment_id: paymentId,
      paymentId,
      isPremium: true,
      status: 'active',
      plan,
      premiumUntil: expiration.toISOString(),
      expires_at: expiration.toISOString(),
      databaseSynced,
    });
  } catch (error: any) {
    console.error('[verify-payment] Unexpected verification error:', error?.message || error);
    return NextResponse.json(
      {
        error: error?.message || 'Internal payment verification error',
        success: false,
      },
      { status: 500 }
    );
  }
}

