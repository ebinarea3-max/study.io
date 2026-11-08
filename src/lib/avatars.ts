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
    avatars: [
      'https://api.dicebear.com/9.x/lorelei/svg?seed=Archmage&backgroundColor=241d0b',
      'https://api.dicebear.com/9.x/lorelei/svg?seed=Solaris&backgroundColor=1f142b',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Grandmaster&backgroundColor=28190e',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=Celestial&backgroundColor=0e2329',
      'https://api.dicebear.com/9.x/lorelei/svg?seed=Empress&backgroundColor=1a1625',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=ValkyriePrime&backgroundColor=1c1526',
      'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ApexCore&backgroundColor=1a1a2e',
      'https://api.dicebear.com/9.x/shapes/svg?seed=GoldenSigil&backgroundColor=2b1e09',
      'https://api.dicebear.com/9.x/micah/svg?seed=ChronoLord&backgroundColor=1c1328',
      'https://api.dicebear.com/9.x/lorelei/svg?seed=Sovereign&backgroundColor=141f2d',
      'https://api.dicebear.com/9.x/adventurer/svg?seed=PhantomBlade&backgroundColor=151824',
      'https://api.dicebear.com/9.x/shapes/svg?seed=StarlightCrown&backgroundColor=251b0d',
    ],
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
  if (isAppAvatar(url)) {
    return url!.trim();
  }
  return getDeterministicDefaultAvatar(seed);
}
