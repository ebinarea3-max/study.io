export interface FocusScene {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  glow: string; // Clock text-shadow ambient glow color
  thumbnail: string; // Rich multi-layer CSS gradient fallback
  disabled?: boolean;
}

export const FOCUS_SCENES: readonly FocusScene[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Your usual focus background.',
    premium: false,
    glow: 'rgba(255, 255, 255, 0.15)',
    thumbnail:
      'radial-gradient(ellipse at 50% 50%, #232738 0%, #0f121d 60%, #05060a 100%)',
  },
  {
    id: 'dusk',
    name: 'Dusk peaks',
    description: 'Sunset mountain ridges with warm glowing sky.',
    premium: true,
    glow: 'rgba(255,170,120,.45)',
    thumbnail:
      'linear-gradient(180deg, #171040 0%, #4a2372 35%, #b9487c 62%, #f58a69 82%, #ffc47c 100%)',
  },
  {
    id: 'forest',
    name: 'Moonlit forest',
    description: 'Pines, mist, and fireflies under the moon.',
    premium: true,
    glow: 'rgba(150,240,220,.35)',
    thumbnail:
      'radial-gradient(circle at 75% 25%, #bff5e6 0%, transparent 40%), linear-gradient(180deg, #030d14 0%, #0a2630 55%, #15494c 100%)',
  },
  {
    id: 'neon',
    name: 'Neon skyline',
    description: 'Rainy city night with illuminated skyline.',
    premium: true,
    glow: 'rgba(255,80,160,.5)',
    thumbnail:
      'radial-gradient(circle at 50% 55%, #ff6ab0 0%, transparent 55%), linear-gradient(180deg, #06021a 0%, #1a0945 40%, #5a1a78 70%, #d1307f 100%)',
  },
  {
    id: 'sea',
    name: 'Moonlit sea',
    description: 'Ocean swells and moon shimmer.',
    premium: true,
    glow: 'rgba(150,190,255,.4)',
    thumbnail:
      'radial-gradient(circle at 50% 30%, #bcd6ff 0%, transparent 45%), linear-gradient(180deg, #040a1c 0%, #0c2147 55%, #1f4f80 100%)',
  },
  {
    id: 'aurora',
    name: 'Polar aurora',
    description: 'Northern lights dancing over snowy ridges.',
    premium: true,
    glow: 'rgba(100,255,190,.35)',
    thumbnail:
      'linear-gradient(135deg, #5dffb3 0%, #2fd4c9 40%, #8a6bff 100%)',
  },
  // Compatibility entries for previously saved choices
  {
    id: 'rain',
    name: 'Rain on glass',
    description: 'Rain on a window at night.',
    premium: true,
    glow: 'rgba(125, 211, 252, 0.35)',
    thumbnail:
      'radial-gradient(circle at 28% 32%, rgba(245, 158, 11, 0.5) 0%, transparent 42%), radial-gradient(circle at 72% 62%, rgba(56, 189, 248, 0.45) 0%, transparent 46%), linear-gradient(180deg, #090e17 0%, #111a29 55%, #070c14 100%)',
    disabled: true,
  },
  {
    id: 'stars',
    name: 'Starfield',
    description: 'A slow drift of stars.',
    premium: true,
    glow: 'rgba(199, 210, 254, 0.35)',
    thumbnail:
      'radial-gradient(ellipse at 65% 35%, rgba(147, 51, 234, 0.4) 0%, transparent 50%), linear-gradient(180deg, #0B1030 0%, #070A1C 50%, #03040B 100%)',
    disabled: true,
  },
] as const;

export const AVAILABLE_SCENES = FOCUS_SCENES.filter((scene) => !scene.disabled);

export const DEFAULT_SCENE_ID = 'default';

export function getSceneById(id: string | null | undefined): FocusScene {
  if (!id) return FOCUS_SCENES[0];
  const found = FOCUS_SCENES.find((scene) => scene.id === id);
  return found || FOCUS_SCENES[0];
}
