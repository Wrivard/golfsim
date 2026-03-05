import { useBookingStore } from "@/lib/booking-store";
import { Clock } from "lucide-react";

export function StepDuration() {
  const { setDuration, setStep } = useBookingStore();

  const durations = [
    { value: 60, label: "1 Heure", sub: "25$ / heure", badge: "Pratique" },
    { value: 120, label: "2 Heures", sub: "28$ / heure", badge: null },
    { value: 180, label: "3 Heures", sub: "28$ / heure", badge: null },
    { value: 240, label: "4 Heures", sub: "28$ / heure", badge: null },
  ];

  const handleSelect = (minutes: number) => {
    setDuration(minutes);
    setStep(2);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-muted-foreground text-center mb-8">
        Les offres s'appliquent automatiquement à la réservation.
      </p>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        {durations.map((d) => (
          <button
            key={d.value}
            onClick={() => handleSelect(d.value)}
            className="group relative flex flex-col items-center justify-center py-8 px-6 rounded-xl border-2 border-foreground/10 bg-white hover:border-primary hover:shadow-lg active:scale-[0.98] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-testid={`duration-${d.value}`}
          >
            {d.badge && (
              <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {d.badge}
              </span>
            )}
            <div className="mb-3 text-primary/70 group-hover:text-primary transition-colors">
              <Clock className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
              {d.label}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {d.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
