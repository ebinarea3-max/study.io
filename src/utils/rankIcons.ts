export function getRankIcon(tier: string, division?: number | string): string {
  const t = (tier || 'bronze').toLowerCase();
  if (['champion', 'master', 'grandmaster'].includes(t)) {
    return `/ranks/${t}.webp`;
  }
  const divMap: Record<string, string> = { 'IV': '4', 'III': '3', 'II': '2', 'I': '1' };
  const rawDiv = String(division || '1').toUpperCase();
  const div = divMap[rawDiv] || rawDiv || '1';
  return `/ranks/${t}-${div}.webp`;
}
