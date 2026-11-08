'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useRazorpayCheckout } from '@/hooks/useRazorpayCheckout';

interface RazorpayCheckoutButtonProps {
  plan?: 'monthly' | 'yearly';
  className?: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function RazorpayCheckoutButton({
  plan = 'monthly',
  className = '',
  children,
  onSuccess,
}: RazorpayCheckoutButtonProps) {
  const { startCheckout, isProcessing } = useRazorpayCheckout();

  return (
    <button
      type="button"
      onClick={() => startCheckout(plan, onSuccess)}
      disabled={isProcessing}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-semibold shadow-lg shadow-amber-500/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'
      }
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        children || (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Upgrade to Pro ({plan === 'yearly' ? '₹999/yr' : '₹99/mo'})</span>
          </>
        )
      )}
    </button>
  );
}

