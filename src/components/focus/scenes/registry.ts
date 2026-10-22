export interface FocusScene {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  thumbnail: string; // CSS gradient string
  disabled?: boolean; // When true, hidden from picker as "Coming soon"
}

export const FOCUS_SCENES: readonly FocusScene[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Your usual focus background.',
    premium: false,
    thumbnail: 'radial-gradient(circle at 50% 50%, #1c1c24 0%, #08080a 100%)',
  },
  {
    id: 'rain',
    name: 'Rain on glass',
    description: 'Rain on a window at night.',
    premium: true,
    thumbnail: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 50%, #0a1128 100%)',
  },
  {
    id: 'stars',
    name: 'Starfield',
    description: 'A slow drift of stars.',
    premium: true,
    thumbnail: 'linear-gradient(135deg, #050510 0%, #0a0e27 50%, #030712 100%)',
  },
  {
    id: 'library',
    name: 'Library glow',
    description: 'A warm lamp and floating dust.',
    premium: true,
    thumbnail: 'linear-gradient(135deg, #2b1704 0%, #150d06 60%, #080503 100%)',
    disabled: true,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Soft northern lights.',
    premium: true,
    thumbnail: 'linear-gradient(135deg, #022c22 0%, #064e3b 40%, #1e1b4b 100%)',
    disabled: true,
  },
  {
    id: 'embers',
    name: 'Embers',
    description: 'Warm sparks rising.',
    premium: true,
    thumbnail: 'linear-gradient(180deg, #180500 0%, #290b02 50%, #431407 100%)',
    disabled: true,
  },
] as const;

// In Phase 1 only non-disabled scenes are available in the picker
export const AVAILABLE_SCENES = FOCUS_SCENES.filter((scene) => !scene.disabled);

export const DEFAULT_SCENE_ID = 'default';

export function getSceneById(id: string | null | undefined): FocusScene {
  if (!id) return FOCUS_SCENES[0];
  const found = FOCUS_SCENES.find((scene) => scene.id === id);
  return found || FOCUS_SCENES[0];
}
