import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export interface BookingPrefill {
  date: string;
  time: string;
  bayType: string;
}

interface AvailableSlot {
  time: string;
  allBays?: { bayId: string; isValid: boolean }[];
}

async function fetchStaffSlots(date: string, durationMinutes: number): Promise<AvailableSlot[]> {
  const response = await fetch(`/api/availability/optimized?date=${encodeURIComponent(date)}&duration=${durationMinutes}`);
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.message || "Impossible de charger les disponibilités");
  return result.slots;
}

export default function CreateBookingDialog({ prefill, onClose }: { prefill: BookingPrefill; onClose: () => void }) {
  const [date, setDate] = useState(prefill.date);
  const [time, setTime] = useState(prefill.time);
  const [duration, setDuration] = useState("1h");
  const [bayType, setBayType] = useState(prefill.bayType);
  const [players, setPlayers] = useState("1");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const durationMinutes = Number.parseInt(duration, 10) * 60;
  const slotsQuery = useQuery({
    queryKey: ["staff-availability", date, durationMinutes],
    queryFn: () => fetchStaffSlots(date, durationMinutes),
    enabled: /^\d{4}-\d{2}-\d{2}$/.test(date),
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const availableTimes = (slotsQuery.data || [])
    .filter(slot => slot.allBays?.some(bay => bay.bayId === bayType && bay.isValid))
    .map(slot => {
      const local = new Date(slot.time);
      return `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
    })
    .filter(value => {
      const [hour, minute] = value.split(":").map(Number);
      const start = hour * 60 + minute;
      return start >= 8 * 60 && start + durationMinutes <= 22 * 60;
    })
    .sort();
  const selectedTime = !slotsQuery.isFetching && !slotsQuery.isError && availableTimes.includes(time) ? time : "";
  const create = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, duration, bayType, players: Number(players), name, email, phone, notes }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw Object.assign(new Error(result.message || "Impossible de créer la réservation"), { status: response.status });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
      queryClient.invalidateQueries({ queryKey: ["availability"] });
      queryClient.invalidateQueries({ queryKey: ["optimized-slots"] });
      queryClient.invalidateQueries({ queryKey: ["staff-availability"] });
      toast({ title: "Réservation ajoutée" });
      onClose();
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        queryClient.invalidateQueries({ queryKey: ["staff-availability"] });
        queryClient.invalidateQueries({ queryKey: ["availability"] });
        queryClient.invalidateQueries({ queryKey: ["optimized-slots"] });
      }
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTime) return;
    create.mutate();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !create.isPending) onClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une réservation</DialogTitle>
          <DialogDescription>Choisissez un créneau et une baie disponibles selon les heures d'ouverture.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-date">Date</Label>
              <Input id="staff-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-time">Heure</Label>
              <Select value={selectedTime} onValueChange={setTime} disabled={slotsQuery.isFetching || slotsQuery.isError || availableTimes.length === 0}>
                <SelectTrigger id="staff-time" aria-label="Heure"><SelectValue placeholder="Choisir une heure" /></SelectTrigger>
                <SelectContent>{availableTimes.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground" role="status">
                {slotsQuery.isFetching ? "Chargement des heures disponibles..." : slotsQuery.isError ? `Erreur : ${slotsQuery.error.message}` : availableTimes.length === 0 ? "Aucune heure disponible pour cette baie." : !selectedTime && time ? "L'heure choisie n'est plus disponible." : `${availableTimes.length} heure${availableTimes.length > 1 ? "s" : ""} disponible${availableTimes.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-duration">Durée</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="staff-duration" aria-label="Durée"><SelectValue /></SelectTrigger>
                <SelectContent>{["1h", "2h", "3h", "4h"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-bay">Baie</Label>
              <Select value={bayType} onValueChange={setBayType}>
                <SelectTrigger id="staff-bay" aria-label="Baie"><SelectValue /></SelectTrigger>
                <SelectContent>{["1", "2", "3", "4"].map(value => <SelectItem key={value} value={value}>Baie {value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-players">Joueurs</Label>
              <Select value={players} onValueChange={setPlayers}>
                <SelectTrigger id="staff-players" aria-label="Joueurs"><SelectValue /></SelectTrigger>
                <SelectContent>{["1", "2", "3", "4"].map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-name">Nom *</Label>
            <Input id="staff-name" required minLength={2} maxLength={200} value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Courriel (facultatif)</Label>
              <Input id="staff-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Téléphone (facultatif)</Label>
              <Input id="staff-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-notes">Notes (facultatif)</Label>
            <Textarea id="staff-notes" maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>Annuler</Button>
            <Button type="submit" disabled={create.isPending || !selectedTime}>{create.isPending ? "Enregistrement..." : "Ajouter la réservation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}