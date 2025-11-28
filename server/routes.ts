import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { type Booking } from "@shared/schema";
import { 
  createCalendarEvent, 
  deleteCalendarEvent, 
  getCalendarConnectionStatus,
  getGoogleAuthUrl,
  generateOAuthState,
  exchangeCodeForTokens,
  revokeGoogleAccess,
  getRedirectUri,
  listCalendars
} from "./googleCalendar";
import { z } from "zod";
import bcrypt from "bcrypt";

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
  bayType: z.enum(["standard", "premium"]),
  players: z.number().min(1).max(4),
  notes: z.string().optional(),
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/auth/login", async (req: Request, res: Response) => {
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
      res.clearCookie("connect.sid");
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

  app.get("/api/admin/calendar-settings", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getCalendarSettings();
      return res.json({ ok: true, settings: settings || { syncEmail: null, calendarId: "primary" } });
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

  const MAX_BAYS = 5;
  const OPENING_HOUR = 8;
  const CLOSING_HOUR = 22;
  const MIN_DURATION_HOURS = 4;

  function calculateOccupancy(bookings: Booking[], targetDate: Date): Map<number, number> {
    const occupancy = new Map<number, number>();
    
    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
      occupancy.set(hour, 0);
    }
    
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    for (const booking of bookings) {
      const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];
      if (bookingDateStr !== targetDateStr) continue;
      
      const [startHour] = booking.time.split(':').map(Number);
      const durationHours = parseInt(booking.duration.replace('h', ''), 10);
      
      for (let h = startHour; h < startHour + durationHours && h < CLOSING_HOUR; h++) {
        const current = occupancy.get(h) || 0;
        occupancy.set(h, current + 1);
      }
    }
    
    return occupancy;
  }

  function getAvailableSlots(occupancy: Map<number, number>, durationHours: number): Array<{ time: string; remainingBays: number }> {
    const slots: Array<{ time: string; remainingBays: number }> = [];
    
    const lastValidStartHour = CLOSING_HOUR - durationHours;
    
    for (let hour = OPENING_HOUR; hour <= lastValidStartHour; hour++) {
      let minRemainingBays = MAX_BAYS;
      
      for (let h = hour; h < hour + durationHours; h++) {
        const occupied = occupancy.get(h) || 0;
        const remaining = MAX_BAYS - occupied;
        minRemainingBays = Math.min(minRemainingBays, remaining);
      }
      
      if (minRemainingBays > 0) {
        const timeStr = hour.toString().padStart(2, '0') + ':00';
        slots.push({ time: timeStr, remainingBays: minRemainingBays });
      }
    }
    
    return slots;
  }

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
      
      const durationHours = duration ? parseInt(duration as string, 10) : MIN_DURATION_HOURS;
      
      const bookings = await storage.getBookingsByDateRange(startDate, endDate);
      
      const availability: Record<string, { slots: Array<{ time: string; remainingBays: number }>; fullyBooked: boolean }> = {};
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const occupancy = calculateOccupancy(bookings, currentDate);
        const slots = getAvailableSlots(occupancy, durationHours);
        
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
  
  app.post("/api/book", async (req: Request, res: Response) => {
    try {
      const validatedData = bookingRequestSchema.parse(req.body);
      
      const [startHour] = validatedData.time.split(':').map(Number);
      const durationHours = parseInt(validatedData.duration.replace('h', ''), 10);
      const endHour = startHour + durationHours;
      
      if (startHour < OPENING_HOUR) {
        return res.status(400).json({
          ok: false,
          message: `Les réservations ne peuvent commencer avant ${OPENING_HOUR}h.`,
        });
      }
      
      if (endHour > CLOSING_HOUR) {
        return res.status(400).json({
          ok: false,
          message: `Les réservations doivent se terminer avant ${CLOSING_HOUR}h.`,
        });
      }
      
      if (durationHours < MIN_DURATION_HOURS) {
        return res.status(400).json({
          ok: false,
          message: `La durée minimale est de ${MIN_DURATION_HOURS} heures.`,
        });
      }
      
      const bookingData = {
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
          const occupancy = new Map<number, number>();
          
          for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
            occupancy.set(hour, 0);
          }
          
          for (const existing of existingBookings) {
            const [startHour] = existing.time.split(':').map(Number);
            const durationHours = parseInt(existing.duration.replace('h', ''), 10);
            
            for (let h = startHour; h < startHour + durationHours && h < CLOSING_HOUR; h++) {
              const current = occupancy.get(h) || 0;
              occupancy.set(h, current + 1);
            }
          }
          
          const [newStartHour] = validatedData.time.split(':').map(Number);
          const newDurationHours = parseInt(validatedData.duration.replace('h', ''), 10);
          
          for (let h = newStartHour; h < newStartHour + newDurationHours && h < CLOSING_HOUR; h++) {
            const current = occupancy.get(h) || 0;
            if (current >= MAX_BAYS) {
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
          bayType: validatedData.bayType,
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

  return httpServer;
}
