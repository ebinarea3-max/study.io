export type EmblemFamilyId =
  | 'spark'
  | 'crystal'
  | 'bloom'
  | 'stars'
  | 'summit'
  | 'skyline';

export type EmblemState = 'studying' | 'paused' | 'offline';
export type EmblemSize = 'sm' | 'md' | 'lg';

export interface EmblemFamilyMeta {
  id: EmblemFamilyId;
  name: string;
  tagline: string;
  description: string;
  premium: boolean;
  palette: {
    key: string;
    secondary: string;
    accent: string;
    bg1: string;
    bg2: string;
    glow: string;
  };
}

export const EMBLEM_FAMILIES: Record<EmblemFamilyId, EmblemFamilyMeta> = {
  spark: {
    id: 'spark',
    name: 'Eternal Spark',
    tagline: 'Grows from an ember into a roaring bonfire.',
    description: 'A cozy hearth fire that grows into a towering bonfire as your focus deepens.',
    premium: false,
    palette: {
      key: '#FFC56B',
      secondary: '#FF7A45',
      accent: '#E11D48',
      bg1: '#2E100A',
      bg2: '#140603',
      glow: 'rgba(255, 122, 69, 0.45)',
    },
  },
  crystal: {
    id: 'crystal',
    name: 'Astral Crystal',
    tagline: 'Forms from a shard into a luminous prism cluster.',
    description: 'Resonating geometric shards that assemble into a towering, radiant crystal prism with facet light sweeps.',
    premium: true,
    palette: {
      key: '#67E8F9',
      secondary: '#A78BFA',
      accent: '#38BDF8',
      bg1: '#0F1333',
      bg2: '#06081A',
      glow: 'rgba(103, 232, 249, 0.45)',
    },
  },
  bloom: {
    id: 'bloom',
    name: 'Verdant Bloom',
    tagline: 'Sprouts from seed to a mystical glowing blossom.',
    description: 'A dormant seed that sprouts, grows lush foliage, and blooms with floating pollen and fireflies.',
    premium: true,
    palette: {
      key: '#86EFAC',
      secondary: '#22C55E',
      accent: '#F9A8D4',
      bg1: '#082816',
      bg2: '#03120A',
      glow: 'rgba(134, 239, 172, 0.4)',
    },
  },
  stars: {
    id: 'stars',
    name: 'Constellation',
    tagline: 'Connects cosmic stars into an ascending beacon.',
    description: 'Celestial stars mapping across the deep void, forming interconnected geometric lines and stellar nebula.',
    premium: true,
    palette: {
      key: '#FDE68A',
      secondary: '#818CF8',
      accent: '#C7D2FE',
      bg1: '#0E143A',
      bg2: '#06091E',
      glow: 'rgba(253, 230, 138, 0.45)',
    },
  },
  summit: {
    id: 'summit',
    name: 'Dawn Summit',
    tagline: 'Ascends from foothills to an alpine peak with aurora.',
    description: 'Layered mountain ridges that rise into towering snow peaks bathed in dawn light and northern aurora ribbons.',
    premium: true,
    palette: {
      key: '#FDBA74',
      secondary: '#A78BFA',
      accent: '#F8FAFC',
      bg1: '#1F123B',
      bg2: '#0C061A',
      glow: 'rgba(253, 186, 116, 0.4)',
    },
  },
  skyline: {
    id: 'skyline',
    name: 'Neo Skyline',
    tagline: 'Constructs from ground scaffolding to a glowing metropolis.',
    description: 'An architectural city scape that constructs towering glass monoliths, rooftop beacons, and neon light bridges.',
    premium: true,
    palette: {
      key: '#F472B6',
      secondary: '#22D3EE',
      accent: '#A855F7',
      bg1: '#1C0C30',
      bg2: '#0B0414',
      glow: 'rgba(34, 211, 238, 0.45)',
    },
  },
};

export const ALL_EMBLEM_FAMILIES: EmblemFamilyId[] = [
  'spark',
  'crystal',
  'bloom',
  'stars',
  'summit',
  'skyline',
];

export const FREE_EMBLEM_FAMILIES: EmblemFamilyId[] = ['spark'];

export const PREMIUM_EMBLEM_FAMILIES: EmblemFamilyId[] = [
  'crystal',
  'bloom',
  'stars',
  'summit',
  'skyline',
];

export function isPremiumEmblemFamily(id: string): boolean {
  return PREMIUM_EMBLEM_FAMILIES.includes(id as EmblemFamilyId);
}

export function resolveEmblemFamily(
  rawId: string | null | undefined,
  isPremiumUser: boolean
): EmblemFamilyId {
  if (!rawId || !EMBLEM_FAMILIES[rawId as EmblemFamilyId]) {
    return 'spark';
  }
  const fam = rawId as EmblemFamilyId;
  if (EMBLEM_FAMILIES[fam].premium && !isPremiumUser) {
    return 'spark';
  }
  return fam;
}
