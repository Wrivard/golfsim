import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Users, Clock, Mail, Phone, MapPin, X, Pencil, Trash2, ExternalLink, Check, Loader2, Plus } from "lucide-react";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { parseDurationToMinutes } from "./calendarDuration";
import CreateBookingDialog, { type BookingPrefill } from "./CreateBookingDialog";

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
  isDeleting?: boolean;
}

const BAY_COLORS: Record<string, { bg: string; bgSolid: string; border: string; text: string; headerBg: string }> = {
  "1": { bg: "bg-emerald-50", bgSolid: "#ecfdf5", border: "border-emerald-400", text: "text-emerald-800", headerBg: "bg-emerald-100" },
  "2": { bg: "bg-blue-50", bgSolid: "#eff6ff", border: "border-blue-400", text: "text-blue-800", headerBg: "bg-blue-100" },
  "3": { bg: "bg-amber-50", bgSolid: "#fffbeb", border: "border-amber-400", text: "text-amber-800", headerBg: "bg-amber-100" },
  "4": { bg: "bg-purple-50", bgSolid: "#faf5ff", border: "border-purple-400", text: "text-purple-800", headerBg: "bg-purple-100" },
};

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

export default function CalendarView({ bookings, onDeleteBooking, isDeleting }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [createPrefill, setCreatePrefill] = useState<BookingPrefill | null>(null);
  const openCreate = (bayType = "1", time = "08:00") => setCreatePrefill({
    date: format(selectedDate, "yyyy-MM-dd"), time, bayType,
  });

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Calendar className="w-5 h-5" />
              Vue calendrier
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => openCreate()} className="bg-[#2B5734] hover:bg-[#23482b] text-white gap-1.5">
                <Plus className="w-4 h-4" /> Ajouter
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate((d) => subDays(d, 1))} className="h-8 w-8 text-white hover:bg-white/10" data-testid="button-prev-day">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedDate(startOfDay(new Date()))} className={`text-white hover:bg-white/10 text-sm font-heading uppercase tracking-wider ${isToday ? "bg-white/10" : ""}`} data-testid="button-today">
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
                            <div
                              key={bay}
                              className="relative border-r border-gray-200 last:border-r-0 cursor-crosshair"
                              title={`Ajouter une réservation — baie ${bay}`}
                              onClick={e => {
                                const bounds = e.currentTarget.getBoundingClientRect();
                                const halfHours = Math.floor(Math.max(0, e.clientY - bounds.top) / (HOUR_HEIGHT / 2));
                                const minutes = START_HOUR * 60 + Math.min(halfHours * 30, (END_HOUR - START_HOUR) * 60 - 30);
                                openCreate(bay, `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`);
                              }}
                            >
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
          onUpdated={updated => setSelectedDate(startOfDay(new Date(`${updated.date.split("T")[0]}T12:00:00`)))}
          onDelete={onDeleteBooking}
          isDeleting={isDeleting}
        />
      )}
      {createPrefill && <CreateBookingDialog key={`${createPrefill.date}-${createPrefill.time}-${createPrefill.bayType}`} prefill={createPrefill} onClose={() => setCreatePrefill(null)} />}
    </>
  );
}

async function updateBookingApi(id: string, updates: Record<string, any>) {
  const response = await fetch(`/api/admin/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || "Erreur");
  return data.booking;
}

function BookingModal({ booking, onClose, onUpdated, onDelete, isDeleting }: {
  booking: Booking;
  onClose: () => void;
  onUpdated?: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editName, setEditName] = useState(booking.name);
  const [editEmail, setEditEmail] = useState(booking.email || "");
  const [editPhone, setEditPhone] = useState(booking.phone || "");
  const [editDate, setEditDate] = useState(String(booking.date).split("T")[0]);
  const [editTime, setEditTime] = useState(booking.time || "");
  const [editDuration, setEditDuration] = useState(booking.duration || "1h");
  const [editBay, setEditBay] = useState(booking.bayType || "1");
  const [editPlayers, setEditPlayers] = useState(String(booking.players || 1));
  const [editNotes, setEditNotes] = useState(booking.notes || "");

  const saveMutation = useMutation({
    mutationFn: () => updateBookingApi(booking.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      date: editDate,
      time: editTime,
      duration: editDuration,
      bayType: editBay,
      players: Number(editPlayers),
      notes: editNotes,
    }),
    onSuccess: (updated) => {
      toast({ title: "Réservation modifiée" });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["optimized-slots"] });
      setIsEditing(false);
      onUpdated?.(updated);
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const colors = BAY_COLORS[isEditing ? editBay : booking.bayType] || BAY_COLORS["1"];
  const displayDuration = isEditing ? editDuration : (booking.duration || "1h");
  const price = getPriceForBooking(displayDuration);
  const dateStr = isEditing ? editDate : typeof booking.date === "string" ? booking.date.split("T")[0] : "";
  let formattedDate = dateStr;
  try {
    const [y, mo, d] = dateStr.split("-").map(Number);
    if (y && mo && d) {
      formattedDate = format(new Date(y, mo - 1, d), "EEEE d MMMM yyyy", { locale: fr });
    }
  } catch { /* keep raw string */ }
  const durMin = parseDurationToMinutes(displayDuration);
  const displayTime = isEditing ? editTime : (booking.time || "00:00");
  const timeParts = displayTime.split(":").map(Number);
  const startH = timeParts[0] || 0;
  const startM = timeParts[1] || 0;
  const endTotalMin = startH * 60 + startM + durMin;
  const endH = Math.floor(endTotalMin / 60);
  const endM = endTotalMin % 60;
  const endTime = `${(endH >= 24 ? endH - 24 : endH).toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

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
                B{isEditing ? editBay : booking.bayType}
              </div>
              <div>
                {isEditing ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="font-heading font-bold text-lg uppercase tracking-wide h-8 bg-white/80 border-0 focus-visible:ring-1"
                    data-testid="input-edit-name"
                  />
                ) : (
                  <h3 className={`font-heading font-bold text-xl uppercase tracking-wide ${colors.text}`} data-testid="text-modal-name">
                    {booking.name}
                  </h3>
                )}
                <p className="text-sm text-muted-foreground capitalize mt-0.5">{formattedDate}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 transition-colors -mt-1 -mr-1" data-testid="button-close-modal">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {isEditing ? (
            <>
              <div className="space-y-1.5">
                <label htmlFor="edit-booking-date" className="text-xs font-medium text-muted-foreground">Date</label>
                <Input id="edit-booking-date" type="date" value={editDate}
                  onChange={e => setEditDate(e.target.value)} data-testid="input-edit-date" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Heure</label>
                  <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} data-testid="input-edit-time" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Durée</label>
                  <Select value={editDuration} onValueChange={setEditDuration}>
                    <SelectTrigger data-testid="select-edit-duration"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1h</SelectItem>
                      <SelectItem value="2h">2h</SelectItem>
                      <SelectItem value="3h">3h</SelectItem>
                      <SelectItem value="4h">4h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Baie</label>
                  <Select value={editBay} onValueChange={setEditBay}>
                    <SelectTrigger data-testid="select-edit-bay"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Baie 1</SelectItem>
                      <SelectItem value="2">Baie 2</SelectItem>
                      <SelectItem value="3">Baie 3</SelectItem>
                      <SelectItem value="4">Baie 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Joueurs</label>
                  <Select value={editPlayers} onValueChange={setEditPlayers}>
                    <SelectTrigger data-testid="select-edit-players"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Montant</label>
                  <div className="h-9 flex items-center px-3 bg-gray-50 rounded-md border text-sm font-bold">{price} $</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Courriel</label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" data-testid="input-edit-email" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} data-testid="input-edit-notes" />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          {isEditing ? (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button
                size="default"
                className="gap-2 bg-[#2B5734] hover:bg-[#1e3d24]"
                disabled={saveMutation.isPending || !editName.trim() || !editDate || !editTime}
                onClick={() => saveMutation.mutate()}
                data-testid="button-save-booking"
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClose}>
                Fermer
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit-booking"
                >
                  <Pencil className="w-4 h-4" />
                  Modifier
                </Button>
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
                    {isDeleting ? "Suppression..." : "Confirmer"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
