import 'server-only';
import { NextResponse } from 'next/server';
import { getRazorpayClient, getPlanIds } from '@/lib/server/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PlanInfo {
  id: string;
  name: string;
  amount: number; // in smallest currency unit (e.g. paise)
  currency: string;
  formattedAmount: string;
  period: 'monthly' | 'yearly';
  interval: number;
}

interface CachedPlans {
  timestamp: number;
  data: {
    configured: boolean;
    monthly: PlanInfo | null;
    yearly: PlanInfo | null;
  };
}

let cachedPlans: CachedPlans | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour server cache

function formatCurrency(amountPaise: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amountPaise / 100);
  } catch {
    return `₹${Math.round(amountPaise / 100)}`;
  }
}

export async function GET() {
  try {
    // 1. Check in-memory 1-hour cache
    const now = Date.now();
    if (cachedPlans && now - cachedPlans.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedPlans.data, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
        },
      });
    }

    const planIds = getPlanIds();
    if (!planIds.monthly || !planIds.yearly) {
      return NextResponse.json(
        {
          configured: false,
          monthly: null,
          yearly: null,
          message:
            'Razorpay Plan IDs not yet configured. Please set RAZORPAY_PLAN_ID_MONTHLY and RAZORPAY_PLAN_ID_YEARLY.',
        },
        { status: 200 }
      );
    }

    const razorpay = getRazorpayClient();

    // 2. Fetch plans concurrently from Razorpay
    const [monthlyPlanRaw, yearlyPlanRaw] = await Promise.all([
      razorpay.plans.fetch(planIds.monthly).catch((err) => {
        console.error('Failed to fetch monthly plan:', err.message);
        return null;
      }),
      razorpay.plans.fetch(planIds.yearly).catch((err) => {
        console.error('Failed to fetch yearly plan:', err.message);
        return null;
      }),
    ]);

    const monthly: PlanInfo | null = monthlyPlanRaw
      ? {
          id: (monthlyPlanRaw as any).id,
          name: (monthlyPlanRaw as any).item?.name || 'study.io Premium Monthly',
          amount: (monthlyPlanRaw as any).item?.amount || 0,
          currency: (monthlyPlanRaw as any).item?.currency || 'INR',
          formattedAmount: formatCurrency(
            (monthlyPlanRaw as any).item?.amount || 0,
            (monthlyPlanRaw as any).item?.currency || 'INR'
          ),
          period: 'monthly',
          interval: (monthlyPlanRaw as any).interval || 1,
        }
      : null;

    const yearly: PlanInfo | null = yearlyPlanRaw
      ? {
          id: (yearlyPlanRaw as any).id,
          name: (yearlyPlanRaw as any).item?.name || 'study.io Premium Yearly',
          amount: (yearlyPlanRaw as any).item?.amount || 0,
          currency: (yearlyPlanRaw as any).item?.currency || 'INR',
          formattedAmount: formatCurrency(
            (yearlyPlanRaw as any).item?.amount || 0,
            (yearlyPlanRaw as any).item?.currency || 'INR'
          ),
          period: 'yearly',
          interval: (yearlyPlanRaw as any).interval || 1,
        }
      : null;

    const responsePayload = {
      configured: Boolean(monthly && yearly),
      monthly,
      yearly,
    };

    // Update cache
    cachedPlans = {
      timestamp: now,
      data: responsePayload,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error: any) {
    console.error('Error fetching Razorpay plans:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch billing plans' },
      { status: 500 }
    );
  }
}
