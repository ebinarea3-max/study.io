import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'study.io - Focus & Habit Tracking',
    short_name: 'study.io',
    description: 'Gamified collaborative focus and habit tracking platform',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#080b12',
    theme_color: '#080b12',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
