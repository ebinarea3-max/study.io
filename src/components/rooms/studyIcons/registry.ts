'use client';

export type StudyIconId =
  | 'lamp'
  | 'book'
  | 'pencil'
  | 'coffee'
  | 'owl'
  | 'cat'
  | 'rocket'
  | 'sprout'
  | 'laptop'
  | 'night';

export type StudyIconState = 'studying' | 'paused' | 'idle';
export type StudyIconSize = 'sm' | 'md' | 'lg';

export interface StudyIconMeta {
  id: StudyIconId;
  name: string;
  description: string; // 8 words or fewer
  premium: boolean;
  palette: {
    key: string;
    bg1: string;
    bg2: string;
    glow: string;
  };
}

export const FREE_ICON_IDS: StudyIconId[] = ['lamp', 'book', 'pencil', 'coffee'];

export const PREMIUM_ICON_IDS: StudyIconId[] = [
  'owl',
  'cat',
  'rocket',
  'sprout',
  'laptop',
  'night',
];

export const ALL_ICON_IDS: StudyIconId[] = [...FREE_ICON_IDS, ...PREMIUM_ICON_IDS];

export const STUDY_ICONS: Record<StudyIconId, StudyIconMeta> = {
  lamp: {
    id: 'lamp',
    name: 'Desk Lamp',
    description: 'Amber warm beam lighting your session.',
    premium: false,
    palette: {
      key: '#FFC56B',
      bg1: '#3D2000',
      bg2: '#1A0E00',
      glow: 'rgba(255, 197, 107, 0.45)',
    },
  },
  book: {
    id: 'book',
    name: 'Open Book',
    description: 'Teal pages turning with gentle sparkles.',
    premium: false,
    palette: {
      key: '#5EEAD4',
      bg1: '#012B3A',
      bg2: '#001520',
      glow: 'rgba(94, 234, 212, 0.4)',
    },
  },
  pencil: {
    id: 'pencil',
    name: 'Writing Pencil',
    description: 'Lilac pencil tracing lines across paper.',
    premium: false,
    palette: {
      key: '#C4B5FD',
      bg1: '#1E0D40',
      bg2: '#0D0620',
      glow: 'rgba(196, 181, 253, 0.4)',
    },
  },
  coffee: {
    id: 'coffee',
    name: 'Coffee Cup',
    description: 'Steaming warm brew for deep focus.',
    premium: false,
    palette: {
      key: '#FDBA74',
      bg1: '#2D0F00',
      bg2: '#160700',
      glow: 'rgba(253, 186, 116, 0.4)',
    },
  },
  owl: {
    id: 'owl',
    name: 'Wise Owl',
    description: 'Watchful nocturnal scholar watching over work.',
    premium: true,
    palette: {
      key: '#A78BFA',
      bg1: '#1F113D',
      bg2: '#0D061A',
      glow: 'rgba(167, 139, 250, 0.45)',
    },
  },
  cat: {
    id: 'cat',
    name: 'Study Cat',
    description: 'Curled up companion dozing beside books.',
    premium: true,
    palette: {
      key: '#FB923C',
      bg1: '#2E1200',
      bg2: '#170900',
      glow: 'rgba(251, 146, 60, 0.4)',
    },
  },
  rocket: {
    id: 'rocket',
    name: 'Deep Orbit',
    description: 'Tachyon rocket accelerating into deep study.',
    premium: true,
    palette: {
      key: '#38BDF8',
      bg1: '#02213D',
      bg2: '#010E1A',
      glow: 'rgba(56, 189, 248, 0.45)',
    },
  },
  sprout: {
    id: 'sprout',
    name: 'Study Sprout',
    description: 'Growing knowledge one leaf at time.',
    premium: true,
    palette: {
      key: '#4ADE80',
      bg1: '#052A14',
      bg2: '#02140A',
      glow: 'rgba(74, 222, 128, 0.4)',
    },
  },
  laptop: {
    id: 'laptop',
    name: 'Code Terminal',
    description: 'Glowing editor windows with syntax flow.',
    premium: true,
    palette: {
      key: '#60A5FA',
      bg1: '#0A1E3F',
      bg2: '#040C1A',
      glow: 'rgba(96, 165, 250, 0.45)',
    },
  },
  night: {
    id: 'night',
    name: 'Midnight Moon',
    description: 'Crescent moon and stars over midnight.',
    premium: true,
    palette: {
      key: '#E879F9',
      bg1: '#2A063B',
      bg2: '#12021A',
      glow: 'rgba(232, 121, 249, 0.45)',
    },
  },
};

/**
 * Returns a stable free icon id based on a string hash of userId.
 * Ensures rooms look varied even when users haven't explicitly chosen an icon.
 */
export function getDefaultIconId(userId: string): StudyIconId {
  if (!userId) return 'lamp';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return FREE_ICON_IDS[hash % FREE_ICON_IDS.length];
}

export function isFreeIconId(id: string): boolean {
  return FREE_ICON_IDS.includes(id as StudyIconId);
}

// Re-export StudyIcon component
export { StudyIcon } from './StudyIcon';
export type { StudyIconProps } from './StudyIcon';
