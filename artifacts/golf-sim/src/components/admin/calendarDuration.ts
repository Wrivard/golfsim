export function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/^(?:(\d+(?:\.\d+)?)h|(\d+)h(\d{2}))$/);
  if (!match) return 60;

  if (match[1] !== undefined) {
    return Math.round(Number(match[1]) * 60);
  }

  return Number(match[2]) * 60 + Number(match[3]);
}

/** Positions use the same hour scale as grid lines, with no added row/padding. */
export function bookingGeometry(time: string, duration: string, startHour = 8, hourHeight = 64) {
  const [hour, minute] = time.split(":").map(Number);
  const start = hour * 60 + minute;
  const minutes = parseDurationToMinutes(duration);
  const end = start + minutes;
  return {
    top: (start - startHour * 60) * hourHeight / 60,
    height: minutes * hourHeight / 60,
    endTime: `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
  };
}