import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getWebhookSecret } from '@/lib/server/razorpay';
import { getSupabaseAdmin } from '@/lib/server/supabaseAdmin';
import {
  verifyWebhookSignature,
  syncSubscriptionRecord,
  resolvePlan,
  calculatePremiumUntil,
} from '@/lib/server/billing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Read raw body and signature header
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    let webhookSecret: string;
    try {
      webhookSecret = getWebhookSecret();
    } catch {
      return NextResponse.json(
        { error: 'Server webhook secret is not configured' },
        { status: 500 }
      );
    }

    // 2. Timing-safe signature verification
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.warn('Invalid Razorpay webhook signature received');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    // 3. Parse JSON event payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const eventType: string = event.event || 'unknown';
    const subEntity = event.payload?.subscription?.entity;
    const subId: string = subEntity?.id || event.payload?.payment?.entity?.subscription_id || '';

    // 4. Derive unique event ID for idempotency
    const eventId: string =
      req.headers.get('x-razorpay-event-id') ||
      event.id ||
      `${eventType}_${subId || 'event'}_${event.created_at || Date.now()}`;

    const supabaseAdmin = getSupabaseAdmin();

    // 5. Check idempotency in billing_events table
    const { data: existingEvent } = await supabaseAdmin
      .from('billing_events')
      .select('id')
      .eq('id', eventId)
      .maybeSingle();

    if (existingEvent) {
      // Event has already been processed successfully
      return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
    }

    // Record event in billing_events table
    const { error: insertError } = await supabaseAdmin
      .from('billing_events')
      .insert({
        id: eventId,
        type: eventType,
        payload: event,
        received_at: new Date().toISOString(),
      });

    if (insertError) {
      // If concurrent insert created duplicate primary key, safely treat as processed
      if (insertError.code === '23505') {
        return NextResponse.json({ received: true, idempotent: true }, { status: 200 });
      }
      console.error('Failed to log billing event:', insertError.message);
    }

    // 6. Handle Subscription Lifecycle Events
    const supportedEvents = [
      'subscription.authenticated',
      'subscription.activated',
      'subscription.charged',
      'subscription.completed',
      'subscription.cancelled',
      'subscription.halted',
      'subscription.paused',
      'subscription.resumed',
    ];

    if (subId && (supportedEvents.includes(eventType) || eventType.startsWith('subscription.'))) {
      // Determine user ID: check event notes, then fallback to database lookup
      let userId = subEntity?.notes?.user_id;

      if (!userId) {
        const { data: matchingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('provider_subscription_id', subId)
          .maybeSingle();

        userId = matchingSub?.user_id;
      }

      if (userId) {
        try {
          if (subEntity) {
            // If full subscription entity is in payload, update directly
            const plan = resolvePlan(subEntity);
            const status = subEntity.status || 'unknown';
            const premiumUntil = calculatePremiumUntil({
              currentEndSeconds: subEntity.current_end,
              plan,
              status,
            });

            const isCancelled =
              eventType === 'subscription.cancelled' ||
              status === 'cancelled' ||
              Boolean(subEntity.cancel_at_cycle_end);

            await supabaseAdmin.from('subscriptions').upsert(
              {
                user_id: userId,
                provider: 'razorpay',
                provider_subscription_id: subId,
                plan,
                status,
                premium_until: premiumUntil.toISOString(),
                cancel_at_cycle_end: isCancelled,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );
          } else {
            // Fetch fresh status from Razorpay API
            await syncSubscriptionRecord({
              userId,
              subscriptionId: subId,
            });
          }
        } catch (syncErr: any) {
          console.error(`Error processing webhook event ${eventType} for ${subId}:`, syncErr?.message);
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Unhandled webhook error:', error?.message || error);
    return NextResponse.json(
      { error: 'Internal webhook processing error' },
      { status: 500 }
    );
  }
}
