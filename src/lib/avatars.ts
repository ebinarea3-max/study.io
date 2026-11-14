/**
 * Official In-App Avatar Vault & Utilities for study.io
 *
 * Rules:
 * - Only avatars available within the app are permitted.
 * - External OAuth profile pictures (e.g. Google account avatars from googleusercontent.com)
 *   are strictly disallowed and automatically mapped to app preset avatars.
 */

export const PRESET_AVATARS = [
  'https://api.dicebear.com/9.x/micah/svg?seed=ScholarA&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=Archivist&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nexus&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/shapes/svg?seed=FocusSigil&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/micah/svg?seed=Nocturne&backgroundColor=0d1117',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=Lyra&backgroundColor=0d1117',
];

export interface PremiumAvatarCollectible {
  id: string; // The canonical saved ID
  name: string;
  slug: string;
  rarity: 'Epic' | 'Legendary';
  image: string;
  signatureColor: string;
  glowColor: string;
  borderColor: string;
}

export const PREMIUM_COLLECTIBLES: PremiumAvatarCollectible[] = [
  {
    id: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Archmage&backgroundColor=241d0b',
    name: 'Arcane Scholar',
    slug: 'arcane-scholar',
    rarity: 'Epic',
    image: '/images/avatars/premium/arcane-scholar.png',
    signatureColor: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    borderColor: '#C084FC',
  },
  {
    id: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Solaris&backgroundColor=1f142b',
    name: 'Astral Monk',
    slug: 'astral-monk',
    rarity: 'Epic',
    image: '/images/avatars/premium/astral-monk.png',
    signatureColor: '#6366F1',
    glowColor: 'rgba(99, 102, 241, 0.45)',
    borderColor: '#818CF8',
  },
  {
    id: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Grandmaster&backgroundColor=28190e',
    name: 'Cyber Librarian',
    slug: 'cyber-librarian',
    rarity: 'Epic',
    image: '/images/avatars/premium/cyber-librarian.png',
    signatureColor: '#22D3EE',
    glowColor: 'rgba(34, 211, 238, 0.45)',
    borderColor: '#38BDF8',
  },
  {
    id: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Celestial&backgroundColor=0e2329',
    name: 'Alchemist',
    slug: 'alchemist',
    rarity: 'Epic',
    image: '/images/avatars/premium/alchemist.png',
    signatureColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    borderColor: '#34D399',
  },
  {
    id: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Empress&backgroundColor=1a1625',
    name: 'Dragon Sage',
    slug: 'dragon-sage',
    rarity: 'Epic',
    image: '/images/avatars/premium/dragon-sage.png',
    signatureColor: '#DC2626',
    glowColor: 'rgba(220, 38, 38, 0.45)',
    borderColor: '#F87171',
  },
  {
    id: 'https://api.dicebear.com/9.x/adventurer/svg?seed=ValkyriePrime&backgroundColor=1c1526',
    name: 'Moon Oracle',
    slug: 'moon-oracle',
    rarity: 'Epic',
    image: '/images/avatars/premium/moon-oracle.png',
    signatureColor: '#93C5FD',
    glowColor: 'rgba(147, 197, 253, 0.45)',
    borderColor: '#BAE6FD',
  },
  {
    id: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ApexCore&backgroundColor=1a1a2e',
    name: 'Phoenix Archivist',
    slug: 'phoenix-archivist',
    rarity: 'Legendary',
    image: '/images/avatars/premium/phoenix-archivist.png',
    signatureColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    borderColor: '#FDE68A',
  },
  {
    id: 'https://api.dicebear.com/9.x/shapes/svg?seed=GoldenSigil&backgroundColor=2b1e09',
    name: 'Crystal Mage',
    slug: 'crystal-mage',
    rarity: 'Legendary',
    image: '/images/avatars/premium/crystal-mage.png',
    signatureColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.5)',
    borderColor: '#7DD3FC',
  },
  {
    id: 'https://api.dicebear.com/9.x/micah/svg?seed=ChronoLord&backgroundColor=1c1328',
    name: 'Clockwork Inventor',
    slug: 'clockwork-inventor',
    rarity: 'Legendary',
    image: '/images/avatars/premium/clockwork-inventor.png',
    signatureColor: '#D97706',
    glowColor: 'rgba(217, 119, 6, 0.5)',
    borderColor: '#FCD34D',
  },
  {
    id: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sovereign&backgroundColor=141f2d',
    name: 'Void Walker',
    slug: 'void-walker',
    rarity: 'Legendary',
    image: '/images/avatars/premium/void-walker.png',
    signatureColor: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    borderColor: '#DDD6FE',
  },
  {
    id: 'https://api.dicebear.com/9.x/adventurer/svg?seed=PhantomBlade&backgroundColor=151824',
    name: 'Samurai Scholar',
    slug: 'samurai-scholar',
    rarity: 'Legendary',
    image: '/images/avatars/premium/samurai-scholar.png',
    signatureColor: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.5)',
    borderColor: '#FDA4AF',
  },
  {
    id: 'https://api.dicebear.com/9.x/shapes/svg?seed=StarlightCrown&backgroundColor=251b0d',
    name: 'Celestial Cartographer',
    slug: 'celestial-cartographer',
    rarity: 'Legendary',
    image: '/images/avatars/premium/celestial-cartographer.png',
    signatureColor: '#14B8A6',
    glowColor: 'rgba(20, 184, 166, 0.5)',
    borderColor: '#5EEAD4',
  },
];

export const PREMIUM_AVATAR_MAP: Record<string, PremiumAvatarCollectible> = Object.fromEntries(
  PREMIUM_COLLECTIBLES.flatMap((c) => [
    [c.id, c],
    [c.image, c],
    [c.slug, c],
  ])
);

export const VAULT_CATEGORIES: {
  name: string;
  isPremium?: boolean;
  badge?: string;
  avatars: string[];
}[] = [
  {
    name: 'PREMIUM // ELITE SCHOLARS',
    isPremium: true,
    badge: 'PRO EXCLUSIVE',
    avatars: PREMIUM_COLLECTIBLES.map((c) => c.id),
  },
  {
    name: 'SCHOLARS & ARCHIVISTS',
    avatars: [
      'https://api.dicebear.com/9.x/micah/svg?seed=Sage1',
      'https://api.dicebear.com/9.x/micah/svg?seed=Cipher',
      'https://api.dicebear.com/9.x/micah/svg?seed=Aura',
      'https://api.dicebear.com/9.x/micah/svg?seed=Raven',
      'https://api.dicebear.com/9.x/micah/svg?seed=Atlas',
      'https://api.dicebear.com/9.x/micah/svg?seed=Zenith',
      'https://api.dicebear.com/9.x/micah/svg?seed=Orion',
      'https://api.dicebear.com/9.x/micah/svg?seed=Lyra',
      'https://api.dicebear.com/9.x/micah/svg?seed=Kaelen',
      'https://api.dicebear.com/9.x/micah/svg?seed=Nova',
      'https://api.dicebear.com/9.x/micah/svg?seed=Vesper',
      'https://api.dicebear.com/9.x/micah/svg?seed=Rowan',
    ],
  },
  {
    name: 'ADVENTURERS & STRATEGISTS',
    avatars: [
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Alchemist',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Novelist',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Tactician',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Oracle',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Vanguard',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Chronos',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Shinobi',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Sorcerer',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Paladin',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Ranger',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Glitch',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer',
    ],
  },
  {
    name: 'CYBERNETIC COGNITION',
    avatars: [
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=QuantumCore',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CyberZen',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=NeuroByte',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=EchoProtocol',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=MatrixSoul',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Axiom',
    ],
  },
  {
    name: 'MINIMALIST SIGILS',
    avatars: [
      'https://api.dicebear.com/9.x/shapes/svg?seed=Focus',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Catalyst',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Vector',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Prism',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Eclipse',
      'https://api.dicebear.com/9.x/shapes/svg?seed=NexusOrbit',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Hypercube',
      'https://api.dicebear.com/9.x/shapes/svg?seed=Monolith',
    ],
  },
];

// Flat list of all available app avatars for fast lookup
export const ALL_APP_AVATARS: string[] = Array.from(
  new Set([
    ...PRESET_AVATARS,
    ...VAULT_CATEGORIES.flatMap((c) => c.avatars),
  ])
);

/**
 * Checks whether an avatar URL is an authentic in-app avatar.
 * Returns false for any external Google OAuth profile pictures (e.g. googleusercontent.com).
 */
export function isAppAvatar(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length === 0) return false;

  // Explicitly disallow any Google profile picture domains
  if (
    trimmed.includes('googleusercontent.com') ||
    trimmed.includes('google.com') ||
    trimmed.includes('gstatic.com') ||
    trimmed.includes('ggpht.com')
  ) {
    return false;
  }

  // Allowed: Dicebear SVG URLs or local in-app asset paths
  if (trimmed.startsWith('https://api.dicebear.com/')) {
    return true;
  }
  if (trimmed.startsWith('/') || trimmed.startsWith('data:image/svg+xml')) {
    return true;
  }

  return false;
}

/**
 * Generates a deterministic preset avatar from a username or user ID seed,
 * ensuring new users get a consistent in-app avatar upon first login.
 */
export function getDeterministicDefaultAvatar(identifier?: string): string {
  if (!identifier || identifier.trim().length === 0) {
    return PRESET_AVATARS[0];
  }
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_AVATARS.length;
  return PRESET_AVATARS[index];
}

/**
 * Safely resolves an avatar for any user:
 * - If the URL is already a valid in-app avatar, it is returned.
 * - If the URL is a Google account avatar or invalid/empty, it returns a deterministic in-app preset avatar.
 */
export function resolveAppAvatar(url?: string | null, seed?: string): string {
  if (url && typeof url === 'string') {
    const trimmed = url.trim();
    if (PREMIUM_AVATAR_MAP[trimmed]) {
      return PREMIUM_AVATAR_MAP[trimmed].image;
    }
    if (isAppAvatar(trimmed)) {
      return trimmed;
    }
  }
  return getDeterministicDefaultAvatar(seed);
}

