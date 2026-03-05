import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Users } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  date: string;
  time: string;
  duration: string;
  bayType: string;
  players: number;
  calendarEventId?: string | null;
}

interface CalendarViewProps {
  bookings: Booking[];
}

const BAY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "1": { bg: "bg-emerald-100", border: "border-emerald-400", text: "text-emerald-800" },
  "2": { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-800" },
  "3": { bg: "bg-amber-100", border: "border-amber-400", text: "text-amber-800" },
  "4": { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-800" },
};

function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/(\d+)h(\d{2})?/);
  if (!match) return 60;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export default function CalendarView({ bookings }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  const dayBookings = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return bookings.filter((b) => {
      const bDate = typeof b.date === "string" ? b.date.split("T")[0] : "";
      return bDate === dateStr;
    });
  }, [bookings, selectedDate]);

  const hours = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 24; h++) {
      slots.push(h);
    }
    return slots;
  }, []);

  const HOUR_HEIGHT = 64;
  const START_HOUR = 8;
  const END_HOUR = 25;

  const getBookingStyle = (booking: Booking) => {
    const startMinutes = parseTimeToMinutes(booking.time);
    const durationMinutes = parseDurationToMinutes(booking.duration);
    const topOffset = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;
    return { top: `${topOffset}px`, height: `${height}px` };
  };

  const bays = ["1", "2", "3", "4"];
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const currentTimeOffset = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;
    return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  }, [isToday, selectedDate]);

  return (
    <Card className="shadow-lg border-none" data-testid="card-calendar-view">
      <CardHeader className="bg-[#1B1A18] text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
            <Calendar className="w-5 h-5" />
            Vue calendrier
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate((d) => subDays(d, 1))}
              className="h-8 w-8 text-white hover:bg-white/10"
              data-testid="button-prev-day"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(startOfDay(new Date()))}
              className={`text-white hover:bg-white/10 text-sm font-heading uppercase tracking-wider min-w-[180px] ${isToday ? "bg-white/10" : ""}`}
              data-testid="button-today"
            >
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="h-8 w-8 text-white hover:bg-white/10"
              data-testid="button-next-day"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr] border-b bg-gray-50 sticky top-0 z-10">
              <div className="p-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r" />
              {bays.map((bay) => {
                const colors = BAY_COLORS[bay];
                const count = dayBookings.filter((b) => b.bayType === bay).length;
                return (
                  <div
                    key={bay}
                    className={`p-3 text-center border-r last:border-r-0 ${colors.bg}`}
                  >
                    <p className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>
                      Baie {bay}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {count} réservation{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="relative overflow-y-auto max-h-[700px]">
              <div
                className="grid grid-cols-[60px_1fr_1fr_1fr_1fr]"
                style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}
              >
                <div className="relative border-r">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full text-right pr-2 -translate-y-1/2"
                      style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
                    >
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {h === 24 ? "00" : String(h).padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>

                {bays.map((bay) => {
                  const bayBookings = dayBookings.filter((b) => b.bayType === bay);
                  const colors = BAY_COLORS[bay];

                  return (
                    <div key={bay} className="relative border-r last:border-r-0">
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute w-full border-t border-gray-100"
                          style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                        />
                      ))}
                      {hours.filter((h) => h < END_HOUR).map((h) => (
                        <div
                          key={`half-${h}`}
                          className="absolute w-full border-t border-gray-50"
                          style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px` }}
                        />
                      ))}

                      {bayBookings.map((booking) => {
                        const style = getBookingStyle(booking);
                        const durationMin = parseDurationToMinutes(booking.duration);
                        const isShort = durationMin <= 60;

                        return (
                          <div
                            key={booking.id}
                            className={`absolute left-1 right-1 rounded-md border-l-[3px] ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-shadow cursor-default overflow-hidden group`}
                            style={style}
                            title={`${booking.name} — ${booking.time} (${booking.duration})`}
                            data-testid={`booking-block-${booking.id}`}
                          >
                            <div className={`px-2 ${isShort ? "py-0.5" : "py-1.5"} h-full flex flex-col justify-center`}>
                              <p className={`font-bold truncate ${colors.text} ${isShort ? "text-[11px]" : "text-xs"}`}>
                                {booking.name}
                              </p>
                              {!isShort && (
                                <>
                                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                    {booking.time} — {booking.duration}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <Users className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">
                                      {booking.players} joueur{booking.players > 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </>
                              )}
                              {isShort && (
                                <p className="text-[9px] text-muted-foreground truncate">
                                  {booking.time} · {booking.players}j
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {currentTimeOffset !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${currentTimeOffset}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                      <div className="flex-1 h-[2px] bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
