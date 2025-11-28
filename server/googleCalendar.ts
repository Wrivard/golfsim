import { google } from 'googleapis';
import { storage } from './storage';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri
  );
}

function getRedirectUri(req: { protocol: string; get: (name: string) => string | undefined }) {
  const host = req.get('host') || 'localhost:5000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/oauth/google/callback`;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const oauth2Client = getOAuth2Client(redirectUri);
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);
  
  oauth2Client.setCredentials(tokens);
  
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();
  
  const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
  
  await storage.saveOAuthToken({
    provider: 'google',
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token || null,
    expiresAt: expiresAt,
    scope: tokens.scope || SCOPES.join(' '),
    tokenType: tokens.token_type || 'Bearer',
    email: userInfo.data.email || null,
  });
  
  return {
    email: userInfo.data.email,
    expiresAt: expiresAt,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const tokenData = await storage.getOAuthToken('google');
  
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
    
    await storage.updateOAuthToken('google', {
      accessToken: credentials.access_token!,
      expiresAt: expiresAt,
    });
    
    return credentials.access_token!;
  } catch (error) {
    console.error('Failed to refresh access token:', error);
    return null;
  }
}

async function getValidAccessToken(): Promise<string> {
  const tokenData = await storage.getOAuthToken('google');
  
  if (!tokenData) {
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
}> {
  const configured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);
  
  if (!configured) {
    return { connected: false, configured: false };
  }
  
  try {
    const tokenData = await storage.getOAuthToken('google');
    
    if (!tokenData) {
      return { connected: false, configured: true };
    }
    
    return {
      connected: true,
      email: tokenData.email || undefined,
      expiresAt: tokenData.expiresAt || undefined,
      configured: true,
    };
  } catch (error) {
    console.error('Failed to get calendar connection status:', error);
    return { connected: false, configured: true };
  }
}

export async function revokeGoogleAccess(): Promise<void> {
  const tokenData = await storage.getOAuthToken('google');
  
  if (tokenData?.accessToken) {
    try {
      const oauth2Client = getOAuth2Client();
      await oauth2Client.revokeToken(tokenData.accessToken);
    } catch (error) {
      console.error('Failed to revoke token with Google:', error);
    }
  }
  
  await storage.deleteOAuthToken('google');
}

async function getConfiguredCalendarId(): Promise<string> {
  try {
    const settings = await storage.getCalendarSettings();
    return settings?.calendarId || 'primary';
  } catch (error) {
    console.error('Failed to get calendar settings, using primary:', error);
    return 'primary';
  }
}

export async function createCalendarEvent(booking: {
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
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  
  const [hours, minutes] = booking.time.split(':').map(Number);
  const startDateTime = new Date(booking.date);
  startDateTime.setHours(hours, minutes, 0, 0);
  
  const durationHours = parseInt(booking.duration.replace('h', ''), 10);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + durationHours);

  const bayLabel = booking.bayType === 'premium' ? 'Premium' : 'Standard';
  
  const event = {
    summary: `Golf SIM - ${booking.name} - Bay ${bayLabel}`,
    description: `
Réservation Golf SIM Sorel-Tracy

Nom: ${booking.name}
Courriel: ${booking.email}
Téléphone: ${booking.phone || 'Non fourni'}
Joueurs: ${booking.players}
Bay: ${bayLabel}
Durée: ${booking.duration}
${booking.notes ? `Remarques: ${booking.notes}` : ''}
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/Toronto',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/Toronto',
    },
  };

  const response = await calendar.events.insert({
    calendarId: calendarId,
    requestBody: event,
  });

  return response.data.id || null;
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getGoogleCalendarClient();
  const calendarId = await getConfiguredCalendarId();
  
  await calendar.events.delete({
    calendarId: calendarId,
    eventId: eventId,
  });
}

export { getRedirectUri };
