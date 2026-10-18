import 'server-only';
import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

/**
 * Returns a server-only singleton instance of the official Razorpay client.
 * Key secrets never leave the server.
 */
export function getRazorpayClient(): Razorpay {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      'Server configuration error: NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured.'
    );
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

/**
 * Returns configured plan IDs for monthly and yearly subscriptions.
 */
export function getPlanIds(): { monthly: string; yearly: string } {
  return {
    monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY?.trim() || '',
    yearly: process.env.RAZORPAY_PLAN_ID_YEARLY?.trim() || '',
  };
}

/**
 * Returns the Razorpay webhook secret.
 */
export function getWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error('Server configuration error: RAZORPAY_WEBHOOK_SECRET is not configured.');
  }
  return secret;
}
