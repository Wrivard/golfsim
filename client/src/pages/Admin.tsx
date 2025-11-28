import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, LogOut, Calendar, Save, CheckCircle2, XCircle, Unlink } from "lucide-react";
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

  const revokeMutation = useMutation({
    mutationFn: revokeGoogleAccess,
    onSuccess: () => {
      toast({ title: "Compte Google déconnecté" });
      queryClient.invalidateQueries({ queryKey: ["calendarConnection"] });
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

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
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

  const isConfigured = connectionQuery.data?.configured !== false;
  const isConnected = connectionQuery.data?.connected;

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
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-bold text-green-800">Connecté</p>
                    <p className="text-green-700">{connectionQuery.data.email || "Compte Google"}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Les réservations seront automatiquement ajoutées au calendrier de ce compte.
                </p>
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
          <CardHeader className="bg-[#2B5734] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Calendar className="w-5 h-5" />
              Paramètres du Calendrier
            </CardTitle>
            <CardDescription className="text-white/80">
              Configuration avancée (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSaveSettings} className="space-y-6">
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
                          <span className="text-[#2B5734] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Synchronisé
                          </span>
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
