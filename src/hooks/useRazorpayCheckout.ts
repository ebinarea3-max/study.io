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

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key?: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  prefill?: {
    email?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayResponse) => Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
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
  const { refresh } = usePremium();
  const [plans, setPlans] = useState<BillingPlansData | null>(null);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);

  // Fetch plan pricing from /api/billing/plans
  useEffect(() => {
    let isMounted = true;
    async function loadPlans() {
      try {
        const res = await fetch('/api/billing/plans');
        if (res.ok) {
          const data = (await res.json()) as BillingPlansData;
          if (isMounted) setPlans(data);
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      } finally {
        if (isMounted) setLoadingPlans(false);
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

  // Trigger checkout modal
  const startCheckout = useCallback(
    async (plan: 'monthly' | 'yearly', onSuccessCallback?: () => void) => {
      if (!user || user.id.startsWith('guest')) {
        toast.error('Please sign in to subscribe to study.io Premium');
        return;
      }

      setIsProcessing(true);
      setCheckoutSuccess(false);

      try {
        // 1. Load checkout script
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !window.Razorpay) {
          toast.error('Unable to load payment gateway. Please check your network connection.');
          setIsProcessing(false);
          return;
        }

        // 2. Call /api/billing/create-subscription
        const createRes = await fetch('/api/billing/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });

        const createData = (await createRes.json()) as { subscriptionId?: string; error?: string };
        if (!createRes.ok || !createData.subscriptionId) {
          throw new Error(createData.error || 'Failed to initialize subscription');
        }

        const subscriptionId = createData.subscriptionId;
        const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        // 3. Configure Razorpay checkout options
        const options: RazorpayOptions = {
          key: keyId,
          subscription_id: subscriptionId,
          name: 'study.io Premium',
          description: plan === 'yearly' ? 'Yearly Membership' : 'Monthly Membership',
          image: '/icon.png',
          prefill: {
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || '',
          },
          theme: {
            color: '#E6C15A', // Gold accent
          },
          handler: async function (response: RazorpayResponse) {
            toast.loading('Verifying payment...', { id: 'billing-verify' });

            try {
              // 4. Verify HMAC SHA256 signature on server
              const verifyRes = await fetch('/api/billing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(response),
              });

              const verifyData = (await verifyRes.json()) as { success?: boolean; error?: string };
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment signature verification failed');
              }

              // 5. Poll get_my_entitlements via refresh()
              toast.loading('Activating Premium status...', { id: 'billing-verify' });
              for (let i = 0; i < 4; i++) {
                await refresh();
                await new Promise((r) => setTimeout(r, 1200));
              }

              toast.success('Welcome to study.io Premium! 🎉', { id: 'billing-verify' });
              setCheckoutSuccess(true);
              setIsProcessing(false);
              if (onSuccessCallback) onSuccessCallback();
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Payment verification encountered an issue';
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
        razorpayInstance.open();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error starting checkout. Please try again.';
        console.error('Checkout error:', err);
        toast.error(message);
        setIsProcessing(false);
      }
    },
    [user, loadRazorpayScript, refresh]
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
