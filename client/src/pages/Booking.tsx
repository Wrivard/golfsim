import Layout from "@/components/layout/Layout";
import BookingForm from "@/components/booking/BookingForm";
import headerBg from "@assets/stock_images/golf_ball_on_tee_ind_0117f1a4.jpg";

export default function BookingPage() {
  return (
    <Layout>
      {/* Header */}
      <div className="relative pt-32 pb-24 border-b border-foreground/5">
        <div className="absolute inset-0 z-0">
            <img src={headerBg} alt="Golf Tee" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 z-10" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-white text-sm font-bold tracking-widest uppercase mb-4 block animate-in fade-in-50 duration-700">Golf SIM Sorel-Tracy</span>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-white uppercase tracking-tighter leading-none animate-in slide-in-from-bottom-5 duration-700">
            Réserver un <span className="text-primary">Bay</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed font-sans animate-in slide-in-from-bottom-5 duration-700 delay-100">
            Sélectionnez votre date et heure pour profiter de l'expérience de golf ultime.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
             <h2 className="text-3xl font-heading font-bold uppercase mb-4">Détails de la réservation</h2>
             <p className="text-muted-foreground font-sans">
               Remplissez le formulaire ci-dessous pour bloquer votre simulateur.
             </p>
          </div>
          
          <BookingForm />

          <div className="mt-12 text-center text-sm text-muted-foreground font-sans max-w-2xl mx-auto">
            <p className="mb-2">
              <span className="font-bold text-foreground">Note :</span> Le paiement s'effectue sur place.
            </p>
            <p>
              Pour les annulations, veuillez nous contacter au moins 24 heures à l'avance. 
              Les réservations de groupe (plus de 8 personnes) doivent se faire par téléphone.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
