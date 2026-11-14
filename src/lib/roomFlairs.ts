export type RoomFlairId = 'default' | 'solar-flare' | 'cyber-orbit' | 'void-aura' | 'zen-lotus';

export interface RoomFlairConfig {
  id: RoomFlairId;
  name: string;
  subtitle: string;
  description: string;
  isPro: boolean;
  themeColor: string;
  secondaryColor: string;
  gradient: string;
  glowColor: string;
}

export const ROOM_FLAIR_STORAGE_KEY = 'studyio_room_avatar_flair';

export const ROOM_FLAIRS: Record<RoomFlairId, RoomFlairConfig> = {
  default: {
    id: 'default',
    name: 'Focus Ring',
    subtitle: 'Standard Study Aura',
    description: 'Clean emerald & cyan focus ring pulse while studying; subtle amber dashed ring when paused.',
    isPro: false,
    themeColor: '#10B981',
    secondaryColor: '#06B6D4',
    gradient: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
    glowColor: 'rgba(16, 185, 129, 0.45)',
  },
  'solar-flare': {
    id: 'solar-flare',
    name: 'Solar Flare',
    subtitle: 'Orbital Corona Plasma',
    description: 'Fiery golden-orange orbital plasma ring with rotating corona particles while studying.',
    isPro: true,
    themeColor: '#F59E0B',
    secondaryColor: '#EF4444',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #F97316 50%, #EF4444 100%)',
    glowColor: 'rgba(245, 158, 11, 0.55)',
  },
  'cyber-orbit': {
    id: 'cyber-orbit',
    name: 'Cyber Orbit',
    subtitle: 'Dual Tachyon Rings',
    description: 'Dual counter-rotating neon cyan and violet tech rings with glowing orbital nodes while studying.',
    isPro: true,
    themeColor: '#06B6D4',
    secondaryColor: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)',
    glowColor: 'rgba(6, 182, 212, 0.55)',
  },
  'void-aura': {
    id: 'void-aura',
    name: 'Void Aura',
    subtitle: 'Gravitational Singularity',
    description: 'Deep purple and indigo breathing gravitational halo with smooth shockwave ripples while studying.',
    isPro: true,
    themeColor: '#A855F7',
    secondaryColor: '#6366F1',
    gradient: 'linear-gradient(135deg, #A855F7 0%, #6366F1 50%, #3B0764 100%)',
    glowColor: 'rgba(168, 85, 247, 0.55)',
  },
  'zen-lotus': {
    id: 'zen-lotus',
    name: 'Zen Lotus',
    subtitle: 'Harmonic Bloom Cadence',
    description: 'Smooth harmonic wave rings expanding outward in a calm rhythmic cadence while studying.',
    isPro: true,
    themeColor: '#10B981',
    secondaryColor: '#14B8A6',
    gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #0D9488 100%)',
    glowColor: 'rgba(16, 185, 129, 0.55)',
  },
};

export const ROOM_FLAIR_LIST: RoomFlairConfig[] = [
  ROOM_FLAIRS.default,
  ROOM_FLAIRS['solar-flare'],
  ROOM_FLAIRS['cyber-orbit'],
  ROOM_FLAIRS['void-aura'],
  ROOM_FLAIRS['zen-lotus'],
];

export function getEquippedRoomFlair(): RoomFlairId {
  if (typeof window === 'undefined') return 'default';
  try {
    const saved = localStorage.getItem(ROOM_FLAIR_STORAGE_KEY) as RoomFlairId | null;
    if (saved && ROOM_FLAIRS[saved]) {
      return saved;
    }
  } catch {}
  return 'default';
}

export function saveEquippedRoomFlair(id: RoomFlairId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOM_FLAIR_STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent('studyio_room_flair_changed', { detail: id }));
  } catch {}
}

