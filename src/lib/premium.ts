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
    name: 'Deep Analytics & Reports',
    description: 'Weekly performance report cards, subject trends, and unlimited historical date navigation.',
  },
};

export interface UserEntitlements {
  isPremium: boolean;
  premiumUntil: string | null;
  plan: string | null;
  status: string;
  cancelAtCycleEnd: boolean;
}

/**
 * Premium accent: a fixed gold gradient (#F5E6A8 to #E6C15A to #B8892B)
 * used ONLY on premium surfaces and badges, independent of the selected theme.
 */
export const PREMIUM_GOLD_GRADIENT = 'linear-gradient(135deg, #F5E6A8 0%, #E6C15A 50%, #B8892B 100%)';
export const PREMIUM_GOLD_BORDER = 'rgba(230, 193, 90, 0.3)';
export const PREMIUM_GOLD_GLOW = 'rgba(230, 193, 90, 0.2)';
export const PREMIUM_GOLD_ACCENT = '#E6C15A';

