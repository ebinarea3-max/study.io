import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/server/razorpay';
import { createClient } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Determine amount (in paise):
    // Minimum allowable amount is 100 paise (₹1).
    let amount: number;
    if (typeof body.amount === 'number') {
      amount = Math.round(body.amount);
      if (amount < 100) {
        return NextResponse.json(
          { error: 'Amount must be at least 100 paise (₹1.00)' },
          { status: 400 }
        );
      }
    } else if (body.plan === 'yearly') {
      amount = 99900; // ₹999 for yearly Pro
    } else {
      amount = 9900; // ₹99 for monthly Pro (default)
    }

    const currency: string = (body.currency || 'INR').toUpperCase();

    // Optional user identification from cookie session or body
    let userId = body.userId || '';
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) userId = user.id;
    } catch {
      // Allow guest/fallback
    }

    const receipt = (
      body.receipt ||
      `rcpt_${userId ? userId.slice(0, 8) + '_' : ''}${Date.now()}`
    ).slice(0, 40);

    const notes = {
      plan: body.plan || (amount >= 90000 ? 'yearly' : 'monthly'),
      userId: userId || 'anonymous',
      app: 'study.io',
      ...(typeof body.notes === 'object' && body.notes !== null ? body.notes : {}),
    };

    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (clientErr: any) {
      console.error('[create-order] Client init error:', clientErr?.message || clientErr);
      return NextResponse.json(
        { error: clientErr?.message || 'Razorpay configuration error' },
        { status: 500 }
      );
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      'rzp_test_TxMMb1eZs7gIB7';

    // Return format supporting standard spec { order_id, amount, currency }
    // and frontend helpers { orderId, id, keyId, plan }
    return NextResponse.json({
      order_id: order.id,
      orderId: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: keyId,
      keyId,
      plan: notes.plan,
    });
  } catch (error: any) {
    console.error('[create-order] Error:', error?.message || error);
    const statusCode = error?.statusCode === 401 ? 401 : 500;
    return NextResponse.json(
      { error: error?.error?.description || error?.message || 'Failed to create payment order' },
      { status: statusCode }
    );
  }
}

