export interface FocusScene {
  id: string;
  name: string;
  description: string;
  premium: boolean;
  thumbnail: string; // Rich multi-layer CSS gradient fallback
  disabled?: boolean; // When true, hidden from picker as "Coming soon"
}

export const FOCUS_SCENES: readonly FocusScene[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Your usual focus background.',
    premium: false,
    thumbnail:
      'radial-gradient(ellipse at 50% 50%, #232738 0%, #0f121d 60%, #05060a 100%)',
  },
  {
    id: 'rain',
    name: 'Rain on glass',
    description: 'Rain on a window at night.',
    premium: true,
    thumbnail:
      'radial-gradient(circle at 28% 32%, rgba(245, 158, 11, 0.5) 0%, transparent 42%), radial-gradient(circle at 72% 62%, rgba(56, 189, 248, 0.45) 0%, transparent 46%), radial-gradient(circle at 50% 80%, rgba(244, 63, 94, 0.35) 0%, transparent 40%), linear-gradient(180deg, #090e17 0%, #111a29 55%, #070c14 100%)',
  },
  {
    id: 'stars',
    name: 'Starfield',
    description: 'A slow drift of stars.',
    premium: true,
    thumbnail:
      'radial-gradient(ellipse at 65% 35%, rgba(147, 51, 234, 0.4) 0%, transparent 50%), radial-gradient(circle at 30% 68%, rgba(14, 165, 233, 0.35) 0%, transparent 52%), linear-gradient(135deg, transparent 35%, rgba(255, 235, 215, 0.16) 48%, rgba(220, 210, 245, 0.12) 54%, transparent 68%), linear-gradient(180deg, #0B1030 0%, #070A1C 50%, #03040B 100%)',
  },
  {
    id: 'library',
    name: 'Library glow',
    description: 'A warm lamp and floating dust.',
    premium: true,
    thumbnail:
      'radial-gradient(circle at 22% 24%, rgba(251, 191, 36, 0.5) 0%, rgba(217, 119, 6, 0.28) 40%, transparent 70%), linear-gradient(135deg, #2b1704 0%, #150d06 60%, #080503 100%)',
    disabled: true,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Soft northern lights.',
    premium: true,
    thumbnail:
      'radial-gradient(ellipse at 35% 22%, rgba(52, 211, 153, 0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 32%, rgba(139, 92, 246, 0.45) 0%, transparent 60%), linear-gradient(180deg, #022c22 0%, #064e3b 45%, #05161e 100%)',
    disabled: true,
  },
  {
    id: 'embers',
    name: 'Embers',
    description: 'Warm sparks rising.',
    premium: true,
    thumbnail:
      'radial-gradient(circle at 50% 90%, rgba(239, 68, 68, 0.55) 0%, rgba(249, 115, 22, 0.4) 32%, transparent 70%), linear-gradient(180deg, #0c0402 0%, #1c0903 50%, #2f0e04 100%)',
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
