export function getRankIconPath(tier?: string, division?: string | number, extension: 'webp' | 'png' = 'webp'): string {
  const t = (tier || 'bronze').toLowerCase().trim();
  if (['champion', 'master', 'grandmaster'].includes(t)) {
    return `/images/ranks/${t}.${extension}`;
  }
  const divMap: Record<string, string> = {
    'IV': '4', 'III': '3', 'II': '2', 'I': '1',
    '4': '4', '3': '3', '2': '2', '1': '1'
  };
  const rawDiv = String(division || '1').toUpperCase().trim();
  const div = divMap[rawDiv] || '1';
  return `/images/ranks/${t}-${div}.${extension}`;
}

