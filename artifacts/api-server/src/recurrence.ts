export function seasonEnd(start: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start)) ||
      new Date(start).toISOString().slice(0, 10) !== start) throw new Error("Date de début invalide.");
  const year = Number(start.slice(0, 4));
  return `${start.slice(5) <= "04-30" ? year : year + 1}-04-30`;
}

export function recurrenceDates(start: string, end: string, days: number[], interval = 1): string[] {
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
  if (!valid(start) || !valid(end) || end < start || ![1,2,3,4].includes(interval) ||
    !days.length || days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error("Période ou répétition invalide.");
  const first = new Date(start), last = new Date(end);
  if (+last - +first > 366 * 86400000) throw new Error("La période maximale est d’un an.");
  const monday = +first - ((first.getUTCDay()+6)%7)*86400000;
  const dates: string[] = [];
  for (let t=+first; t<=+last; t+=86400000) {
    const d=new Date(t);
    if (days.includes(d.getUTCDay()) && Math.floor((t-monday)/604800000)%interval===0) dates.push(d.toISOString().slice(0,10));
  }
  if (!dates.length || dates.length>104) throw new Error("Choisissez une période contenant entre 1 et 104 séances.");
  return dates;
}
