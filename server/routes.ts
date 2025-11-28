import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, type Booking } from "@shared/schema";
import { createCalendarEvent, deleteCalendarEvent } from "./googleCalendar";
import { z } from "zod";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/book", async (req: Request, res: Response) => {
    try {
      const validatedData = bookingRequestSchema.parse(req.body);
      
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

      const { booking, conflict } = await storage.createBookingWithLock(
        bookingData,
        (existingBookings: Booking[]) => {
          return existingBookings.some((existing) =>
            checkTimeOverlap(
              existing.time,
              existing.duration,
              validatedData.time,
              validatedData.duration
            )
          );
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
