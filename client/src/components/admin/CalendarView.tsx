import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Mail, Phone, MapPin, X, Pencil, Trash2, ExternalLink } from "lucide-react";
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
  notes?: string | null;
  calendarEventId?: string | null;
  createdAt?: string;
}

interface CalendarViewProps {
  bookings: Booking[];
  onDeleteBooking?: (id: string) => void;
  onEditBooking?: (booking: Booking) => void;
  isDeleting?: boolean;
}

const BAY_COLORS: Record<string, { bg: string; bgSolid: string; border: string; text: string; headerBg: string }> = {
  "1": { bg: "bg-emerald-50", bgSolid: "#ecfdf5", border: "border-emerald-400", text: "text-emerald-800", headerBg: "bg-emerald-100" },
  "2": { bg: "bg-blue-50", bgSolid: "#eff6ff", border: "border-blue-400", text: "text-blue-800", headerBg: "bg-blue-100" },
  "3": { bg: "bg-amber-50", bgSolid: "#fffbeb", border: "border-amber-400", text: "text-amber-800", headerBg: "bg-amber-100" },
  "4": { bg: "bg-purple-50", bgSolid: "#faf5ff", border: "border-purple-400", text: "text-purple-800", headerBg: "bg-purple-100" },
};

function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/(\d+)h(\d{2})?/);
  if (!match) return 60;
  return parseInt(match[1], 10) * 60 + parseInt(match[2] || "0", 10);
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

function getPriceForBooking(durationStr: string): number {
  const hours = parseFloat(durationStr?.replace("h", "") || "0");
  const pricePerHour = hours === 1 ? 25 : 28;
  return hours * pricePerHour;
}

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 25;
const BAYS = ["1", "2", "3", "4"];
const TIME_COL_WIDTH = 56;

export default function CalendarView({ bookings, onDeleteBooking, onEditBooking, isDeleting }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const dayBookings = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return bookings.filter((b) => {
      const bDate = typeof b.date === "string" ? b.date.split("T")[0] : "";
      return bDate === dateStr;
    });
  }, [bookings, selectedDate]);

  const hours = useMemo(() => {
    const slots = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) slots.push(h);
    return slots;
  }, []);

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const currentTimeOffset = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < START_HOUR * 60 || minutes > END_HOUR * 60) return null;
    return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  }, [isToday, selectedDate]);

  const handleBookingClick = useCallback((booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooking(booking);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  const totalHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <>
      <Card className="shadow-lg border-none" data-testid="card-calendar-view">
        <CardHeader className="bg-[#1B1A18] text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Calendar className="w-5 h-5" />
              Vue calendrier
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => subDays(d, 1))} className="h-8 w-8 text-white hover:bg-white/10" data-testid="button-prev-day">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(startOfDay(new Date()))} className={`text-white hover:bg-white/10 text-sm font-heading uppercase tracking-wider min-w-[180px] ${isToday ? "bg-white/10" : ""}`} data-testid="button-today">
                {format(selectedDate, "EEEE d MMMM", { locale: fr })}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => addDays(d, 1))} className="h-8 w-8 text-white hover:bg-white/10" data-testid="button-next-day">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white overflow-hidden rounded-b-lg">
          <div className="overflow-auto max-h-[760px]">
            <table className="w-full border-collapse" style={{ minWidth: 600 }}>
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-gray-50 border-b border-r border-gray-200" style={{ width: TIME_COL_WIDTH }} />
                  {BAYS.map((bay) => {
                    const colors = BAY_COLORS[bay];
                    const count = dayBookings.filter((b) => b.bayType === bay).length;
                    return (
                      <th key={bay} className={`p-3 text-center border-b border-r border-gray-200 last:border-r-0 ${colors.headerBg}`}>
                        <p className={`text-sm font-bold uppercase tracking-wider ${colors.text}`}>Baie {bay}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                          {count} réservation{count !== 1 ? "s" : ""}
                        </p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={1 + BAYS.length} className="p-0 relative">
                    <div className="relative" style={{ height: totalHeight }}>
                      {hours.map((h) => (
                        <div key={`line-${h}`} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }} />
                      ))}
                      {hours.filter((h) => h < END_HOUR).map((h) => (
                        <div key={`half-${h}`} className="absolute right-0 border-t border-dashed border-gray-100" style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: TIME_COL_WIDTH }} />
                      ))}

                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${BAYS.length}, 1fr)` }}>
                        <div className="relative border-r border-gray-200">
                          {hours.map((h) => (
                            <div key={h} className="absolute w-full text-right pr-2 -translate-y-1/2" style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}>
                              <span className="text-[11px] text-muted-foreground font-mono bg-white px-0.5">
                                {(h >= 24 ? h - 24 : h).toString().padStart(2, "0")}:00
                              </span>
                            </div>
                          ))}
                        </div>

                        {BAYS.map((bay) => {
                          const bayBookings = dayBookings.filter((b) => b.bayType === bay);
                          const colors = BAY_COLORS[bay];
                          return (
                            <div key={bay} className="relative border-r border-gray-200 last:border-r-0">
                              {bayBookings.map((booking) => {
                                const startMin = parseTimeToMinutes(booking.time);
                                const durMin = parseDurationToMinutes(booking.duration);
                                const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                                const height = (durMin / 60) * HOUR_HEIGHT;
                                const isShort = durMin <= 60;

                                return (
                                  <div
                                    key={booking.id}
                                    className={`absolute left-1 right-1 rounded-md border-l-[3px] ${colors.border} ${colors.bg} shadow-sm hover:shadow-lg hover:brightness-95 transition-all cursor-pointer overflow-hidden z-[1]`}
                                    style={{ top, height }}
                                    onClick={(e) => handleBookingClick(booking, e)}
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
                      </div>

                      {currentTimeOffset !== null && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: currentTimeOffset }}>
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                            <div className="flex-1 h-[2px] bg-red-500" />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={closeModal}
          onDelete={onDeleteBooking}
          onEdit={onEditBooking}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
}

function BookingModal({ booking, onClose, onDelete, onEdit, isDeleting }: {
  booking: Booking;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (booking: Booking) => void;
  isDeleting?: boolean;
}) {
  const colors = BAY_COLORS[booking.bayType] || BAY_COLORS["1"];
  const price = getPriceForBooking(booking.duration || "1h");
  const dateStr = typeof booking.date === "string" ? booking.date.split("T")[0] : "";
  let formattedDate = dateStr;
  try {
    const [y, mo, d] = dateStr.split("-").map(Number);
    if (y && mo && d) {
      formattedDate = format(new Date(y, mo - 1, d), "EEEE d MMMM yyyy", { locale: fr });
    }
  } catch { /* keep raw string */ }
  const durMin = parseDurationToMinutes(booking.duration || "1h");
  const timeParts = (booking.time || "00:00").split(":").map(Number);
  const startH = timeParts[0] || 0;
  const startM = timeParts[1] || 0;
  const endTotalMin = startH * 60 + startM + durMin;
  const endH = Math.floor(endTotalMin / 60);
  const endM = endTotalMin % 60;
  const endTime = `${(endH >= 24 ? endH - 24 : endH).toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;
  const hours = parseFloat(booking.duration?.replace("h", "") || "1");

  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="modal-booking-overlay">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-booking-detail"
      >
        <div className={`${colors.headerBg} px-6 py-5`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/80 ${colors.text} font-bold text-base border-2 ${colors.border} shadow-sm`}>
                B{booking.bayType}
              </div>
              <div>
                <h3 className={`font-heading font-bold text-xl uppercase tracking-wide ${colors.text}`} data-testid="text-modal-name">
                  {booking.name}
                </h3>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">{formattedDate}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors -mt-1 -mr-1" data-testid="button-close-modal">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="font-bold text-base" data-testid="text-modal-time">{booking.time}</p>
              <p className="text-xs text-muted-foreground mt-1">à {endTime}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <Users className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="font-bold text-base" data-testid="text-modal-players">{booking.players}</p>
              <p className="text-xs text-muted-foreground mt-1">joueur{booking.players > 1 ? "s" : ""}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <MapPin className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className={`font-bold text-base ${colors.text}`} data-testid="text-modal-bay">Baie {booking.bayType}</p>
              <p className="text-xs text-muted-foreground mt-1">{booking.duration}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Montant estimé</span>
            <span className="font-bold text-lg">{price} $</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Coordonnées</p>
            {booking.email && (
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`mailto:${booking.email}`} className="text-sm text-blue-600 hover:underline truncate" data-testid="text-modal-email">{booking.email}</a>
              </div>
            )}
            {booking.phone && (
              <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <a href={`tel:${booking.phone}`} className="text-sm text-blue-600 hover:underline" data-testid="text-modal-phone">{booking.phone}</a>
              </div>
            )}
            {!booking.email && !booking.phone && (
              <p className="text-sm text-muted-foreground italic">Aucune coordonnée disponible</p>
            )}
          </div>

          {booking.calendarEventId && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Synchronisé avec Google Calendar</span>
            </div>
          )}

          {booking.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Notes</p>
              <p className="text-sm text-amber-900" data-testid="text-modal-notes">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onClose}
          >
            Fermer
          </Button>
          <div className="flex items-center gap-3">
            {onEdit && (
              <Button
                variant="outline"
                size="default"
                className="gap-2"
                onClick={() => { onEdit(booking); onClose(); }}
                data-testid="button-edit-booking"
              >
                <Pencil className="w-4 h-4" />
                Modifier
              </Button>
            )}
            {onDelete && !confirmDelete && (
              <Button
                variant="outline"
                size="default"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
                data-testid="button-delete-booking"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            )}
            {onDelete && confirmDelete && (
              <Button
                variant="destructive"
                size="default"
                className="gap-2"
                disabled={isDeleting}
                onClick={() => { onDelete(booking.id); onClose(); }}
                data-testid="button-confirm-delete-booking"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
