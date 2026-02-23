import Layout from "@/components/layout/Layout";
import { BookingLayout } from "@/components/booking/BookingLayout";
import { StepDuration } from "@/components/booking/StepDuration";
import { StepTime } from "@/components/booking/StepTime";
import { StepDetails } from "@/components/booking/StepDetails";
import { StepConfirmation } from "@/components/booking/StepConfirmation";
import { useBookingStore } from "@/lib/booking-store";
import headerBg from "@assets/stock_images/golf_ball_on_tee_ind_0117f1a4.jpg";

const stepTitles: Record<number, string> = {
  1: "Choisissez votre durée",
  2: "Sélectionnez un créneau",
  3: "Vos coordonnées",
  4: "Confirmation",
};

export default function BookingPage() {
  const step = useBookingStore((s) => s.step);
  const isConfirmed = useBookingStore((s) => s.isConfirmed);

  return (
    <Layout>
      <div className="relative pt-32 pb-24 border-b border-foreground/5">
        <div className="absolute inset-0 z-0">
          <img src={headerBg} alt="Golf Tee" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 z-10" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-white text-sm font-bold tracking-widest uppercase mb-4 block animate-in fade-in-50 duration-700">Golf SIM Sorel-Tracy</span>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 text-white uppercase tracking-tighter leading-none animate-in slide-in-from-bottom-5 duration-700">
            Réserver un <span className="text-primary">Bay</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-sans animate-in slide-in-from-bottom-5 duration-700 delay-100">
            Sélectionnez votre date et heure pour profiter de l'expérience de golf ultime.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <BookingLayout 
          step={step} 
          title={isConfirmed ? undefined : stepTitles[step]}
        >
          {step === 1 && <StepDuration />}
          {step === 2 && <StepTime />}
          {step === 3 && <StepDetails />}
          {step === 4 && <StepConfirmation />}
        </BookingLayout>

        <div className="mt-12 text-center text-sm text-muted-foreground font-sans max-w-2xl mx-auto">
          <p className="mb-2">
            <span className="font-bold text-foreground">Note :</span> Le paiement s'effectue sur place. Tarif : 30$/heure.
          </p>
          <p>
            Pour les annulations, veuillez nous contacter au moins 24 heures à l'avance. 
            Les réservations de groupe (plus de 8 personnes) doivent se faire par téléphone.
          </p>
        </div>
      </div>
    </Layout>
  );
}
