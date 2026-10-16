/**
 * Premium Features Registry and Constants
 * 
 * Defines all gated premium features in study.io.
 */

export type PremiumFeatureKey = 'premium_themes' | 'insights';

export interface PremiumFeature {
  key: PremiumFeatureKey;
  name: string;
  description: string;
}

export const PREMIUM_FEATURES: Record<PremiumFeatureKey, PremiumFeature> = {
  premium_themes: {
    key: 'premium_themes',
    name: 'Premium Themes',
    description: 'Unlock handcrafted aesthetic themes including Gold Leaf and Crimson.',
  },
  insights: {
    key: 'insights',
    name: 'Insights',
    description: 'Deep analytics, best focus hours, active days heatmap, and productivity patterns.',
  },
};

export interface UserEntitlements {
  isPremium: boolean;
  premiumUntil: string | null;
  plan: string | null;
  status: string;
  cancelAtCycleEnd: boolean;
}
