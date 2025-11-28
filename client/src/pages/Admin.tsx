import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, LogOut, Calendar, Mail, Save } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

async function fetchSession() {
  const response = await fetch("/api/auth/session");
  const data = await response.json();
  return data;
}

async function fetchCalendarSettings() {
  const response = await fetch("/api/admin/calendar-settings");
  if (response.status === 401) {
    throw new Error("Non autorisé");
  }
  const data = await response.json();
  return data;
}

async function fetchBookings() {
  const response = await fetch("/api/admin/bookings");
  if (response.status === 401) {
    throw new Error("Non autorisé");
  }
  const data = await response.json();
  return data;
}

async function updateCalendarSettings(settings: { syncEmail?: string | null; calendarId?: string }) {
  const response = await fetch("/api/admin/calendar-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Erreur de mise à jour");
  }
  return data;
}

async function logout() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  const data = await response.json();
  return data;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncEmail, setSyncEmail] = useState("");
  const [calendarId, setCalendarId] = useState("primary");

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });

  const settingsQuery = useQuery({
    queryKey: ["calendarSettings"],
    queryFn: fetchCalendarSettings,
    enabled: sessionQuery.data?.authenticated,
  });

  const bookingsQuery = useQuery({
    queryKey: ["adminBookings"],
    queryFn: fetchBookings,
    enabled: sessionQuery.data?.authenticated,
  });

  const updateMutation = useMutation({
    mutationFn: updateCalendarSettings,
    onSuccess: () => {
      toast({ title: "Paramètres sauvegardés" });
      queryClient.invalidateQueries({ queryKey: ["calendarSettings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  useEffect(() => {
    if (sessionQuery.data && !sessionQuery.data.authenticated) {
      setLocation("/login");
    }
  }, [sessionQuery.data, setLocation]);

  useEffect(() => {
    if (settingsQuery.data?.settings) {
      setSyncEmail(settingsQuery.data.settings.syncEmail || "");
      setCalendarId(settingsQuery.data.settings.calendarId || "primary");
    }
  }, [settingsQuery.data]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      syncEmail: syncEmail || null,
      calendarId,
    });
  };

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F3E8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2B5734]" />
      </div>
    );
  }

  if (!sessionQuery.data?.authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F3E8]">
      <header className="bg-[#1B1A18] text-[#F7F3E8] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-xl uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Administration Golf SIM
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-70">
              {sessionQuery.data?.admin?.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-[#F7F3E8] hover:text-white hover:bg-white/10"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6 space-y-8">
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-[#2B5734] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Mail className="w-5 h-5" />
              Paramètres du Calendrier
            </CardTitle>
            <CardDescription className="text-white/80">
              Configurez le courriel de synchronisation Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="syncEmail" className="uppercase text-xs font-bold tracking-wider text-foreground/70">
                  Courriel de synchronisation
                </Label>
                <Input
                  id="syncEmail"
                  type="email"
                  placeholder="exemple@gmail.com"
                  value={syncEmail}
                  onChange={(e) => setSyncEmail(e.target.value)}
                  className="h-12"
                  data-testid="input-sync-email"
                />
                <p className="text-sm text-muted-foreground">
                  Ce courriel sera utilisé pour la synchronisation avec Google Calendar.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calendarId" className="uppercase text-xs font-bold tracking-wider text-foreground/70">
                  ID du Calendrier
                </Label>
                <Input
                  id="calendarId"
                  type="text"
                  placeholder="primary"
                  value={calendarId}
                  onChange={(e) => setCalendarId(e.target.value)}
                  className="h-12"
                  data-testid="input-calendar-id"
                />
                <p className="text-sm text-muted-foreground">
                  Utilisez "primary" pour le calendrier principal ou entrez un ID spécifique.
                </p>
              </div>

              <Button
                type="submit"
                className="bg-[#2B5734] hover:bg-[#2B5734]/90 text-white font-bold uppercase tracking-wider"
                disabled={updateMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none">
          <CardHeader className="bg-[#1B1A18] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Calendar className="w-5 h-5" />
              Réservations
            </CardTitle>
            <CardDescription className="text-white/80">
              Liste des réservations enregistrées
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            {bookingsQuery.isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2B5734]" />
              </div>
            ) : bookingsQuery.data?.bookings?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucune réservation pour le moment.
              </div>
            ) : (
              <div className="divide-y">
                {bookingsQuery.data?.bookings?.map((booking: any) => (
                  <div key={booking.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-foreground">{booking.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#2B5734]">
                          {format(new Date(booking.date), "d MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.time} - {booking.duration}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Bay: {booking.bayType === "premium" ? "Premium" : "Standard"}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{booking.players} joueur(s)</span>
                      {booking.calendarEventId && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-[#2B5734]">Synchronisé</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
