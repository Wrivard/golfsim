export function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/^(?:(\d+(?:\.\d+)?)h|(\d+)h(\d{2}))$/);
  if (!match) return 60;

  if (match[1] !== undefined) {
    return Math.round(Number(match[1]) * 60);
  }

  return Number(match[2]) * 60 + Number(match[3]);
}