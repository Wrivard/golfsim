import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
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
    calendarId: 'primary',
    requestBody: event,
  });

  return response.data.id;
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getGoogleCalendarClient();
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}
