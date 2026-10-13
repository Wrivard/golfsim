import { google, type calendar_v3 } from 'googleapis';
import { storage } from './storage';
import { markSourcePending, markSourceReady, sourceReady, withCalendarSource } from "./calendar-source";
import crypto from 'crypto';
import { externalCalendarAllowed, previewRuntime, publicOrigin, durableRuntime } from "./runtime/config";
import { readState, writeState } from "./runtime/state";
import { torontoSlot } from "./calendar-time";
import { listCalendarWindow } from "./calendar-pages";

const GOOGLE_CLIENT_ID = previewRuntime() ? process.env.PREVIEW_GOOGLE_CLIENT_ID : process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = previewRuntime() ? process.env.PREVIEW_GOOGLE_CLIENT_SECRET : process.env.GOOGLE_CLIENT_SECRET;
const tokenProvider = previewRuntime() ? "google-preview" : "google";
google.options({ timeout: 15000 });
function providerFailure(error: unknown) {
  // Gaxios errors include OAuth request secrets; only a numeric status may escape.
  const source = error as { code?: unknown; response?: { status?: unknown } } | null;
  const status = source?.response?.status ?? source?.code;
  return Object.assign(new Error("Google Calendar request failed; verify connection and permissions."), {
    code: typeof status === "number" ? status : undefined,
  });
}
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2({
    clientId: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET, redirectUri,
    transporterOptions: { timeout: 15000 },
  });
}

function getRedirectUri(req: { protocol: string; get: (name: string) => string | undefined }) {
  if (previewRuntime()) {
    if (!process.env.PREVIEW_GOOGLE_REDIRECT_URI) throw new Error("Preview Google redirect URI is required.");
    return process.env.PREVIEW_GOOGLE_REDIRECT_URI;
  }
  if (publicOrigin()) return `${publicOrigin()}/oauth/google/callback`;
  const host = req.get('host') || 'localhost:5000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/oauth/google/callback`;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  if (!externalCalendarAllowed()) throw new Error("Calendar access is disabled for this deployment.");
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'select_account consent',
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  if (!externalCalendarAllowed()) throw new Error("Calendar access is disabled for this deployment.");
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code).catch(error => { throw providerFailure(error); });
  
  oauth2Client.setCredentials(tokens);
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get().catch(error => { throw providerFailure(error); });
  if (!tokens.access_token || !tokens.refresh_token || !userInfo.data.email) {
    throw new Error("Autorisation incomplète. Réessayez en acceptant les permissions Google Calendar.");
  }
  const granted = new Set((tokens.scope || "").split(" "));
  if (!granted.has("https://www.googleapis.com/auth/calendar")) {
    throw new Error("Veuillez autoriser l’accès à Google Calendar avant de connecter ce compte.");
  }
  
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  
  await storage.saveOAuthToken({
    provider: tokenProvider,
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || null,
    expiresAt: expiresAt,
    scope: tokens.scope || SCOPES.join(' '),
    tokenType: tokens.token_type || 'Bearer',
    email: userInfo.data.email || null,
  }).catch(() => { throw new Error("OAuth credentials could not be saved."); });
  await markSourcePending();
  
  return {
    email: userInfo.data.email,
    expiresAt: expiresAt,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const tokenData = await storage.getOAuthToken(tokenProvider);
  
  if (!tokenData?.refreshToken) {
    return null;
  }
  
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: tokenData.refreshToken,
  });
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    const expiresAt = credentials.expiry_date ? new Date(credentials.expiry_date) : null;
    
    await storage.updateOAuthToken(tokenProvider, {
      accessToken: credentials.access_token!,
      expiresAt: expiresAt,
    });
    
    return credentials.access_token!;
  } catch (error) {
    console.error('Failed to refresh access token.');
    return null;
  }
}

async function getValidAccessToken(): Promise<string> {
  const tokenData = await storage.getOAuthToken(tokenProvider);
  
  if (!tokenData?.accessToken) {
    throw new Error('Google Calendar not connected');
  }
  
  const now = new Date();
  const bufferTime = 5 * 60 * 1000;
  
  if (tokenData.expiresAt && tokenData.expiresAt.getTime() - bufferTime < now.getTime()) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error('Failed to refresh Google access token');
    }
    return newToken;
  }
  
  return tokenData.accessToken;
}

export async function getGoogleCalendarClient() {
  if (!externalCalendarAllowed()) throw new Error("Calendar access is disabled for this deployment.");
  const accessToken = await getValidAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getCalendarConnectionStatus(): Promise<{
  connected: boolean;
  email?: string;
  expiresAt?: Date;
  configured: boolean;
  syncReady?: boolean;
}> {
  const configured = externalCalendarAllowed() && !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  
  if (!configured) {
    return { connected: false, configured: false };
  }
  
  try {
    const tokenData = await storage.getOAuthToken(tokenProvider);
    
    if (!tokenData?.accessToken) {
      return { connected: false, configured: true };
    }
    
    return {
      connected: true,
      syncReady: await sourceReady(),
      email: tokenData.email || undefined,
      expiresAt: tokenData.expiresAt || undefined,
      configured: true,
    };
  } catch (error) {
    console.error('Failed to get calendar connection status.');
    return { connected: false, configured: true };
  }
}

export async function listCalendars(): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  try {
    const calendar = await getGoogleCalendarClient();
    const items: calendar_v3.Schema$CalendarListEntry[] = [];
    let pageToken: string | undefined;
    do {
      const response = await calendar.calendarList.list({ pageToken, maxResults: 250 });
      items.push(...(response.data.items || []));
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);
    return items.filter(cal => cal.accessRole === "owner" || cal.accessRole === "writer").map(cal => ({
      id: cal.id || '',
      summary: cal.summary || cal.id || 'Sans nom',
      primary: cal.primary || false,
    }));
  } catch (error) {
    console.error('Failed to list calendars.');
    throw providerFailure(error);
  }
}

export async function revokeGoogleAccess(): Promise<void> {
  if (!externalCalendarAllowed()) throw new Error("Calendar access is disabled for this deployment.");
  const tokenData = await storage.getOAuthToken(tokenProvider);
  try { await stopCalendarWatch(); } catch { console.warn("Previous Calendar watch could not be stopped; it will expire."); }
  await writeState("calendar-watch", null);
  
  if (tokenData?.accessToken) {
    try {
      const oauth2Client = getOAuth2Client();
      await oauth2Client.revokeToken(tokenData.accessToken);
    } catch (error) {
      console.error('Failed to revoke token with Google.');
    }
  }
  
  // Keep only the account identity to recognize a same-account reconnect.
  // No usable credentials remain; existing bookings/events are untouched.
  await storage.updateOAuthToken(tokenProvider, { accessToken: "", refreshToken: null, expiresAt: null });
}

async function getConfiguredCalendarId(): Promise<string> {
  const settings = await storage.getCalendarSettings();
  if (previewRuntime()) {
    const id = process.env.PREVIEW_CALENDAR_ID;
    if (!id || id === "primary" || id === settings?.calendarId) {
      throw new Error("An explicitly isolated preview calendar is required.");
    }
    return id;
  }
  return settings?.calendarId || 'primary';
}

function calendarEventForBooking(booking: {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  date: Date;
  time: string;
  duration: string;
  bayType: string;
  players: number;
  notes?: string | null;
}) {
  const dateStr = booking.date instanceof Date 
    ? booking.date.toISOString().split('T')[0]
    : new Date(booking.date).toISOString().split('T')[0];
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = booking.time.split(':').map(Number);
  
  const durationHours = parseFloat(booking.duration.replace('h', ''));
  const durationMinutes = Math.round(durationHours * 60);
  
  const startTotalMinutes = hours * 60 + minutes;
  const endTotalMinutes = startTotalMinutes + durationMinutes;
  
  let endDay = day;
  let endMonth = month;
  let endYear = year;
  let endHour = Math.floor(endTotalMinutes / 60);
  const endMinute = endTotalMinutes % 60;
  
  if (endHour >= 24) {
    endHour -= 24;
    endDay += 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    if (endDay > daysInMonth) {
      endDay = 1;
      endMonth += 1;
      if (endMonth > 12) {
        endMonth = 1;
        endYear += 1;
      }
    }
  }

  const startTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  const endTimeStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;

  const bayLabel = `Baie ${booking.bayType}`;

  const BAY_COLORS: Record<string, string> = {
    "1": "10",
    "2": "7",
    "3": "9",
    "4": "6",
  };
  
  const event = {
    summary: `Golf SIM - ${booking.name} - ${bayLabel}`,
    description: `
Réservation Golf SIM Sorel-Tracy

Nom: ${booking.name}
Courriel: ${booking.email}
Téléphone: ${booking.phone || 'Non fourni'}
Joueurs: ${booking.players}
${bayLabel}
Durée: ${booking.duration}
${booking.notes ? `Remarques: ${booking.notes}` : ''}
    `.trim(),
    colorId: BAY_COLORS[booking.bayType] || "10",
    ...(booking.id ? { extendedProperties: { private: { golfSimBookingId: booking.id } } } : {}),
    start: {
      dateTime: startTimeStr,
      timeZone: 'America/Toronto',
    },
    end: {
      dateTime: endTimeStr,
      timeZone: 'America/Toronto',
    },
  };

  return event;
}

export async function createCalendarEvent(booking: Parameters<typeof calendarEventForBooking>[0]) {
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: calendarEventForBooking(booking),
  }).catch(error => { throw providerFailure(error); });

  return response.data.id || null;
}

export async function updateCalendarEvent(eventId: string, booking: Parameters<typeof calendarEventForBooking>[0]) {
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  await calendar.events.patch({ calendarId, eventId, requestBody: calendarEventForBooking(booking) }).catch(error => { throw providerFailure(error); });
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  
  await calendar.events.delete({
    calendarId: calendarId,
    eventId: eventId,
  }).catch(error => { throw providerFailure(error); });
}

export interface CalendarSyncResult {
  imported: number;
  updated: number;
  deleted: number;
  skipped: number;
  errors: number;
}

export async function syncCalendarToDatabase(): Promise<CalendarSyncResult> {
  return withCalendarSource(syncActiveCalendar, true);
}

async function syncActiveCalendar(): Promise<CalendarSyncResult> {
  await markSourcePending();
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 1);
  
  const timeMax = new Date(now);
  timeMax.setMonth(timeMax.getMonth() + 3);
  const stored = await storage.getAllBookings();
  // Reconcile the entire cached future horizon when returning to an old source.
  for (const booking of stored) {
    const end = new Date(booking.date);
    end.setDate(end.getDate() + 1);
    if (end > timeMax) timeMax.setTime(end.getTime());
  }
  
  const result: CalendarSyncResult = { imported: 0, updated: 0, deleted: 0, skipped: 0, errors: 0 };
  
  try {
    const events = await listCalendarWindow(calendar, calendarId, timeMin.toISOString(), timeMax.toISOString());
    const existingBookings = await storage.getAllBookings();
    const calendarBookingsMap = new Map<string, typeof existingBookings[0]>();
    for (const b of existingBookings) {
      if (b.calendarEventId) {
        calendarBookingsMap.set(b.calendarEventId, b);
      }
    }

    const seenCalendarEventIds = new Set<string>();
    const returnedIds = new Set(events.map(e => e.id));
    for (const booking of existingBookings) {
      if (booking.calendarEventId && booking.date >= timeMin && booking.date < timeMax
        && !returnedIds.has(booking.calendarEventId)) {
        await storage.deleteBooking(booking.id);
        result.deleted++;
      }
    }
    
    for (const event of events) {
      if (!event.id) {
        result.skipped++;
        continue;
      }

      if (seenCalendarEventIds.has(event.id)) { result.skipped++; continue; }
      seenCalendarEventIds.add(event.id);

      const isCancelled = event.status === 'cancelled';
      const linkedId = event.extendedProperties?.private?.golfSimBookingId;
      const linkedBooking = linkedId ? existingBookings.find(b => b.id === linkedId) : undefined;
      // A deleted/compensated app booking must not be recreated from an orphan event.
      if (linkedId && !linkedBooking && !calendarBookingsMap.has(event.id)
        && !await storage.hasHistoricalBooking(linkedId)) { result.skipped++; continue; }
      if (linkedBooking?.calendarEventId && linkedBooking.calendarEventId !== event.id) { result.skipped++; continue; }
      const existingBooking = calendarBookingsMap.get(event.id) || linkedBooking;
      if (linkedBooking && !linkedBooking.calendarEventId) {
        await storage.updateBookingCalendarEventId(linkedBooking.id, event.id);
      }

      if (isCancelled) {
        if (existingBooking) {
          try {
            await storage.deleteBooking(existingBooking.id);
            result.deleted++;
            console.log(`[Calendar Sync] Deleted booking for cancelled event: ${event.id}`);
          } catch (err) {
            console.error('Error deleting cancelled calendar event booking:', event.id, err);
            result.errors++;
          }
        }
        continue;
      }

      if (!event.start?.dateTime || !event.end?.dateTime) {
        result.skipped++;
        continue;
      }
      
      const summary = event.summary || '';
      if (!summary.toLowerCase().includes('golf sim')) {
        result.skipped++;
        continue;
      }
      
      try {
        const parsed = parseCalendarEvent(event);
        if (!parsed) {
          if (existingBooking) {
            try {
              const localStart = new Date(event.start!.dateTime!);
              const localEnd = new Date(event.end!.dateTime!);
              const diffMs = localEnd.getTime() - localStart.getTime();
              const durationMin = Math.round(diffMs / 60000);
              const hours = Math.floor(durationMin / 60);
              const mins = durationMin % 60;
              const slot = torontoSlot(event.start!.dateTime!);
              const timeStr = slot.time;
              const durationStr = mins > 0 ? `${hours}h${String(mins).padStart(2, '0')}` : `${hours}h00`;
              const dateOnly = slot.date;
              
              const dateChanged = new Date(existingBooking.date).toISOString().slice(0, 10) !== slot.day;
              const timeChanged = existingBooking.time !== timeStr;
              const durationChanged = existingBooking.duration !== durationStr;

              if (dateChanged || timeChanged || durationChanged) {
                await storage.updateBookingByCalendarEventId(event.id, {
                  date: dateOnly,
                  time: timeStr,
                  duration: durationStr,
                });
                result.updated++;
                console.log(`[Calendar Sync] Updated booking time/date for event (fallback): ${event.id}`);
              } else {
                result.skipped++;
              }
            } catch (fallbackErr) {
              console.error('Error in fallback update:', event.id, fallbackErr);
              result.errors++;
            }
          } else {
            result.skipped++;
          }
          continue;
        }

        if (existingBooking) {
          const dateChanged = new Date(existingBooking.date).toISOString().slice(0, 10) !== new Date(parsed.date).toISOString().slice(0, 10);
          const timeChanged = existingBooking.time !== parsed.time;
          const durationChanged = existingBooking.duration !== parsed.duration;
          const bayChanged = existingBooking.bayType !== parsed.bayType;
          const nameChanged = existingBooking.name !== parsed.name;
          const emailChanged = existingBooking.email !== parsed.email;
          const phoneChanged = (existingBooking.phone || null) !== (parsed.phone || null);
          const playersChanged = existingBooking.players !== parsed.players;

          if (dateChanged || timeChanged || durationChanged || bayChanged || nameChanged || emailChanged || phoneChanged || playersChanged) {
            await storage.updateBookingByCalendarEventId(event.id, {
              date: parsed.date,
              time: parsed.time,
              duration: parsed.duration,
              bayType: parsed.bayType,
              name: parsed.name,
              email: parsed.email,
              phone: parsed.phone,
              players: parsed.players,
            });
            result.updated++;
            console.log(`[Calendar Sync] Updated booking for event: ${event.id} (${[
              dateChanged && 'date',
              timeChanged && 'time', 
              durationChanged && 'duration',
              bayChanged && 'bay',
              nameChanged && 'name',
              emailChanged && 'email',
              phoneChanged && 'phone',
              playersChanged && 'players'
            ].filter(Boolean).join(', ')})`);
          } else {
            result.skipped++;
          }
          continue;
        }
        
        const { booking: created, conflict } = await storage.createBookingWithConflictCheck(
          { ...parsed, calendarEventId: event.id },
          (existingBookings) => {
            const startMinutes = parseTimeStr(parsed.time);
            const durationMinutes = parseDurationStr(parsed.duration);
            const endMinutes = startMinutes + durationMinutes;
            
            for (const existing of existingBookings) {
              if (existing.bayType !== parsed.bayType) continue;
              
              const existingStart = parseTimeStr(existing.time);
              const existingDuration = parseDurationStr(existing.duration);
              const existingEnd = existingStart + existingDuration;
              
              if (startMinutes < existingEnd && endMinutes > existingStart) {
                return true;
              }
            }
            return false;
          }
        );
        
        if (conflict || !created) {
          result.errors++;
          continue;
        }
        
        await storage.updateBookingCalendarEventId(created.id, event.id);
        result.imported++;
      } catch (err) {
        console.error('Error importing calendar event:', event.id, err);
        result.errors++;
      }
    }
  } catch (error) {
    console.error('Error fetching calendar events for sync.');
    throw error;
  }
  
  if (result.errors === 0) await markSourceReady();
  return result;
}

function parseTimeStr(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function parseDurationStr(duration: string): number {
  const hours = parseFloat(duration.replace('h', ''));
  return Math.round(hours * 60);
}

function parseCalendarEvent(event: any): {
  name: string;
  email: string;
  phone: string | null;
  date: Date;
  time: string;
  duration: string;
  bayType: string;
  players: number;
  notes: string | null;
} | null {
  try {
    const startDateTime = new Date(event.start.dateTime);
    const endDateTime = new Date(event.end.dateTime);
    
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (durationHours <= 0 || durationHours > 14) return null;
    
    const durationStr = durationHours % 1 === 0 
      ? `${durationHours}h` 
      : `${durationHours}h`;
    
    const slot = torontoSlot(event.start.dateTime);
    const timeStr = slot.time;
    const dateOnly = slot.date;
    
    let bayType = '1';
    const summary = event.summary || '';
    const rawDescription = event.description || '';
    const description = rawDescription
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(pre|p|div|span|b|i|strong|em|ul|li|ol|a|h[1-6])[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    const bayMatch = summary.match(/Baie\s*(\d)/i) || description.match(/Baie\s*(\d)/i);
    if (bayMatch && ['1', '2', '3', '4'].includes(bayMatch[1])) {
      bayType = bayMatch[1];
    }
    
    let name = 'Réservation Calendrier';
    const nameMatchSummary = summary.match(/Golf SIM\s*[-–]\s*(.+?)\s*[-–]/i);
    if (nameMatchSummary) {
      name = nameMatchSummary[1].trim();
    }
    
    let email = 'calendrier@golfsim.ca';
    const emailMatch = description.match(/Courriel:\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      email = emailMatch[1].trim();
    }
    
    let phone: string | null = null;
    const phoneMatch = description.match(/T[ée]l[ée]phone:\s*([\d().\-+\s]{7,20})/i);
    if (phoneMatch && phoneMatch[1].trim() !== 'Non fourni') {
      phone = phoneMatch[1].trim();
    }
    
    let players = 1;
    const playersMatch = description.match(/Joueurs:\s*(\d+)/i);
    if (playersMatch) {
      players = parseInt(playersMatch[1], 10);
    }
    
    return {
      name,
      email,
      phone,
      date: dateOnly,
      time: timeStr,
      duration: durationStr,
      bayType,
      players: Math.min(Math.max(players, 1), 4),
      notes: `Importé depuis Google Calendar (${event.id})`,
    };
  } catch (error) {
    console.error('Error parsing calendar event:', error);
    return null;
  }
}

export interface CalendarWatch {
  id: string; resourceId: string; expires: number; url: string; tokenDigest: string;
  calendarId?: string; account?: string;
}
const localWatchSecret = crypto.randomBytes(32).toString("hex");
export async function getCalendarWatch() {
  return readState<CalendarWatch>("calendar-watch");
}
export function getWatchToken(): string {
  const secret = process.env.CALENDAR_WEBHOOK_SECRET || (durableRuntime() ? undefined : localWatchSecret);
  if (!secret) throw new Error("CALENDAR_WEBHOOK_SECRET is required for durable watches.");
  return crypto.createHmac("sha256", secret).update("gsim-calendar-v1").digest("hex");
}

export async function setupCalendarWatch(webhookUrl: string): Promise<boolean> {
  try {
    const calendar = await getGoogleCalendarClient();
    const calendarId = await getConfiguredCalendarId();
    const old = await getCalendarWatch();
    const account = (await storage.getOAuthToken(tokenProvider))?.email || "";
    const token = getWatchToken();
    const tokenDigest = crypto.createHash("sha256").update(token).digest("hex");
    if (old && old.account === account && old.calendarId === calendarId && old.url === webhookUrl && old.tokenDigest === tokenDigest && old.expires > Date.now() + 3600000) return true;

    const channelId = crypto.randomUUID();
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const response = await calendar.events.watch({
      calendarId: calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        token,
        expiration: expiration.toString(),
      },
    });

    if (!response.data.resourceId) throw new Error("Watch response missing resource ID.");
    try {
      await writeState("calendar-watch", {
        id: channelId, resourceId: response.data.resourceId,
        expires: Number(response.data.expiration || expiration), url: webhookUrl, tokenDigest,
        calendarId, account,
      });
    } catch (error) {
      try { await calendar.channels.stop({ requestBody: { id: channelId, resourceId: response.data.resourceId } }); } catch {}
      throw error;
    }
    if (old) {
      try { await calendar.channels.stop({ requestBody: { id: old.id, resourceId: old.resourceId } }); } catch {}
    }
    console.info("[Calendar Watch] Watch registered/renewed.");
    return true;
  } catch (error: any) {
    console.error('[Calendar Watch] Failed to register watch.');
    return false;
  }
}

export async function stopCalendarWatch(): Promise<void> {
  const watch = await getCalendarWatch();
  if (!watch) return;
  const calendar = await getGoogleCalendarClient();
  await calendar.channels.stop({ requestBody: { id: watch.id, resourceId: watch.resourceId } }).catch(error => { throw providerFailure(error); });
  await writeState("calendar-watch", null);
}

export { getRedirectUri };
