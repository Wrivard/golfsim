export const seriesPattern = /^\[Série ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}) \/ \d{4}-\d{2}-\d{2}\]$/im;
export function seriesId(notes?: string | null) {
  return notes?.match(seriesPattern)?.[1].toLowerCase();
}
export function preserveSeries(notes: string | null, original: string | null) {
  const marker = original?.match(seriesPattern)?.[0];
  const clean = (notes || "").replace(new RegExp(seriesPattern.source, "gim"), "").trim();
  return [clean, marker].filter(Boolean).join("\n") || null;
}
export async function deleteSeriesChunk(
  bookings: {id: string; calendarEventId: string | null}[],
  deleteEvent: (id: string) => Promise<void>,
  deleteLocal: (id: string) => Promise<void>,
) {
  const deletedIds: string[] = [];
  for (const booking of bookings) {
    try {
      if (booking.calendarEventId) {
        try { await deleteEvent(booking.calendarEventId); }
        catch (error) {
          if (![404,410].includes(Number((error as {code?: number}).code))) throw error;
        }
      }
      await deleteLocal(booking.id);
      deletedIds.push(booking.id);
    } catch {
      return { deletedIds, complete: false };
    }
  }
  return { deletedIds, complete: true };
}
