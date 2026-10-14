/** New recurring series finish on the next April 30 on or after their start. */
export function seasonEnd(start: string): string {
  const year = Number(start.slice(0, 4));
  return `${start.slice(5) <= "04-30" ? year : year + 1}-04-30`;
}
