import type { calendar_v3 } from "googleapis";

/** Collect every page before mutating bookings; a failed page is not an empty calendar. */
export async function listCalendarWindow(calendar: calendar_v3.Calendar, calendarId: string, timeMin: string, timeMax: string) {
  const events: calendar_v3.Schema$Event[] = [];
  const seen = new Set<string>();
  let pageToken: string | undefined;
  do {
    const response = await calendar.events.list({
      calendarId, timeMin, timeMax, singleEvents: true, orderBy: "startTime",
      maxResults: 500, showDeleted: true, pageToken,
    });
    events.push(...(response.data.items || []));
    pageToken = response.data.nextPageToken || undefined;
    if (pageToken) {
      if (seen.has(pageToken)) throw new Error("Calendar pagination repeated a token.");
      seen.add(pageToken);
    }
  } while (pageToken);
  return events;
}
