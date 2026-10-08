import { ReactNode } from "react";

interface BookingLayoutProps {
  children: ReactNode;
  title?: string;
  step: number;
  totalSteps?: number;
}

export function BookingLayout({ children, title, step, totalSteps = 4 }: BookingLayoutProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-foreground/10 rounded-xl shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-foreground/5">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        <div className="p-6 md:p-10">
          {title && (
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-8 text-foreground tracking-tight uppercase">
              {title}
            </h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
