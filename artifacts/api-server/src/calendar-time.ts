/** A database booking day is always YYYY-MM-DD at UTC midnight, not server-local midnight. */
export function torontoSlot(instant: string) {
  const value = new Date(instant);
  if (!Number.isFinite(value.getTime())) throw new Error("Invalid Calendar timestamp.");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(value);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const day = `${part("year")}-${part("month")}-${part("day")}`;
  return { day, date: new Date(`${day}T00:00:00.000Z`), time: `${part("hour")}:${part("minute")}` };
}

/** Compare a local Toronto booking date/time with the current instant. */
export function isPastTorontoSlot(day: string, time: string, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  const currentLocal = `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
  return `${day}T${time}:00` <= currentLocal;
}
