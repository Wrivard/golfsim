import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type Booking, type InsertBooking } from "@shared/schema";
import { 
  createCalendarEvent, 
  deleteCalendarEvent, 
  getCalendarConnectionStatus,
  getGoogleAuthUrl,
  generateOAuthState,
  exchangeCodeForTokens,
  revokeGoogleAccess,
  getRedirectUri,
  listCalendars,
  syncCalendarToDatabase,
  setupCalendarWatch,
  getActiveWatchChannelId,
  getWatchToken
} from "./googleCalendar";
import { 
  getOptimizedStartTimes, 
  type BookingRecord 
} from "./booking-logic";
import { getConfirmationBay } from "./confirmation-bay";
import { isStaffSlotAvailable, isWithinPublicBookingHours } from "./staff-booking";
import { z } from "zod";
import bcrypt from "bcrypt";
import { rateLimit, sanitizeBookingInput, sanitizeString, sanitizeEmail, sanitizePhone } from "./middleware/security";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    oauthState?: string;
  }
}

const bookingRequestSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  time: z.string(),
  duration: z.string(),
  bayType: z.enum(["1", "2", "3", "4"]),
  players: z.number().min(1).max(4),
  notes: z.string().optional(),
});

const staffBookingSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.union([z.literal(""), z.string().email()]).default(""),
  phone: z.string().max(100).default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value =>
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  duration: z.enum(["1h", "2h", "3h", "4h"]),
  bayType: z.enum(["1", "2", "3", "4"]),
  players: z.number().int().min(1).max(4),
  notes: z.string().max(2000).default(""),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const calendarSettingsSchema = z.object({
  syncEmail: z.string().email().optional().nullable(),
  calendarId: z.string().optional(),
});

function checkTimeOverlap(
  existingTime: string,
  existingDuration: string,
  newTime: string,
  newDuration: string
): boolean {
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const getDurationMinutes = (duration: string) => {
    return parseInt(duration.replace('h', ''), 10) * 60;
  };

  const existingStart = parseTime(existingTime);
  const existingEnd = existingStart + getDurationMinutes(existingDuration);
  const newStart = parseTime(newTime);
  const newEnd = newStart + getDurationMinutes(newDuration);

  return newStart < existingEnd && newEnd > existingStart;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ ok: false, message: "Non autorisé" });
  }
  next();
}

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
});

const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: 'Trop de réservations. Veuillez réessayer dans une minute.',
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  try {
    await storage.initializeDefaultSchedule();
    console.log("[schedule] Default operating schedule initialized");
  } catch (error) {
    console.error("[schedule] Failed to initialize default schedule:", error);
  }

  app.get("/api/schedule", async (_req: Request, res: Response) => {
    try {
      const schedule = await storage.getSchedule();
      return res.json({ ok: true, schedule });
    } catch (error) {
      console.error("Error fetching schedule:", error);
      return res.status(500).json({ ok: false, message: "Erreur" });
    }
  });

  app.get("/api/schedule/:date", async (req: Request, res: Response) => {
    try {
      const dateStr = req.params.date;
      const date = new Date(dateStr);
      const dayOfWeek = date.getUTCDay();
      const schedule = await storage.getScheduleForDay(dayOfWeek);
      if (!schedule) {
        return res.json({ ok: true, schedule: { openHour: 8, openMinute: 0, lastBookingHour: 22, lastBookingMinute: 0, closeHour: 23, closeMinute: 0 } });
      }
      return res.json({ ok: true, schedule });
    } catch (error) {
      console.error("Error fetching schedule for date:", error);
      return res.status(500).json({ ok: false, message: "Erreur" });
    }
  });

  app.put("/api/admin/schedule/:dayOfWeek", requireAdmin, async (req: Request, res: Response) => {
    try {
      const dayOfWeek = parseInt(req.params.dayOfWeek, 10);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({ ok: false, message: "Jour invalide" });
      }
      const { openHour, openMinute, lastBookingHour, lastBookingMinute, closeHour, closeMinute } = req.body;
      
      const openTotal = openHour * 60 + (openMinute || 0);
      const lastBookingTotal = lastBookingHour * 60 + (lastBookingMinute || 0);
      const closeTotal = closeHour * 60 + (closeMinute || 0);
      
      if (openTotal >= lastBookingTotal) {
        return res.status(400).json({ ok: false, message: "L'heure d'ouverture doit être avant la dernière réservation" });
      }
      if (lastBookingTotal >= closeTotal) {
        return res.status(400).json({ ok: false, message: "La dernière réservation doit être avant la fermeture" });
      }

      const schedule = await storage.updateScheduleForDay(dayOfWeek, {
        openHour, openMinute, lastBookingHour, lastBookingMinute, closeHour, closeMinute
      });
      return res.json({ ok: true, schedule });
    } catch (error) {
      console.error("Error updating schedule:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la mise à jour" });
    }
  });

  app.post("/api/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        return res.status(401).json({ ok: false, message: "Identifiants invalides" });
      }

      const validPassword = await bcrypt.compare(password, admin.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ ok: false, message: "Identifiants invalides" });
      }

      req.session.adminId = admin.id;
      
      return res.json({ 
        ok: true, 
        admin: { id: admin.id, username: admin.username, role: admin.role } 
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ ok: false, message: "Erreur de connexion" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ ok: false, message: "Erreur de déconnexion" });
      }
      res.clearCookie("gsim.sid");
      return res.json({ ok: true });
    });
  });

  app.get("/api/auth/session", async (req: Request, res: Response) => {
    if (!req.session?.adminId) {
      return res.json({ ok: true, authenticated: false });
    }

    const admin = await storage.getAdminById(req.session.adminId);
    if (!admin) {
      return res.json({ ok: true, authenticated: false });
    }

    return res.json({ 
      ok: true, 
      authenticated: true,
      admin: { id: admin.id, username: admin.username, role: admin.role }
    });
  });

  app.get("/api/settings/debug-mode", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getCalendarSettings();
      return res.json({ debugMode: settings?.debugMode ?? false });
    } catch {
      return res.json({ debugMode: false });
    }
  });

  app.put("/api/admin/debug-mode", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { debugMode } = req.body;
      await storage.updateCalendarSettings({ debugMode: !!debugMode });
      return res.json({ ok: true, debugMode: !!debugMode });
    } catch (error) {
      console.error("Error toggling debug mode:", error);
      return res.status(500).json({ ok: false, message: "Erreur" });
    }
  });

  app.get("/api/admin/calendar-settings", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getCalendarSettings();
      return res.json({ ok: true, settings: settings || { syncEmail: null, calendarId: "primary", debugMode: false } });
    } catch (error) {
      console.error("Error fetching calendar settings:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la récupération des paramètres" });
    }
  });

  app.put("/api/admin/calendar-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validated = calendarSettingsSchema.parse(req.body);
      const settings = await storage.updateCalendarSettings(validated);
      return res.json({ ok: true, settings });
    } catch (error) {
      console.error("Error updating calendar settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ ok: false, message: "Données invalides" });
      }
      return res.status(500).json({ ok: false, message: "Erreur lors de la mise à jour" });
    }
  });

  app.get("/api/admin/bookings", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const bookings = await storage.getAllBookings();
      return res.json({ ok: true, bookings });
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la récupération des réservations" });
    }
  });

  app.post("/api/admin/bookings", requireAdmin, async (req: Request, res: Response) => {
    const parsed = staffBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "Données de réservation invalides.", errors: parsed.error.errors });
    }
    const input = parsed.data;
    const date = new Date(`${input.date}T00:00:00.000Z`);
    const durationMinutes = parseDurationToMinutes(input.duration);
    if (!isWithinPublicBookingHours(input.time, durationMinutes)) {
      return res.status(400).json({ ok: false, message: "Les réservations doivent commencer à partir de 8h et se terminer au plus tard à 22h." });
    }
    try {
      const daySchedule = await storage.getScheduleForDay(date.getUTCDay());
      const schedule = daySchedule ? {
        openHour: daySchedule.openHour, openMinute: daySchedule.openMinute,
        lastBookingHour: daySchedule.lastBookingHour, lastBookingMinute: daySchedule.lastBookingMinute,
        closeHour: daySchedule.closeHour, closeMinute: daySchedule.closeMinute,
      } : undefined;
      const bookingData: InsertBooking = {
        name: sanitizeString(input.name),
        email: input.email ? sanitizeEmail(input.email) : "",
        phone: input.phone ? sanitizePhone(input.phone) : null,
        date,
        time: input.time,
        duration: input.duration,
        bayType: input.bayType,
        players: input.players,
        notes: input.notes ? sanitizeString(input.notes) : null,
      };
      const { booking, conflict } = await storage.createBookingWithConflictCheck(
        bookingData,
        existing => !isStaffSlotAvailable(
          date, input.time, durationMinutes, input.bayType,
          formatBookingsForLogic(existing, input.date), schedule,
        ),
      );
      if (conflict || !booking) {
        return res.status(409).json({ ok: false, message: "Ce créneau n'est pas disponible pour cette baie et cet horaire." });
      }
      try {
        const calendarEventId = await createCalendarEvent(bookingData);
        if (!calendarEventId) {
          console.error("Google Calendar returned no event ID for staff booking");
          await storage.deleteBooking(booking.id);
          return res.status(500).json({ ok: false, message: "L'événement calendrier n'a pas été confirmé. Réservation annulée." });
        }
        try {
          await storage.updateBookingCalendarEventId(booking.id, calendarEventId);
        } catch (error) {
          console.error("Failed to save staff booking calendar event ID:", error);
          try { await deleteCalendarEvent(calendarEventId); } catch (deleteError) {
            console.error("Failed to delete orphaned calendar event:", deleteError);
          }
          await storage.deleteBooking(booking.id);
          return res.status(500).json({ ok: false, message: "Erreur lors de la sauvegarde. Veuillez réessayer." });
        }
        return res.status(201).json({ ok: true, booking: { ...booking, calendarEventId } });
      } catch (error) {
        console.error("Failed to create staff booking calendar event:", error);
        await storage.deleteBooking(booking.id);
        return res.status(500).json({ ok: false, message: "Erreur lors de la création de l'événement calendrier. Veuillez réessayer." });
      }
    } catch (error) {
      console.error("Staff booking error:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la réservation." });
    }
  });

  app.put("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = await storage.getBooking(id);
      if (!existing) {
        return res.status(404).json({ ok: false, message: "Réservation non trouvée" });
      }

      const { name, email, phone, time, duration, bayType, players, notes } = req.body;
      const updates: Record<string, any> = {};

      if (name !== undefined) {
        const sanitized = sanitizeString(name);
        if (!sanitized) return res.status(400).json({ ok: false, message: "Nom requis" });
        updates.name = sanitized;
      }
      if (email !== undefined) {
        updates.email = email ? sanitizeEmail(email) : "";
      }
      if (phone !== undefined) {
        updates.phone = phone ? sanitizePhone(phone) : null;
      }
      if (time !== undefined) {
        const t = String(time).slice(0, 5);
        if (!/^\d{2}:\d{2}$/.test(t)) return res.status(400).json({ ok: false, message: "Format d'heure invalide" });
        updates.time = t;
      }
      if (duration !== undefined) {
        if (!["1h", "2h", "3h", "4h"].includes(duration)) return res.status(400).json({ ok: false, message: "Durée invalide" });
        updates.duration = duration;
      }
      if (bayType !== undefined) {
        if (!["1", "2", "3", "4"].includes(String(bayType))) return res.status(400).json({ ok: false, message: "Baie invalide" });
        updates.bayType = String(bayType);
      }
      if (players !== undefined) {
        const p = Number(players);
        if (isNaN(p) || p < 1 || p > 4) return res.status(400).json({ ok: false, message: "Nombre de joueurs invalide" });
        updates.players = p;
      }
      if (notes !== undefined) {
        updates.notes = notes ? sanitizeString(notes) : null;
      }

      const updated = await storage.updateBooking(id, updates);
      return res.json({ ok: true, booking: updated });
    } catch (error: any) {
      console.error("Error updating booking:", error);
      return res.status(500).json({ ok: false, message: error.message || "Erreur lors de la modification" });
    }
  });

  app.delete("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const bookings = await storage.getAllBookings();
      const booking = bookings.find(b => b.id === id);
      
      if (!booking) {
        return res.status(404).json({ ok: false, message: "Réservation non trouvée" });
      }
      
      if (booking.calendarEventId) {
        try {
          await deleteCalendarEvent(booking.calendarEventId);
        } catch (calendarError) {
          console.error("Failed to delete calendar event:", calendarError);
        }
      }
      
      await storage.deleteBooking(id);
      
      return res.json({ ok: true, message: "Réservation supprimée" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la suppression" });
    }
  });

  app.get("/api/admin/calendar-connection", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const status = await getCalendarConnectionStatus();
      return res.json({ ok: true, ...status });
    } catch (error) {
      console.error("Error fetching calendar connection status:", error);
      return res.json({ ok: true, connected: false, configured: false });
    }
  });

  app.get("/api/admin/calendars", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const calendars = await listCalendars();
      return res.json({ ok: true, calendars });
    } catch (error: any) {
      console.error("Error listing calendars:", error);
      return res.status(500).json({ 
        ok: false, 
        message: error.message || "Erreur lors de la récupération des calendriers" 
      });
    }
  });

  app.get("/api/admin/oauth/google/url", requireAdmin, async (req: Request, res: Response) => {
    try {
      const redirectUri = getRedirectUri(req);
      const state = generateOAuthState();
      
      req.session.oauthState = state;
      
      const authUrl = getGoogleAuthUrl(redirectUri, state);
      return res.json({ ok: true, authUrl });
    } catch (error: any) {
      console.error("Error generating OAuth URL:", error);
      return res.status(500).json({ 
        ok: false, 
        message: error.message || "Erreur lors de la génération de l'URL d'autorisation" 
      });
    }
  });

  app.get("/oauth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: oauthError } = req.query;
      
      if (oauthError) {
        console.error("OAuth error:", oauthError);
        return res.redirect("/admin?oauth=error&message=" + encodeURIComponent(String(oauthError)));
      }
      
      if (!code || typeof code !== "string") {
        return res.redirect("/admin?oauth=error&message=missing_code");
      }
      
      if (!state || state !== req.session.oauthState) {
        return res.redirect("/admin?oauth=error&message=invalid_state");
      }
      
      delete req.session.oauthState;
      
      const redirectUri = getRedirectUri(req);
      const result = await exchangeCodeForTokens(code, redirectUri);
      
      return res.redirect("/admin?oauth=success&email=" + encodeURIComponent(result.email || ""));
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      return res.redirect("/admin?oauth=error&message=" + encodeURIComponent(error.message || "unknown_error"));
    }
  });

  app.post("/api/admin/oauth/google/revoke", requireAdmin, async (_req: Request, res: Response) => {
    try {
      await revokeGoogleAccess();
      return res.json({ ok: true });
    } catch (error: any) {
      console.error("Error revoking Google access:", error);
      return res.status(500).json({ 
        ok: false, 
        message: error.message || "Erreur lors de la révocation" 
      });
    }
  });

  app.post("/api/admin/calendar/sync", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await syncCalendarToDatabase();
      return res.json({ ok: true, ...result });
    } catch (error: any) {
      console.error("Error syncing calendar:", error);
      return res.status(500).json({ 
        ok: false, 
        message: error.message || "Erreur lors de la synchronisation du calendrier" 
      });
    }
  });

  const BAY_NUMBERS = ["1", "2", "3", "4"];
  const OPENING_HOUR = 8;
  const CLOSING_HOUR = 22;
  const MIN_DURATION_HOURS = 1;
  const PRICE_PER_HOUR = 25;
  
  function parseDurationToMinutes(duration: string): number {
    const hours = parseFloat(duration.replace('h', ''));
    return Math.round(hours * 60);
  }
  
  function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  function getBayOccupancy(bookings: Booking[], targetDate: Date): Map<string, Set<number>> {
    const bayOccupancy = new Map<string, Set<number>>();
    
    for (const bay of BAY_NUMBERS) {
      bayOccupancy.set(bay, new Set<number>());
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    for (const booking of bookings) {
      const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];
      if (bookingDateStr !== targetDateStr) continue;
      
      const bay = booking.bayType;
      if (!BAY_NUMBERS.includes(bay)) continue;
      
      const startMinutes = parseTimeToMinutes(booking.time);
      const durationMinutes = parseDurationToMinutes(booking.duration);
      const endMinutes = startMinutes + durationMinutes;
      
      const occupiedSlots = bayOccupancy.get(bay) || new Set<number>();
      for (let m = startMinutes; m < endMinutes && m < CLOSING_HOUR * 60; m += 30) {
        occupiedSlots.add(m);
      }
      bayOccupancy.set(bay, occupiedSlots);
    }
    
    return bayOccupancy;
  }

  function getAvailableSlots(bayOccupancy: Map<string, Set<number>>, durationHours: number): Array<{ time: string; availableBays: string[] }> {
    const slots: Array<{ time: string; availableBays: string[] }> = [];
    
    const durationMinutes = Math.round(durationHours * 60);
    const lastValidStartMinutes = CLOSING_HOUR * 60 - durationMinutes;
    
    for (let minutes = OPENING_HOUR * 60; minutes <= lastValidStartMinutes; minutes += 30) {
      const availableBays: string[] = [];
      
      for (const bay of BAY_NUMBERS) {
        const occupiedSlots = bayOccupancy.get(bay) || new Set<number>();
        let bayAvailable = true;
        
        for (let m = minutes; m < minutes + durationMinutes; m += 30) {
          if (occupiedSlots.has(m)) {
            bayAvailable = false;
            break;
          }
        }
        
        if (bayAvailable) {
          availableBays.push(bay);
        }
      }
      
      if (availableBays.length > 0) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeStr = hours.toString().padStart(2, '0') + ':' + mins.toString().padStart(2, '0');
        slots.push({ time: timeStr, availableBays });
      }
    }
    
    return slots;
  }

  app.get("/api/availability/bookings", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ ok: false, message: "Le paramètre date est requis" });
      }
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const dayBookings = await storage.getBookingsByDateRange(targetDate, endDate);
      
      const requestedDate = date as string;
      
      const formattedBookings = dayBookings.map(booking => {
        const [hours, minutes] = booking.time.split(':').map(Number);
        const durationMinutes = parseDurationToMinutes(booking.duration);
        
        const startHour = String(hours).padStart(2, '0');
        const startMin = String(minutes || 0).padStart(2, '0');
        const endTotalMinutes = hours * 60 + (minutes || 0) + durationMinutes;
        const endHour = String(Math.floor(endTotalMinutes / 60)).padStart(2, '0');
        const endMin = String(endTotalMinutes % 60).padStart(2, '0');
        
        return {
          id: booking.id,
          simulatorId: booking.bayType,
          startTime: `${requestedDate}T${startHour}:${startMin}:00`,
          endTime: `${requestedDate}T${endHour}:${endMin}:00`,
          customerName: booking.name,
        };
      });
      
      return res.json({ ok: true, bookings: formattedBookings });
    } catch (error) {
      console.error("Error fetching day bookings:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la récupération des réservations" });
    }
  });

  function formatBookingsForLogic(dayBookings: Booking[], dateStr: string): BookingRecord[] {
    return dayBookings.map(booking => {
      const [hours, minutes] = booking.time.split(':').map(Number);
      const durationMinutes = parseDurationToMinutes(booking.duration);

      const startHour = String(hours).padStart(2, '0');
      const startMin = String(minutes || 0).padStart(2, '0');
      const endTotalMinutes = hours * 60 + (minutes || 0) + durationMinutes;
      const endHour = String(Math.floor(endTotalMinutes / 60)).padStart(2, '0');
      const endMin = String(endTotalMinutes % 60).padStart(2, '0');

      return {
        id: booking.id,
        simulatorId: booking.bayType,
        startTime: `${dateStr}T${startHour}:${startMin}:00`,
        endTime: `${dateStr}T${endHour}:${endMin}:00`,
        customerName: booking.name,
      };
    });
  }

  app.get("/api/availability/optimized", async (req: Request, res: Response) => {
    try {
      const { date, duration } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ ok: false, message: "Le paramètre date est requis" });
      }

      if (!duration || typeof duration !== 'string') {
        return res.status(400).json({ ok: false, message: "Le paramètre duration est requis (en minutes)" });
      }

      const durationMinutes = parseInt(duration, 10);
      if (isNaN(durationMinutes) || durationMinutes < 60) {
        return res.status(400).json({ ok: false, message: "Durée invalide (minimum 60 minutes)" });
      }

      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const dayBookings = await storage.getBookingsByDateRange(targetDate, endDate);
      const formattedBookings = formatBookingsForLogic(dayBookings, date);

      const dayOfWeek = new Date(date).getUTCDay();
      const daySchedule = await storage.getScheduleForDay(dayOfWeek);
      const schedule = daySchedule ? {
        openHour: daySchedule.openHour,
        openMinute: daySchedule.openMinute,
        lastBookingHour: daySchedule.lastBookingHour,
        lastBookingMinute: daySchedule.lastBookingMinute,
        closeHour: daySchedule.closeHour,
        closeMinute: daySchedule.closeMinute,
      } : undefined;

      const slots = getOptimizedStartTimes(targetDate, durationMinutes, formattedBookings, undefined, schedule);

      return res.json({
        ok: true,
        slots,
        bookings: formattedBookings,
        schedule,
        meta: {
          date,
          durationMinutes,
          totalSlots: slots.length,
          bestScore: slots.length > 0 ? slots[0].score : 0,
        }
      });
    } catch (error) {
      console.error("Error fetching optimized availability:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors du calcul des disponibilités" });
    }
  });

  app.get("/api/availability", async (req: Request, res: Response) => {
    try {
      const { start, end, duration } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ ok: false, message: "Les paramètres start et end sont requis" });
      }
      
      const startDate = new Date(start as string);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(end as string);
      endDate.setHours(23, 59, 59, 999);
      
      const durationHours = duration ? parseFloat(duration as string) : MIN_DURATION_HOURS;
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      
      const availability: Record<string, { slots: Array<{ time: string; availableBays: string[] }>; fullyBooked: boolean }> = {};
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const bayOccupancy = getBayOccupancy(bookings, currentDate);
        const slots = getAvailableSlots(bayOccupancy, durationHours);
        
        availability[dateStr] = {
          slots,
          fullyBooked: slots.length === 0,
        };
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return res.json({ ok: true, availability });
    } catch (error) {
      console.error("Error fetching availability:", error);
      return res.status(500).json({ ok: false, message: "Erreur lors de la récupération des disponibilités" });
    }
  });
  
  app.post("/api/book", bookingRateLimiter, async (req: Request, res: Response) => {
    try {
      const sanitizedBody = sanitizeBookingInput(req.body);
      const validatedData = bookingRequestSchema.parse(sanitizedBody);
      
      const startMinutes = parseTimeToMinutes(validatedData.time);
      const durationMinutes = parseDurationToMinutes(validatedData.duration);
      const endMinutes = startMinutes + durationMinutes;
      const durationHours = parseFloat(validatedData.duration.replace('h', ''));
      
      if (startMinutes < OPENING_HOUR * 60) {
        return res.status(400).json({
          ok: false,
          message: `Les réservations ne peuvent commencer avant ${OPENING_HOUR}h.`,
        });
      }
      
      if (endMinutes > CLOSING_HOUR * 60) {
        return res.status(400).json({
          ok: false,
          message: `Les réservations doivent se terminer avant ${CLOSING_HOUR}h.`,
        });
      }
      
      if (durationHours < MIN_DURATION_HOURS) {
        return res.status(400).json({
          ok: false,
          message: `La durée minimale est de ${MIN_DURATION_HOURS} heure.`,
        });
      }
      
      if (!BAY_NUMBERS.includes(validatedData.bayType)) {
        return res.status(400).json({
          ok: false,
          message: `Baie invalide. Choisissez parmi: ${BAY_NUMBERS.join(', ')}.`,
        });
      }

      const bookingDateStr = validatedData.date.toISOString().split('T')[0];
      const bookingDayOfWeek = validatedData.date.getUTCDay();
      const bookingDaySchedule = await storage.getScheduleForDay(bookingDayOfWeek);
      const bookingSchedule = bookingDaySchedule ? {
        openHour: bookingDaySchedule.openHour,
        openMinute: bookingDaySchedule.openMinute,
        lastBookingHour: bookingDaySchedule.lastBookingHour,
        lastBookingMinute: bookingDaySchedule.lastBookingMinute,
        closeHour: bookingDaySchedule.closeHour,
        closeMinute: bookingDaySchedule.closeMinute,
      } : undefined;

      const bookingData: InsertBooking = {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        date: validatedData.date,
        time: validatedData.time,
        duration: validatedData.duration,
        bayType: validatedData.bayType,
        players: validatedData.players,
        notes: validatedData.notes || null,
      };

      const { booking, conflict } = await storage.createBookingWithConflictCheck(
        bookingData,
        (existingBookings: Booking[]) => {
          // This callback runs after the date's transaction lock and its fresh
          // bookings read, immediately before the insert in the same transaction.
          const finalBayId = getConfirmationBay(
            validatedData.date,
            validatedData.time,
            durationMinutes,
            formatBookingsForLogic(existingBookings, bookingDateStr),
            bookingSchedule
          );
          if (!finalBayId) return true;
          bookingData.bayType = finalBayId;

          for (const existing of existingBookings) {
            if (existing.bayType !== finalBayId) continue;
            
            const existingStartMinutes = parseTimeToMinutes(existing.time);
            const existingDurationMinutes = parseDurationToMinutes(existing.duration);
            const existingEndMinutes = existingStartMinutes + existingDurationMinutes;
            if (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes) {
              return true;
            }
          }
          
          return false;
        }
      );

      if (conflict || !booking) {
        return res.status(409).json({
          ok: false,
          message: "Ce créneau n'est pas disponible. Veuillez choisir un autre horaire.",
        });
      }

      let calendarEventId: string | null = null;
      try {
        calendarEventId = await createCalendarEvent({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone || null,
          date: validatedData.date,
          time: validatedData.time,
          duration: validatedData.duration,
          bayType: booking.bayType,
          players: validatedData.players,
          notes: validatedData.notes || null,
        });

        if (calendarEventId) {
          try {
            await storage.updateBookingCalendarEventId(booking.id, calendarEventId);
          } catch (dbUpdateError) {
            console.error("Failed to update calendar event ID in DB:", dbUpdateError);
            try {
              await deleteCalendarEvent(calendarEventId);
            } catch (calendarDeleteError) {
              console.error("Failed to delete orphaned calendar event:", calendarDeleteError);
            }
            await storage.deleteBooking(booking.id);
            return res.status(500).json({
              ok: false,
              message: "Erreur lors de la sauvegarde. Veuillez réessayer.",
            });
          }
        }
      } catch (calendarError) {
        console.error("Failed to create calendar event:", calendarError);
        await storage.deleteBooking(booking.id);
        return res.status(500).json({
          ok: false,
          message: "Erreur lors de la création de l'événement calendrier. Veuillez réessayer.",
        });
      }

      return res.status(201).json({
        ok: true,
        reservation: {
          id: booking.id,
          name: booking.name,
          email: booking.email,
          date: booking.date,
          time: booking.time,
          duration: booking.duration,
          bayType: booking.bayType,
          players: booking.players,
        },
        calendarEventId,
      });
    } catch (error) {
      console.error("Booking error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          message: "Données de réservation invalides.",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        ok: false,
        message: "Une erreur est survenue. Veuillez réessayer.",
      });
    }
  });

  const batchBookingSchema = z.object({
    items: z.array(z.object({
      date: z.string().transform((str) => new Date(str)),
      time: z.string(),
      duration: z.string(),
      bayType: z.enum(["1", "2", "3", "4"]),
    })).min(1),
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    players: z.number().min(1).max(4),
    notes: z.string().optional(),
  });

  app.post("/api/book/batch", bookingRateLimiter, async (req: Request, res: Response) => {
    try {
      const validatedData = batchBookingSchema.parse(req.body);
      
      const sanitizedName = sanitizeString(validatedData.name);
      const sanitizedEmail = sanitizeEmail(validatedData.email);
      const sanitizedPhone = validatedData.phone ? sanitizePhone(validatedData.phone) : null;
      const sanitizedNotes = validatedData.notes ? sanitizeString(validatedData.notes) : null;
      
      if (!sanitizedEmail) {
        return res.status(400).json({
          ok: false,
          message: "Adresse courriel invalide.",
        });
      }
      
      for (const item of validatedData.items) {
        const startMinutes = parseTimeToMinutes(item.time);
        const durationMinutes = parseDurationToMinutes(item.duration);
        const endMinutes = startMinutes + durationMinutes;
        const durationHours = parseFloat(item.duration.replace('h', ''));
        
        if (startMinutes < OPENING_HOUR * 60) {
          return res.status(400).json({
            ok: false,
            message: `Les réservations ne peuvent commencer avant ${OPENING_HOUR}h.`,
          });
        }
        
        if (endMinutes > CLOSING_HOUR * 60) {
          return res.status(400).json({
            ok: false,
            message: `Les réservations doivent se terminer avant ${CLOSING_HOUR}h.`,
          });
        }
        
        if (durationHours < MIN_DURATION_HOURS) {
          return res.status(400).json({
            ok: false,
            message: `La durée minimale est de ${MIN_DURATION_HOURS} heure.`,
          });
        }
        
        if (!BAY_NUMBERS.includes(item.bayType)) {
          return res.status(400).json({
            ok: false,
            message: `Baie invalide. Choisissez parmi: ${BAY_NUMBERS.join(', ')}.`,
          });
        }
      }
      
      const createdBookings: any[] = [];
      const createdCalendarEvents: string[] = [];
      
      try {
        for (const item of validatedData.items) {
          const bookingData = {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            date: item.date,
            time: item.time,
            duration: item.duration,
            bayType: item.bayType,
            players: validatedData.players,
            notes: sanitizedNotes,
          };

          const { booking, conflict } = await storage.createBookingWithConflictCheck(
            bookingData,
            (existingBookings: Booking[]) => {
              const requestedBay = item.bayType;
              const newStartMinutes = parseTimeToMinutes(item.time);
              const newDurationMinutes = parseDurationToMinutes(item.duration);
              const newEndMinutes = newStartMinutes + newDurationMinutes;
              
              const newSlots = new Set<number>();
              for (let m = newStartMinutes; m < newEndMinutes && m < CLOSING_HOUR * 60; m += 30) {
                newSlots.add(m);
              }
              
              for (const existing of existingBookings) {
                if (existing.bayType !== requestedBay) continue;
                
                const existingStartMinutes = parseTimeToMinutes(existing.time);
                const existingDurationMinutes = parseDurationToMinutes(existing.duration);
                const existingEndMinutes = existingStartMinutes + existingDurationMinutes;
                
                for (let m = existingStartMinutes; m < existingEndMinutes && m < CLOSING_HOUR * 60; m += 30) {
                  if (newSlots.has(m)) {
                    return true;
                  }
                }
              }
              
              for (const prevBooking of createdBookings) {
                if (prevBooking.bayType !== requestedBay) continue;
                
                const prevDateStr = new Date(prevBooking.date).toISOString().split('T')[0];
                const currentDateStr = item.date.toISOString().split('T')[0];
                if (prevDateStr !== currentDateStr) continue;
                
                const prevStartMinutes = parseTimeToMinutes(prevBooking.time);
                const prevDurationMinutes = parseDurationToMinutes(prevBooking.duration);
                const prevEndMinutes = prevStartMinutes + prevDurationMinutes;
                
                for (let m = prevStartMinutes; m < prevEndMinutes && m < CLOSING_HOUR * 60; m += 30) {
                  if (newSlots.has(m)) {
                    return true;
                  }
                }
              }
              
              return false;
            }
          );

          if (conflict || !booking) {
            for (const prevBooking of createdBookings) {
              await storage.deleteBooking(prevBooking.id);
            }
            for (const eventId of createdCalendarEvents) {
              try {
                await deleteCalendarEvent(eventId);
              } catch (e) {
                console.error("Failed to cleanup calendar event:", e);
              }
            }
            
            return res.status(409).json({
              ok: false,
              message: `Le créneau pour la Baie ${item.bayType} le ${item.date.toLocaleDateString('fr-CA')} à ${item.time} n'est pas disponible.`,
            });
          }

          createdBookings.push(booking);

          try {
            const calendarEventId = await createCalendarEvent({
              name: validatedData.name,
              email: validatedData.email,
              phone: validatedData.phone || null,
              date: item.date,
              time: item.time,
              duration: item.duration,
              bayType: item.bayType,
              players: validatedData.players,
              notes: validatedData.notes || null,
            });

            if (calendarEventId) {
              createdCalendarEvents.push(calendarEventId);
              await storage.updateBookingCalendarEventId(booking.id, calendarEventId);
            }
          } catch (calendarError) {
            console.error("Failed to create calendar event:", calendarError);
          }
        }

        return res.status(201).json({
          ok: true,
          count: createdBookings.length,
          reservations: createdBookings.map(b => ({
            id: b.id,
            name: b.name,
            email: b.email,
            date: b.date,
            time: b.time,
            duration: b.duration,
            bayType: b.bayType,
            players: b.players,
          })),
        });
      } catch (innerError) {
        for (const prevBooking of createdBookings) {
          try {
            await storage.deleteBooking(prevBooking.id);
          } catch (e) {
            console.error("Failed to cleanup booking:", e);
          }
        }
        for (const eventId of createdCalendarEvents) {
          try {
            await deleteCalendarEvent(eventId);
          } catch (e) {
            console.error("Failed to cleanup calendar event:", e);
          }
        }
        throw innerError;
      }
    } catch (error) {
      console.error("Batch booking error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          ok: false,
          message: "Données de réservation invalides.",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        ok: false,
        message: "Une erreur est survenue. Veuillez réessayer.",
      });
    }
  });

  app.get("/api/reservations", async (_req: Request, res: Response) => {
    try {
      const bookings = await storage.getAllBookings();
      return res.json({ ok: true, reservations: bookings });
    } catch (error) {
      console.error("Error fetching reservations:", error);
      return res.status(500).json({
        ok: false,
        message: "Erreur lors de la récupération des réservations.",
      });
    }
  });

  app.get("/api/availability/:date/:bayType", async (req: Request, res: Response) => {
    try {
      const { date, bayType } = req.params;
      const bookings = await storage.getBookingsByDateAndBay(new Date(date), bayType);
      
      const bookedSlots = bookings.map((b) => ({
        time: b.time,
        duration: b.duration,
      }));

      return res.json({ ok: true, bookedSlots });
    } catch (error) {
      console.error("Error checking availability:", error);
      return res.status(500).json({
        ok: false,
        message: "Erreur lors de la vérification de la disponibilité.",
      });
    }
  });

  let lastWebhookSync = 0;
  const WEBHOOK_DEBOUNCE_MS = 5000;

  app.post("/api/calendar/webhook", async (req: Request, res: Response) => {
    res.status(200).end();

    const channelId = req.headers['x-goog-channel-id'] as string | undefined;
    const token = req.headers['x-goog-channel-token'] as string | undefined;
    const resourceState = req.headers['x-goog-resource-state'] as string | undefined;

    if (!channelId || !token || token !== getWatchToken()) return;
    if (channelId !== getActiveWatchChannelId()) return;
    if (resourceState === 'sync') return;

    const now = Date.now();
    if (now - lastWebhookSync < WEBHOOK_DEBOUNCE_MS) return;
    lastWebhookSync = now;

    try {
      const result = await syncCalendarToDatabase();
      const changes = [
        result.imported > 0 && `imported ${result.imported}`,
        result.updated > 0 && `updated ${result.updated}`,
        result.deleted > 0 && `deleted ${result.deleted}`,
      ].filter(Boolean);
      if (changes.length > 0) {
        console.log(`[Calendar Watch] Webhook sync: ${changes.join(', ')} booking(s)`);
      }
    } catch (error) {
    }
  });

  const SYNC_INTERVAL_MS = 5 * 60 * 1000;
  
  async function runBackgroundSync() {
    try {
      const result = await syncCalendarToDatabase();
      const changes = [
        result.imported > 0 && `imported ${result.imported}`,
        result.updated > 0 && `updated ${result.updated}`,
        result.deleted > 0 && `deleted ${result.deleted}`,
      ].filter(Boolean);
      if (changes.length > 0) {
        console.log(`[Calendar Sync] ${changes.join(', ')} booking(s) from Google Calendar`);
      }
    } catch (error) {
    }
  }

  async function initCalendarWatch() {
    try {
      const status = await getCalendarConnectionStatus();
      if (!status.connected) return;

      const host = process.env.REPLIT_DEV_DOMAIN || process.env.REPL_SLUG;
      if (!host) return;

      const protocol = 'https';
      const webhookUrl = `${protocol}://${host}/api/calendar/webhook`;
      const success = await setupCalendarWatch(webhookUrl);
      if (success) {
        console.log(`[Calendar Watch] Real-time notifications active → ${webhookUrl}`);
      }
    } catch (error) {
    }
  }
  
  setTimeout(runBackgroundSync, 30000);
  setInterval(runBackgroundSync, SYNC_INTERVAL_MS);
  setTimeout(initCalendarWatch, 35000);

  return httpServer;
}
