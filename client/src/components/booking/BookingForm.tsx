import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse courriel valide.",
  }),
  phone: z.string().optional(),
  date: z.date({
    required_error: "Une date est requise.",
  }),
  time: z.string({
    required_error: "Une heure est requise.",
  }),
  duration: z.string({
    required_error: "La durée est requise.",
  }),
  players: z.string({
    required_error: "Le nombre de joueurs est requis.",
  }),
  notes: z.string().optional(),
});

export default function BookingForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulate API call
    console.log("Booking Data:", values);
    
    // TODO: Backend integration
    // fetch('/api/book', { method: 'POST', body: JSON.stringify(values) })
    
    setTimeout(() => {
      setIsSubmitted(true);
      toast({
        title: "Réservation reçue",
        description: "Nous avons bien reçu votre demande. Un courriel de confirmation suivra sous peu.",
      });
    }, 1000);
  }

  if (isSubmitted) {
    return (
      <div className="bg-[#EAE6D9] p-8 md:p-12 rounded-lg text-center border border-foreground/10 shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-heading font-bold uppercase mb-4 text-foreground">Demande Envoyée !</h3>
        <p className="text-foreground/70 font-sans mb-8 text-lg max-w-md mx-auto">
          Merci de votre intérêt pour Golf SIM Sorel-Tracy. Notre équipe validera votre réservation et vous contactera très bientôt.
        </p>
        <Button 
          onClick={() => setIsSubmitted(false)} 
          variant="outline" 
          className="border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8 font-bold uppercase tracking-wider"
        >
          Nouvelle réservation
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white/50 backdrop-blur-sm p-8 md:p-10 rounded-xl border border-foreground/5 shadow-xl">
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Nom complet <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Jean Dupont" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Courriel <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="jean@exemple.com" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="(450) 123-4567" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Players */}
          <FormField
            control={form.control}
            name="players"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Joueurs <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 Joueur</SelectItem>
                    <SelectItem value="2">2 Joueurs</SelectItem>
                    <SelectItem value="3">3 Joueurs</SelectItem>
                    <SelectItem value="4">4 Joueurs</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            {/* Date */}
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2">Date <span className="text-red-500">*</span></FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "h-12 w-full pl-3 text-left font-normal bg-background/80 border-foreground/20 hover:bg-background hover:text-primary",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "PPP", { locale: fr })
                        ) : (
                            <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        className="bg-background border border-foreground/10 rounded-md shadow-xl"
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Time */}
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Heure <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                        <SelectValue placeholder="Heure de départ" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="10:00">10:00</SelectItem>
                    <SelectItem value="11:00">11:00</SelectItem>
                    <SelectItem value="12:00">12:00</SelectItem>
                    <SelectItem value="13:00">13:00</SelectItem>
                    <SelectItem value="14:00">14:00</SelectItem>
                    <SelectItem value="15:00">15:00</SelectItem>
                    <SelectItem value="16:00">16:00</SelectItem>
                    <SelectItem value="17:00">17:00</SelectItem>
                    <SelectItem value="18:00">18:00</SelectItem>
                    <SelectItem value="19:00">19:00</SelectItem>
                    <SelectItem value="20:00">20:00</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Duration */}
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Durée <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                        <SelectValue placeholder="Bloc de jeu" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="4h">4 Heures (Standard)</SelectItem>
                    <SelectItem value="8h">8 Heures (Double)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Remarques</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Demandes spéciales, gaucher/droitier, etc." 
                  className="bg-background/80 border-foreground/20 focus:border-primary min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-14 bg-primary text-white hover:bg-primary/90 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg transition-all hover:scale-[1.01]">
          Réserver Maintenant
        </Button>
      </form>
    </Form>
  );
}
