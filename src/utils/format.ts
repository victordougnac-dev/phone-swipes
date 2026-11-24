export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n < 0) return '-' + formatNumber(-n);
  if (n < 1000) {
    return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  }
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];
  const tier = Math.min(suffixes.length - 1, Math.floor(Math.log10(n) / 3));
  const scaled = n / Math.pow(1000, tier);
  const decimals = scaled >= 100 ? 1 : 2;
  return `${scaled.toFixed(decimals)}${suffixes[tier]}`;
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rem = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${rem.toString().padStart(2, '0')}s`;
  return `${rem}s`;
}
