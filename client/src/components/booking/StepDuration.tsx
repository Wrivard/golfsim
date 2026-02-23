import { useBookingStore } from "@/lib/booking-store";
import { Clock } from "lucide-react";

export function StepDuration() {
  const { setDuration, setStep } = useBookingStore();

  const durations = [
    { value: 60, label: "1 Heure", price: "30$" },
    { value: 90, label: "1h30", price: "45$" },
    { value: 120, label: "2 Heures", price: "60$" },
    { value: 150, label: "2h30", price: "75$" },
    { value: 180, label: "3 Heures", price: "90$" },
    { value: 210, label: "3h30", price: "105$" },
    { value: 240, label: "4 Heures", price: "120$" },
    { value: 300, label: "5 Heures", price: "150$" },
  ];

  const handleSelect = (minutes: number) => {
    setDuration(minutes);
    setStep(2);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-muted-foreground text-center mb-8">
        Choisissez la durée de votre session de golf simulé. Tarif : 30$/heure.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {durations.map((d) => (
          <button
            key={d.value}
            onClick={() => handleSelect(d.value)}
            className="group relative flex flex-col items-center justify-center p-6 rounded-lg border border-foreground/10 bg-background hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            data-testid={`duration-${d.value}`}
          >
            <div className="mb-2 text-primary/80 group-hover:text-primary transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
              {d.label}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {d.price}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
