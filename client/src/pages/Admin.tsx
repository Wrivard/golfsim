import { useEffect, useState, useMemo } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, LogOut, Calendar, Save, CheckCircle2, XCircle, Unlink, Trash2, Users, DollarSign, CalendarDays, TrendingUp, ExternalLink, Search, Filter, RefreshCw, ChevronDown, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import logo from "@assets/713ff390-44c3-4643-aade-0154b9a25262.jfif_1764347062569.png";

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

async function fetchSchedule() {
  const response = await fetch("/api/schedule");
  const data = await response.json();
  if (!data.ok) throw new Error("Erreur");
  return data.schedule;
}

async function updateScheduleDay(dayOfWeek: number, schedule: { openHour: number; openMinute: number; lastBookingHour: number; lastBookingMinute: number; closeHour: number; closeMinute: number }) {
  const response = await fetch(`/api/admin/schedule/${dayOfWeek}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schedule),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || "Erreur");
  return data.schedule;
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

const PRICE_PER_HOUR = 25;

function getBookingDateTime(booking: any): Date {
  try {
    const dateString = typeof booking.date === 'string' ? booking.date : new Date(booking.date).toISOString();
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (booking.time || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch {
    return new Date(booking.date);
  }
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calendarId, setCalendarId] = useState("primary");
  const [isConnecting, setIsConnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBay, setFilterBay] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [debugMode, setDebugMode] = useState(false);
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Record<number, { openHour: number; openMinute: number; lastBookingHour: number; lastBookingMinute: number; closeHour: number; closeMinute: number }>>({});

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

  const scheduleQuery = useQuery({
    queryKey: ["operatingSchedule"],
    queryFn: fetchSchedule,
    enabled: sessionQuery.data?.authenticated,
  });

  useEffect(() => {
    if (scheduleQuery.data) {
      const map: Record<number, { openHour: number; openMinute: number; lastBookingHour: number; lastBookingMinute: number; closeHour: number; closeMinute: number }> = {};
      for (const s of scheduleQuery.data) {
        map[s.dayOfWeek] = {
          openHour: s.openHour,
          openMinute: s.openMinute,
          lastBookingHour: s.lastBookingHour,
          lastBookingMinute: s.lastBookingMinute,
          closeHour: s.closeHour,
          closeMinute: s.closeMinute,
        };
      }
      setEditingSchedule(map);
    }
  }, [scheduleQuery.data]);

  const scheduleMutation = useMutation({
    mutationFn: ({ dayOfWeek, schedule }: { dayOfWeek: number; schedule: { openHour: number; openMinute: number; lastBookingHour: number; lastBookingMinute: number; closeHour: number; closeMinute: number } }) =>
      updateScheduleDay(dayOfWeek, schedule),
    onSuccess: () => {
      toast({ title: "Horaire mis à jour" });
      queryClient.invalidateQueries({ queryKey: ["operatingSchedule"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
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

  const calendarSyncMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/calendar/sync", { method: "POST" });
      if (response.status === 401) throw new Error("Non autorisé");
      const data = await response.json();
      if (!data.ok) throw new Error(data.message);
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        title: "Synchronisation terminée", 
        description: `${data.imported} importée(s), ${data.skipped} ignorée(s)${data.errors > 0 ? `, ${data.errors} erreur(s)` : ''}` 
      });
      queryClient.invalidateQueries({ queryKey: ["adminBookings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erreur de synchronisation", description: error.message, variant: "destructive" });
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
      setDebugMode(settingsQuery.data.settings.debugMode ?? false);
    }
  }, [settingsQuery.data]);

  const debugModeMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch("/api/admin/debug-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debugMode: enabled }),
      });
      if (!response.ok) throw new Error("Erreur");
      return response.json();
    },
    onSuccess: (_data, enabled) => {
      toast({ title: enabled ? "Mode debug activé" : "Mode debug désactivé" });
      queryClient.invalidateQueries({ queryKey: ["calendarSettings"] });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
      setDebugMode(!debugMode);
    },
  });

  const handleDebugToggle = () => {
    const newValue = !debugMode;
    setDebugMode(newValue);
    debugModeMutation.mutate(newValue);
  };

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

  const allBookings = bookingsQuery.data?.bookings || [];
  
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = allBookings.filter((b: any) => {
      try {
        const bookingDateTime = getBookingDateTime(b);
        return isAfter(bookingDateTime, now);
      } catch {
        return false;
      }
    });
    
    const totalHours = allBookings.reduce((acc: number, b: any) => {
      const hours = parseFloat(b.duration?.replace('h', '') || '0');
      return acc + hours;
    }, 0);
    
    const estimatedRevenue = totalHours * PRICE_PER_HOUR;
    
    return {
      total: allBookings.length,
      upcoming: upcoming.length,
      totalHours,
      estimatedRevenue,
    };
  }, [allBookings]);
  
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return allBookings.filter((booking: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = booking.name?.toLowerCase().includes(query);
        const matchesEmail = booking.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }
      
      if (filterBay !== "all" && booking.bayType !== filterBay) {
        return false;
      }
      
      if (filterPeriod !== "all") {
        const bookingDateTime = getBookingDateTime(booking);
        
        if (filterPeriod === "upcoming" && !isAfter(bookingDateTime, now)) return false;
        if (filterPeriod === "past" && isAfter(bookingDateTime, now)) return false;
      }
      
      return true;
    });
  }, [allBookings, searchQuery, filterBay, filterPeriod]);

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
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 filter invert brightness-0 saturate-100">
              <img src={logo} alt="Golf SIM" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-heading text-lg md:text-xl uppercase tracking-wider">
                Panneau d'administration
              </h1>
              <p className="text-xs text-white/60 hidden sm:block">Golf SIM Sorel-Tracy</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <Link href="/" className="text-xs md:text-sm text-white/70 hover:text-white flex items-center gap-1 transition-colors">
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Voir le site</span>
            </Link>
            <Separator orientation="vertical" className="h-4 bg-white/20 hidden sm:block" />
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
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-md border-none bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#2B5734]/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-[#2B5734]" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{stats.total}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Réservations totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{stats.upcoming}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">À venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{stats.totalHours}h</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Heures réservées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md border-none bg-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-heading font-bold text-foreground">{stats.estimatedRevenue}$</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">Revenus estimés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
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
            <div className="p-4 border-b bg-gray-50/50">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou courriel..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                    data-testid="input-search"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterBay} onValueChange={setFilterBay}>
                    <SelectTrigger className="w-[130px] h-10" data-testid="select-filter-bay">
                      <SelectValue placeholder="Baie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les baies</SelectItem>
                      <SelectItem value="1">Baie 1</SelectItem>
                      <SelectItem value="2">Baie 2</SelectItem>
                      <SelectItem value="3">Baie 3</SelectItem>
                      <SelectItem value="4">Baie 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[130px] h-10" data-testid="select-filter-period">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="upcoming">À venir</SelectItem>
                      <SelectItem value="past">Passées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchQuery || filterBay !== "all" || filterPeriod !== "all") && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>{filteredBookings.length} résultat(s) sur {allBookings.length}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterBay("all");
                      setFilterPeriod("all");
                    }}
                  >
                    Effacer les filtres
                  </Button>
                </div>
              )}
            </div>
            {bookingsQuery.isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2B5734]" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucune réservation pour le moment.
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredBookings.map((booking: any) => (
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
                            {(() => {
                              const d = typeof booking.date === 'string' ? booking.date : new Date(booking.date).toISOString();
                              const [y, mo, dy] = d.split('T')[0].split('-').map(Number);
                              return format(new Date(y, mo - 1, dy), "d MMM yyyy", { locale: fr });
                            })()}
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
                                La réservation de {booking.name} pour le {(() => {
                                  const d = typeof booking.date === 'string' ? booking.date : new Date(booking.date).toISOString();
                                  const [y, mo, dy] = d.split('T')[0].split('-').map(Number);
                                  return format(new Date(y, mo - 1, dy), "d MMMM yyyy", { locale: fr });
                                })()} à {booking.time} sera supprimée définitivement.
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

        <Card className="shadow-lg border-none" data-testid="card-calendar-template">
          <CardHeader className="bg-[#4285F4] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Calendar className="w-5 h-5" />
              Ajouter une réservation via Google Calendar
            </CardTitle>
            <CardDescription className="text-white/80">
              Format à suivre pour créer un événement dans Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 bg-white">
            <p className="text-sm text-gray-700 mb-4">
              Créez un événement dans Google Calendar avec le format suivant pour qu'il soit synchronisé automatiquement :
            </p>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 font-mono text-sm space-y-3">
              <div>
                <span className="text-blue-600 font-bold">Titre :</span>
                <span className="ml-2 text-gray-800">Golf SIM - Nom du client - Baie 2</span>
              </div>
              <div className="border-t border-blue-100 pt-3">
                <span className="text-blue-600 font-bold">Heure de début :</span>
                <span className="ml-2 text-gray-800">14:00</span>
              </div>
              <div className="border-t border-blue-100 pt-3">
                <span className="text-blue-600 font-bold">Heure de fin :</span>
                <span className="ml-2 text-gray-800">17:00</span>
                <span className="ml-2 text-gray-500 italic">(= 3h de réservation)</span>
              </div>
              <div className="border-t border-blue-100 pt-3">
                <span className="text-blue-600 font-bold">Description (optionnel) :</span>
                <pre className="mt-1 text-gray-800 whitespace-pre-wrap">{`Courriel: client@email.com\nTéléphone: 450-555-1234\nJoueurs: 3`}</pre>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <p className="text-xs text-gray-600"><strong>Important :</strong> Le titre doit contenir « Golf SIM » pour être détecté.</p>
              <p className="text-xs text-gray-600">Baie valide : Baie 1, Baie 2, Baie 3 ou Baie 4 (par défaut Baie 1 si absent).</p>
              <p className="text-xs text-gray-600">La synchronisation se fait en temps réel ou aux 5 minutes.</p>
            </div>
          </CardContent>
        </Card>

        <div className="border border-foreground/10 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowAdminSection(!showAdminSection)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            data-testid="button-toggle-admin-section"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="font-heading font-bold text-sm uppercase tracking-wider text-muted-foreground">Administration</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdminSection ? "rotate-180" : ""}`} />
          </button>

          {showAdminSection && (
            <div className="space-y-6 p-4 md:p-6 bg-gray-50/50">

        <Card className="shadow-lg border-none">
          <CardHeader className="bg-[#2B5734] text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 font-heading uppercase tracking-wider">
              <Clock className="w-5 h-5" />
              Horaire d'ouverture
            </CardTitle>
            <CardDescription className="text-white/80">
              Gérez les heures d'ouverture et de fermeture pour chaque jour
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 bg-white">
            {scheduleQuery.isLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Jour</th>
                      <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Ouverture</th>
                      <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Dern. réservation</th>
                      <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Fermeture</th>
                      <th className="py-2 px-2 font-bold text-xs uppercase tracking-wider text-muted-foreground">Max durée</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { day: 0, name: "Dimanche" },
                      { day: 1, name: "Lundi" },
                      { day: 2, name: "Mardi" },
                      { day: 3, name: "Mercredi" },
                      { day: 4, name: "Jeudi" },
                      { day: 5, name: "Vendredi" },
                      { day: 6, name: "Samedi" },
                    ].map(({ day, name }) => {
                      const sched = editingSchedule[day];
                      if (!sched) return null;
                      const closeMinutes = (sched.closeHour * 60 + sched.closeMinute) - (sched.lastBookingHour * 60 + sched.lastBookingMinute);
                      const maxDurationH = Math.floor(closeMinutes / 60);
                      const maxDurationM = closeMinutes % 60;
                      const maxDurationLabel = maxDurationM > 0 ? `${maxDurationH}h${maxDurationM}` : `${maxDurationH}h`;
                      
                      const formatCloseDisplay = (h: number, m: number) => {
                        if (h >= 24) return `${String(h - 24).padStart(2, '0')}:${String(m).padStart(2, '0')} (+1j)`;
                        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                      };

                      return (
                        <tr key={day} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{name}</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={sched.openHour}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], openHour: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-open-hour-${day}`}
                              >
                                {Array.from({ length: 24 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span>:</span>
                              <select
                                value={sched.openMinute}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], openMinute: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-open-minute-${day}`}
                              >
                                <option value={0}>00</option>
                                <option value={30}>30</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={sched.lastBookingHour}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], lastBookingHour: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-lastbooking-hour-${day}`}
                              >
                                {Array.from({ length: 24 }, (_, i) => (
                                  <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <span>:</span>
                              <select
                                value={sched.lastBookingMinute}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], lastBookingMinute: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-lastbooking-minute-${day}`}
                              >
                                <option value={0}>00</option>
                                <option value={30}>30</option>
                              </select>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <select
                                value={sched.closeHour}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], closeHour: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-close-hour-${day}`}
                              >
                                {Array.from({ length: 26 }, (_, i) => (
                                  <option key={i} value={i}>
                                    {i >= 24 ? `${String(i - 24).padStart(2, '0')} (+1j)` : String(i).padStart(2, '0')}
                                  </option>
                                ))}
                              </select>
                              <span>:</span>
                              <select
                                value={sched.closeMinute}
                                onChange={(e) => setEditingSchedule(prev => ({ ...prev, [day]: { ...prev[day], closeMinute: parseInt(e.target.value) } }))}
                                className="border rounded px-1.5 py-1 text-sm w-16"
                                data-testid={`select-close-minute-${day}`}
                              >
                                <option value={0}>00</option>
                                <option value={30}>30</option>
                              </select>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 block">
                              {formatCloseDisplay(sched.closeHour, sched.closeMinute)}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                              {maxDurationLabel}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => scheduleMutation.mutate({ dayOfWeek: day, schedule: sched })}
                              disabled={scheduleMutation.isPending}
                              className="h-8 px-3 text-xs"
                              data-testid={`button-save-schedule-${day}`}
                            >
                              {scheduleMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Les changements prennent effet immédiatement sur la page de réservation.
            </p>
          </CardContent>
        </Card>

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

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => calendarSyncMutation.mutate()}
                    disabled={calendarSyncMutation.isPending}
                    className="border-primary text-primary hover:bg-primary/10 w-full sm:w-auto"
                    data-testid="button-sync-calendar"
                  >
                    {calendarSyncMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Synchroniser depuis le calendrier
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleConnectGoogle}
                    disabled={isConnecting}
                    className="border-[#4285F4] text-[#4285F4] hover:bg-[#4285F4]/10 w-full sm:w-auto"
                    data-testid="button-change-google"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="currentColor">
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
                    className="border-red-300 text-red-600 hover:bg-red-50 w-full sm:w-auto"
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
              <Settings className="w-5 h-5" />
              Outils
            </CardTitle>
            <CardDescription className="text-white/80">
              Paramètres de développement
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Mode debug (page réservation)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Affiche le bouton debug et le panneau d'analyse des créneaux sur la page de réservation
                </p>
              </div>
              <button
                onClick={handleDebugToggle}
                disabled={debugModeMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  debugMode ? "bg-[#2B5734]" : "bg-gray-300"
                }`}
                data-testid="toggle-debug-mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    debugMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
