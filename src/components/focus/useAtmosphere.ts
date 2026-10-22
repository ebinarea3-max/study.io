'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { soundFx, AmbientSoundType } from '../../lib/audio';

export type AtmosphereSoundId = AmbientSoundType | 'none';

export interface AtmosphereOption {
  id: AtmosphereSoundId;
  label: string;
  description: string;
  category: 'nature' | 'noise' | 'music' | 'silent';
}

export const ATMOSPHERE_OPTIONS: AtmosphereOption[] = [
  { id: 'none', label: 'Silent', description: 'Pure quiet focus', category: 'silent' },
  { id: 'rain', label: 'Gentle Rain', description: 'Calming rainfall on rooftop', category: 'nature' },
  { id: 'campfire', label: 'Campfire', description: 'Warm crackling hearth flame', category: 'nature' },
  { id: 'waves', label: 'Ocean Waves', description: 'Rhythmic coastal tide', category: 'nature' },
  { id: 'lofi', label: 'Lo-Fi Chill', description: 'Mellow beats for deep focus', category: 'music' },
  { id: 'brownnoise', label: 'Brown Noise', description: 'Deep low-frequency rumble', category: 'noise' },
  { id: 'pinknoise', label: 'Pink Noise', description: 'Balanced soothing static', category: 'noise' },
  { id: 'whitenoise', label: 'White Noise', description: 'Crisp masking frequency', category: 'noise' },
];

export function getAtmosphereOption(id: AtmosphereSoundId): AtmosphereOption {
  return ATMOSPHERE_OPTIONS.find((opt) => opt.id === id) || ATMOSPHERE_OPTIONS[0];
}

const STORAGE_SOUND_KEY = 'studyio-atmosphere-sound';
const STORAGE_VOLUME_KEY = 'studyio-atmosphere-volume';
const STORAGE_EVENT = 'studyio-atmosphere-update';
const DEFAULT_VOLUME = 0.5;

function subscribeStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

function getSavedSoundSnapshot(): AtmosphereSoundId {
  if (typeof window === 'undefined') return 'none';
  try {
    const saved = localStorage.getItem(STORAGE_SOUND_KEY) as AtmosphereSoundId | null;
    if (saved && (saved === 'none' || ATMOSPHERE_OPTIONS.some((o) => o.id === saved))) {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'none';
}

function getServerSoundSnapshot(): AtmosphereSoundId {
  return 'none';
}

function getVolumeSnapshot(): number {
  if (typeof window === 'undefined') return DEFAULT_VOLUME;
  try {
    const saved = localStorage.getItem(STORAGE_VOLUME_KEY);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_VOLUME;
}

function getServerVolumeSnapshot(): number {
  return DEFAULT_VOLUME;
}

export function useAtmosphere() {
  const currentSound = useSyncExternalStore(
    subscribeStorage,
    getSavedSoundSnapshot,
    getServerSoundSnapshot
  );

  const currentVolume = useSyncExternalStore(
    subscribeStorage,
    getVolumeSnapshot,
    getServerVolumeSnapshot
  );

  const selectAtmosphere = useCallback((type: AtmosphereSoundId) => {
    try {
      localStorage.setItem(STORAGE_SOUND_KEY, type);
      notifyStorageChange();
    } catch {
      // ignore
    }

    if (type === 'none') {
      soundFx.stopAmbient();
    } else {
      const vol = getVolumeSnapshot();
      soundFx.startAmbient(type, vol);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(STORAGE_VOLUME_KEY, String(clamped));
      notifyStorageChange();
    } catch {
      // ignore
    }
    soundFx.setAmbientVolume(clamped);
  }, []);

  return {
    ambientSound: currentSound,
    ambientVolume: currentVolume,
    selectAtmosphere,
    setVolume,
    options: ATMOSPHERE_OPTIONS,
    activeOption: getAtmosphereOption(currentSound),
  };
}
