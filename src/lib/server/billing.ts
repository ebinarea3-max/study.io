import 'server-only';
import crypto from 'crypto';
import { getRazorpayClient, getPlanIds } from './razorpay';
import { getSupabaseAdmin } from './supabaseAdmin';

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Timing-safe HMAC SHA256 signature verification for Razorpay subscription payment checkout.
 * Expected signature payload: `${payment_id}|${subscription_id}`
 */
export function verifySubscriptionPaymentSignature({
  paymentId,
  subscriptionId,
  signature,
  secret,
}: {
  paymentId: string;
  subscriptionId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!paymentId || !subscriptionId || !signature || !secret) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

/**
 * Timing-safe HMAC SHA256 signature verification for Razorpay Webhook requests.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);

  if (expectedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id?: string;
  status?: string;
  current_end?: number | null;
  cancel_at_cycle_end?: boolean | number;
  ended_at?: number | null;
  notes?: Record<string, string>;
}

/**
 * Resolves whether a Razorpay subscription belongs to the 'monthly' or 'yearly' plan.
 */
export function resolvePlan(
  razorpaySub: { plan_id?: string; notes?: Record<string, unknown> },
  fallbackPlan?: string | null
): 'monthly' | 'yearly' {
  const notePlan = razorpaySub.notes?.plan;
  if (notePlan === 'monthly' || notePlan === 'yearly') {
    return notePlan;
  }

  const planIds = getPlanIds();
  if (planIds.monthly && razorpaySub.plan_id === planIds.monthly) {
    return 'monthly';
  }
  if (planIds.yearly && razorpaySub.plan_id === planIds.yearly) {
    return 'yearly';
  }

  if (fallbackPlan === 'monthly' || fallbackPlan === 'yearly') {
    return fallbackPlan;
  }

  return 'monthly';
}

/**
 * Calculates premium_until with a strict 1-day grace period.
 */
export function calculatePremiumUntil({
  currentEndSeconds,
  plan,
  status,
}: {
  currentEndSeconds?: number | null;
  plan: 'monthly' | 'yearly';
  status: string;
}): Date {
  // If subscription has a valid current cycle end
  if (currentEndSeconds && currentEndSeconds > 0) {
    const cycleEndMs = currentEndSeconds * 1000;
    return new Date(cycleEndMs + ONE_DAY_MS);
  }

  // Fallback if current_end is null or not yet populated (e.g. freshly created or activated)
  if (status === 'active' || status === 'authenticated') {
    const days = plan === 'yearly' ? 365 : 30;
    return new Date(Date.now() + (days * 24 * 60 * 60 * 1000) + ONE_DAY_MS);
  }

  // For inactive/cancelled without future cycle end
  return new Date();
}

/**
 * Core synchronization routine: fetches the subscription from Razorpay and updates
 * public.subscriptions in Supabase with calculated grace period and status.
 */
export async function syncSubscriptionRecord({
  userId,
  subscriptionId,
  cancelAtCycleEndOverride,
}: {
  userId: string;
  subscriptionId: string;
  cancelAtCycleEndOverride?: boolean;
}) {
  const razorpay = getRazorpayClient();
  const supabaseAdmin = getSupabaseAdmin();

  // 1. Fetch live subscription object from Razorpay
  const rzpSub = (await razorpay.subscriptions.fetch(subscriptionId)) as unknown as RazorpaySubscriptionEntity;
  if (!rzpSub) {
    throw new Error(`Razorpay subscription not found: ${subscriptionId}`);
  }

  // 2. Fetch existing subscription record to preserve plan if needed
  const { data: existingSub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, cancel_at_cycle_end')
    .eq('user_id', userId)
    .maybeSingle();

  const plan = resolvePlan(rzpSub, existingSub?.plan);
  const status = rzpSub.status || 'unknown';

  const premiumUntil = calculatePremiumUntil({
    currentEndSeconds: rzpSub.current_end,
    plan,
    status,
  });

  const cancelAtCycleEnd =
    cancelAtCycleEndOverride !== undefined
      ? cancelAtCycleEndOverride
      : Boolean(
          rzpSub.cancel_at_cycle_end ||
          existingSub?.cancel_at_cycle_end ||
          status === 'cancelled'
        );

  const payload = {
    user_id: userId,
    provider: 'razorpay',
    provider_subscription_id: subscriptionId,
    plan,
    status,
    premium_until: premiumUntil.toISOString(),
    cancel_at_cycle_end: cancelAtCycleEnd,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' });

  if (upsertError) {
    throw new Error(`Failed to update subscription in database: ${upsertError.message}`);
  }

  return {
    userId,
    subscriptionId,
    plan,
    status,
    premiumUntil: premiumUntil.toISOString(),
    cancelAtCycleEnd,
    isPremium: premiumUntil.getTime() > Date.now(),
  };
}
