export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  previewColors: [string, string, string]; // [bg, surface, accent]
  themeColor: string; // The hex value of page/header background (--bg)
  scheme: 'dark' | 'light';
  isLight?: boolean;
  isPremium?: boolean;
}

export const THEMES: ThemeOption[] = [
  // ─── FREE THEMES ──────────────────────────────────────────
  {
    id: 'rank',
    name: 'Rank colors',
    description: 'Follows your rank',
    previewColors: ['#07090E', '#0F1117', '#D4A017'],
    themeColor: '#07090E',
    scheme: 'dark',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Cool blue on deep navy',
    previewColors: ['#090B10', '#12151D', '#5B8CFF'],
    themeColor: '#090B10',
    scheme: 'dark',
  },
  {
    id: 'ember',
    name: 'Ember',
    description: 'Warm amber on charcoal',
    previewColors: ['#0F0B09', '#1A1410', '#F0924A'],
    themeColor: '#0F0B09',
    scheme: 'dark',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Clear cyan on deep sea',
    previewColors: ['#060B12', '#0E1824', '#4DB6E8'],
    themeColor: '#060B12',
    scheme: 'dark',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft pink on dark plum',
    previewColors: ['#0E0A0C', '#1A1216', '#F0709A'],
    themeColor: '#0E0A0C',
    scheme: 'dark',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Violet on cosmic dark',
    previewColors: ['#0A0812', '#15111F', '#9B8CFF'],
    themeColor: '#0A0812',
    scheme: 'dark',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Pure monochrome',
    previewColors: ['#0B0B0C', '#151516', '#E8E8E8'],
    themeColor: '#0B0B0C',
    scheme: 'dark',
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'Bright and warm, light mode',
    previewColors: ['#F5F2EC', '#FFFFFF', '#B45309'],
    themeColor: '#F5F2EC',
    scheme: 'light',
    isLight: true,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Electric neon cyan & fuchsia on hyperdark void',
    previewColors: ['#080811', '#121124', '#00F0FF'],
    themeColor: '#080811',
    scheme: 'dark',
  },
  {
    id: 'amethyst',
    name: 'Amethyst',
    description: 'Luminous royal violet on dark velvet',
    previewColors: ['#090612', '#160E25', '#A855F7'],
    themeColor: '#090612',
    scheme: 'dark',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    description: 'Imperial luminous jade on obsidian',
    previewColors: ['#05100B', '#0B1E15', '#10B981'],
    themeColor: '#05100B',
    scheme: 'dark',
  },

  // ─── PREMIUM THEMES (7 EXCLUSIVE THEMES) ─────────────────
  {
    id: 'goldleaf',
    name: 'Gold Leaf',
    description: 'Warm gold on dark leather',
    previewColors: ['#0C0A06', '#17130A', '#E6C15A'],
    themeColor: '#0C0A06',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'crimson',
    name: 'Crimson',
    description: 'Deep red on near black',
    previewColors: ['#0E0809', '#1A0F11', '#E5484D'],
    themeColor: '#0E0809',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'sakura',
    name: 'Sakura',
    description: 'Delicate cherry blossom on twilight ink',
    previewColors: ['#0E0A12', '#1A1220', '#F472B6'],
    themeColor: '#0E0A12',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Warm roasted caramel on dark cocoa',
    previewColors: ['#0E0B08', '#1A1410', '#D4A373'],
    themeColor: '#0E0B08',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Calm green on dark moss',
    previewColors: ['#070D0B', '#0F1A16', '#3DBE8B'],
    themeColor: '#070D0B',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'abyss',
    name: 'OLED Abyss',
    description: 'True pitch black for maximum focus',
    previewColors: ['#000000', '#0E0E0E', '#FFFFFF'],
    themeColor: '#000000',
    scheme: 'dark',
    isPremium: true,
  },
  {
    id: 'matcha',
    name: 'Matcha',
    description: 'Creamy green tea, warm pastel light mode',
    previewColors: ['#F4F6F0', '#FFFFFF', '#4D7C0F'],
    themeColor: '#F4F6F0',
    scheme: 'light',
    isLight: true,
    isPremium: true,
  },
];

export const DEFAULT_THEME_ID = 'rank';
export const DEFAULT_THEME = THEMES[0];

// Small serialized map (id -> { themeColor, scheme }) for the layout inline no-flash script
export const THEME_META_MAP: Record<string, { themeColor: string; scheme: 'dark' | 'light' }> =
  THEMES.reduce((acc, t) => {
    acc[t.id] = { themeColor: t.themeColor, scheme: t.scheme };
    return acc;
  }, {} as Record<string, { themeColor: string; scheme: 'dark' | 'light' }>);

