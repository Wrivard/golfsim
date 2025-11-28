import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, LogOut, Calendar, Save, CheckCircle2, XCircle, Unlink, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

async function fetchCalendarConnection() {
  const response = await fetch("/api/admin/calendar-connection");
  if (response.status === 401) {
    throw new Error("Non autorisé");
  }
  const data = await response.json();
  return data;
}

async function fetchCalendars() {
  const response = await fetch("/api/admin/calendars");
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

async function getGoogleAuthUrl() {
  const response = await fetch("/api/admin/oauth/google/url");
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Erreur lors de la génération de l'URL");
  }
  return data.authUrl;
}

async function revokeGoogleAccess() {
  const response = await fetch("/api/admin/oauth/google/revoke", { method: "POST" });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Erreur lors de la déconnexion");
  }
  return data;
}

async function deleteBooking(id: string) {
  const response = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || "Erreur lors de la suppression");
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
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calendarId, setCalendarId] = useState("primary");
  const [isConnecting, setIsConnecting] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
  });

  const settingsQuery = useQuery({
    queryKey: ["calendarSettings"],
    queryFn: fetchCalendarSettings,
    enabled: sessionQuery.data?.authenticated,
  });

  const connectionQuery = useQuery({
    queryKey: ["calendarConnection"],
    queryFn: fetchCalendarConnection,
    enabled: sessionQuery.data?.authenticated,
    refetchInterval: 30000,
  });

  const calendarsQuery = useQuery({
    queryKey: ["calendars"],
    queryFn: fetchCalendars,
    enabled: sessionQuery.data?.authenticated && connectionQuery.data?.connected,
  });

  const bookingsQuery = useQuery({
    queryKey: ["adminBookings"],
    queryFn: fetchBookings,
    enabled: sessionQuery.data?.authenticated,
  });

  const updateMutation = useMutation({
    mutationFn: updateCalendarSettings,
    onSuccess: () => {
      toast({ title: "Calendrier sélectionné avec succès" });
      queryClient.invalidateQueries({ queryKey: ["calendarSettings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: revokeGoogleAccess,
    onSuccess: () => {
      toast({ title: "Compte Google déconnecté" });
      queryClient.invalidateQueries({ queryKey: ["calendarConnection"] });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
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

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      toast({ title: "Réservation supprimée avec succès" });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const oauth = params.get("oauth");
    const email = params.get("email");
    const message = params.get("message");

    if (oauth === "success") {
      toast({
        title: "Connexion réussie",
        description: email ? `Connecté avec ${email}` : "Compte Google connecté",
      });
      queryClient.invalidateQueries({ queryKey: ["calendarConnection"] });
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
      window.history.replaceState({}, "", "/admin");
    } else if (oauth === "error") {
      toast({
        title: "Erreur de connexion",
        description: message || "Une erreur s'est produite lors de la connexion",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/admin");
    }
  }, [searchString, toast, queryClient]);

  useEffect(() => {
    if (sessionQuery.data && !sessionQuery.data.authenticated) {
      setLocation("/login");
    }
  }, [sessionQuery.data, setLocation]);

  useEffect(() => {
    if (settingsQuery.data?.settings) {
      setCalendarId(settingsQuery.data.settings.calendarId || "primary");
    }
  }, [settingsQuery.data]);

  const handleConnectGoogle = async () => {
    try {
      setIsConnecting(true);
      const authUrl = await getGoogleAuthUrl();
      window.location.href = authUrl;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de se connecter à Google",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleCalendarChange = (newCalendarId: string) => {
    setCalendarId(newCalendarId);
    updateMutation.mutate({ calendarId: newCalendarId });
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

  const isConfigured = connectionQuery.data?.configured !== false;
  const isConnected = connectionQuery.data?.connected;
  const calendars = calendarsQuery.data?.calendars || [];

  return (
    <div className="min-h-screen bg-[#F7F3E8]">
      <header className="bg-[#1B1A18] text-[#F7F3E8] py-4 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <h1 className="font-heading text-base md:text-xl uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
            <span className="truncate">Administration Golf SIM</span>
          </h1>
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs md:text-sm opacity-70 truncate">
              {sessionQuery.data?.admin?.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-[#F7F3E8] hover:text-white hover:bg-white/10 shrink-0"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6 md:space-y-8">
        
        <Card className="shadow-lg border-none">
          <CardHeader className="bg-[#4285F4] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connexion Google Calendar
            </CardTitle>
            <CardDescription className="text-white/80">
              Synchronisez automatiquement les réservations avec Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            {connectionQuery.isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Vérification de la connexion...
              </div>
            ) : !isConfigured ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <XCircle className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="font-bold text-amber-800">Configuration requise</p>
                    <p className="text-amber-700 text-sm">Les identifiants Google OAuth ne sont pas configurés.</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pour activer la synchronisation Google Calendar, vous devez configurer les variables d'environnement <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_ID</code> et <code className="bg-gray-100 px-1 rounded">GOOGLE_CLIENT_SECRET</code>.
                </p>
              </div>
            ) : isConnected ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold text-green-800">Connecté</p>
                    <p className="text-green-700">{connectionQuery.data.email || "Compte Google"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="uppercase text-xs font-bold tracking-wider text-foreground/70">
                    Calendrier de synchronisation
                  </Label>
                  {calendarsQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des calendriers...
                    </div>
                  ) : calendars.length > 0 ? (
                    <Select value={calendarId} onValueChange={handleCalendarChange} disabled={updateMutation.isPending}>
                      <SelectTrigger className="w-full h-12" data-testid="select-calendar">
                        <SelectValue placeholder="Sélectionnez un calendrier" />
                      </SelectTrigger>
                      <SelectContent>
                        {calendars.map((cal: { id: string; summary: string; primary?: boolean }) => (
                          <SelectItem key={cal.id} value={cal.id} data-testid={`calendar-option-${cal.id}`}>
                            {cal.summary} {cal.primary && <span className="text-muted-foreground">(Principal)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun calendrier disponible</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Les réservations seront automatiquement ajoutées à ce calendrier.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                    className="border-[#4285F4] text-[#4285F4] hover:bg-[#4285F4]/10"
                    data-testid="button-change-google"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    )}
                    Changer de compte
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => revokeMutation.mutate()}
                    disabled={revokeMutation.isPending}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    data-testid="button-disconnect-google"
                  >
                    {revokeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4 mr-2" />
                    )}
                    Déconnecter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <XCircle className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-bold text-gray-800">Non connecté</p>
                    <p className="text-gray-600">Aucun compte Google n'est lié</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connectez un compte Google pour synchroniser automatiquement les réservations avec Google Calendar.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                    className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white"
                    data-testid="button-connect-google"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
                      </svg>
                    )}
                    Se connecter avec Google
                  </Button>
                </div>
              </div>
            )}
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
                  <div key={booking.id} className="p-3 md:p-4 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{booking.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{booking.email}</p>
                        {booking.phone && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{booking.phone}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-[#2B5734] text-sm md:text-base">
                            {format(new Date(booking.date), "d MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {booking.time} - {booking.duration}
                          </p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              data-testid={`button-delete-${booking.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette réservation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La réservation de {booking.name} pour le {format(new Date(booking.date), "d MMMM yyyy", { locale: fr })} à {booking.time} sera supprimée définitivement.
                                {booking.calendarEventId && " L'événement sera également retiré du calendrier Google."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(booking.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : null}
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Baie {booking.bayType}</span>
                      <Separator orientation="vertical" className="h-4" />
                      <span>{booking.players} joueur(s)</span>
                      {booking.calendarEventId && (
                        <>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-[#2B5734] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Synchronisé
                          </span>
                        </>
                      )}
                    </div>
                    {booking.notes && (
                      <p className="mt-2 text-xs text-muted-foreground italic">Note: {booking.notes}</p>
                    )}
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
