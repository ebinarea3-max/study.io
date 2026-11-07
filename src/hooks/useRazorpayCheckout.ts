'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { toast } from 'react-hot-toast';

export interface BillingPlanInfo {
  id: string;
  name: string;
  amount: number;
  currency: string;
  formattedAmount: string;
  period: 'monthly' | 'yearly';
  interval: number;
}

export interface BillingPlansData {
  configured: boolean;
  monthly: BillingPlanInfo | null;
  yearly: BillingPlanInfo | null;
  message?: string;
}

const DEFAULT_PLANS: BillingPlansData = {
  configured: true,
  monthly: {
    id: 'plan_monthly',
    name: 'Pro Monthly',
    amount: 9900,
    currency: 'INR',
    formattedAmount: '₹99',
    period: 'monthly',
    interval: 1,
  },
  yearly: {
    id: 'plan_yearly',
    name: 'Pro Yearly',
    amount: 99900,
    currency: 'INR',
    formattedAmount: '₹999',
    period: 'yearly',
    interval: 1,
  },
};

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    email?: string;
    name?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
  on?: (event: string, callback: (response: any) => void) => void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function useRazorpayCheckout() {
  const { user } = useAuth();
  const { refresh, setImmediatePremium } = usePremium();
  const [plans, setPlans] = useState<BillingPlansData>(DEFAULT_PLANS);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Optional: load custom plans if available from server
  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const res = await fetch('/api/billing/plans');
        if (res.ok) {
          const data = (await res.json()) as BillingPlansData;
          if (isMounted && data.configured && data.monthly && data.yearly) {
            setPlans(data);
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_PLANS
      }
    }
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically load Razorpay checkout script on demand
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(false);
      if (window.Razorpay) return resolve(true);

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  // Trigger checkout modal using Standard Web Checkout (Orders API)
  const startCheckout = useCallback(
    async (plan: 'monthly' | 'yearly', onSuccessCallback?: () => void) => {
      if (!user || user.id.startsWith('guest')) {
        toast.error('Please sign in to subscribe to study.io Pro');
        return;
      }

      setIsProcessing(true);
      setCheckoutSuccess(false);

      try {
        // 1. Load Razorpay script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !window.Razorpay) {
          toast.error('Unable to load payment gateway. Please check your network connection.');
          setIsProcessing(false);
          return;
        }

        // 2. Call /api/create-order
        const createRes = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            userId: user.id,
            amount: plan === 'yearly' ? 99900 : 9900,
            currency: 'INR',
          }),
        });

        const createData = (await createRes.json()) as {
          order_id?: string;
          orderId?: string;
          amount?: number;
          currency?: string;
          keyId?: string;
          key_id?: string;
          plan?: string;
          error?: string;
        };

        const resolvedOrderId = createData.order_id || createData.orderId;
        if (!createRes.ok || !resolvedOrderId) {
          throw new Error(createData.error || 'Failed to initialize payment order');
        }

        const keyId =
          createData.key_id ||
          createData.keyId ||
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          'rzp_test_TxMMb1eZs7gIB7';

        // 3. Configure Razorpay Standard Checkout options with dark/gold theme
        const options: RazorpayOptions = {
          key: keyId,
          order_id: resolvedOrderId,
          amount: createData.amount,
          currency: createData.currency || 'INR',
          name: 'study.io Pro',
          description:
            plan === 'yearly'
              ? 'study.io Pro Yearly (₹999/yr)'
              : 'study.io Pro Monthly (₹99/mo)',
          image: '/icon.png',
          prefill: {
            email: user.email || '',
            name: user.displayName || user.name || user.email?.split('@')[0] || '',
          },
          theme: {
            color: '#E6C15A', // Gold accent
            backdrop_color: 'rgba(0, 0, 0, 0.85)',
          },
          handler: async function (response: RazorpayResponse) {
            toast.loading('Verifying payment...', { id: 'billing-verify' });

            try {
              // 4. Verify HMAC SHA256 signature on server
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || resolvedOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan,
                  userId: user.id,
                }),
              });

              const verifyData = (await verifyRes.json()) as {
                success?: boolean;
                isPremium?: boolean;
                plan?: string;
                premiumUntil?: string;
                error?: string;
              };

              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment signature verification failed');
              }

              // 5. Instantly unlock Premium in UI without hard refresh
              if (verifyData.premiumUntil) {
                setImmediatePremium(plan, verifyData.premiumUntil);
              }

              // Trigger background database sync
              refresh().catch(() => {});

              toast.success('Welcome to study.io Pro! 🎉', { id: 'billing-verify' });
              setCheckoutSuccess(true);
              setIsProcessing(false);
              if (onSuccessCallback) onSuccessCallback();
            } catch (err: unknown) {
              const message =
                err instanceof Error ? err.message : 'Payment verification encountered an issue';
              console.error('Verification error:', err);
              toast.error(message, {
                id: 'billing-verify',
              });
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);

        // Handle payment failure event if available
        if (typeof razorpayInstance.on === 'function') {
          razorpayInstance.on('payment.failed', function (failResponse: any) {
            console.error('Razorpay payment failed:', failResponse?.error);
            const desc = failResponse?.error?.description || 'Payment failed or was declined.';
            toast.error(desc, { id: 'billing-verify' });
            setIsProcessing(false);
          });
        }

        razorpayInstance.open();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Error starting checkout. Please try again.';
        console.error('Checkout error:', err);
        toast.error(message);
        setIsProcessing(false);
      }
    },
    [user, loadRazorpayScript, refresh, setImmediatePremium]
  );

  return {
    plans,
    loadingPlans,
    isProcessing,
    checkoutSuccess,
    startCheckout,
    setCheckoutSuccess,
  };
}
