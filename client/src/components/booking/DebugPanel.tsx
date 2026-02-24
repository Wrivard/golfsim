import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TimeSlot, Booking, BayEvaluation } from "@/lib/booking-types";
import { useBookingStore } from "@/lib/booking-store";

interface DebugPanelProps {
  slots: TimeSlot[];
  bookings: Booking[];
  hoveredSlot: TimeSlot | null;
  selectedDuration: number | null;
}

function BayTimeline({ bayId, bayName, bookings, hoveredSlot }: { 
  bayId: string; 
  bayName: string; 
  bookings: Booking[];
  hoveredSlot: TimeSlot | null;
}) {
  const bayBookings = bookings.filter(b => b.simulatorId === bayId);
  const HOURS_START = 8;
  const HOURS_END = 22;
  const TOTAL_MINUTES = (HOURS_END - HOURS_START) * 60;

  const getPosition = (timeStr: string) => {
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr;
    const [h, m] = timePart.split(':').map(Number);
    const minutes = (h - HOURS_START) * 60 + m;
    return Math.max(0, Math.min(100, (minutes / TOTAL_MINUTES) * 100));
  };

  const hoveredBayEval = hoveredSlot?.allBays?.find(b => b.bayId === bayId);
  const isHoveredBay = hoveredSlot?.assignedBayId === bayId;

  let hoveredBlock: { left: number; width: number } | null = null;
  if (hoveredSlot) {
    const store = useBookingStore.getState();
    const dur = store.selectedDuration || 60;
    const startTime = hoveredSlot.time;
    const left = getPosition(startTime);
    const widthMinutes = dur;
    const width = (widthMinutes / TOTAL_MINUTES) * 100;
    if (isHoveredBay) {
      hoveredBlock = { left, width };
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={cn(
          "font-bold text-sm",
          isHoveredBay ? "text-green-400" : "text-white"
        )}>{bayName}</span>
        <span className="text-[11px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
          {bayBookings.length} réservation{bayBookings.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="relative h-6 bg-gray-800 rounded overflow-hidden border border-gray-700">
        {bayBookings.map((booking, i) => {
          const left = getPosition(booking.startTime);
          const right = getPosition(booking.endTime);
          const width = right - left;
          return (
            <div
              key={i}
              className="absolute top-0 h-full bg-primary/80 rounded-sm"
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${booking.customerName}: ${booking.startTime.split('T')[1]?.substring(0,5)} - ${booking.endTime.split('T')[1]?.substring(0,5)}`}
            />
          );
        })}
        {hoveredBlock && (
          <div
            className="absolute top-0 h-full rounded-sm border-2 border-green-400 bg-green-400/20 animate-pulse"
            style={{ left: `${hoveredBlock.left}%`, width: `${hoveredBlock.width}%` }}
          />
        )}
        {hoveredBayEval && !hoveredBayEval.isValid && (
          <div className="absolute inset-0 bg-red-500/10 border border-red-500/30 rounded" />
        )}
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 px-0.5">
        <span>08:00</span>
        <span>22:00</span>
      </div>
    </div>
  );
}

function DetailedInspector({ slot }: { slot: TimeSlot | null }) {
  if (!slot) {
    return (
      <div className="border border-gray-700 rounded-lg p-4 text-center">
        <p className="text-gray-500 text-sm">
          Survolez un créneau horaire à gauche pour inspecter la logique de score détaillée.
        </p>
      </div>
    );
  }

  const timeLabel = slot.time.slice(11, 16);
  const bd = slot.breakdown;

  return (
    <div className="border border-gray-700 rounded-lg p-4 space-y-3 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <span className="text-green-400 font-bold text-sm font-mono">
          {timeLabel} → Baie {slot.assignedBayId}
        </span>
        <span className={cn(
          "text-xs font-bold px-2 py-0.5 rounded",
          slot.score >= 5 ? "bg-green-900/50 text-green-400 border border-green-700" :
          slot.score >= 3 ? "bg-yellow-900/50 text-yellow-400 border border-yellow-700" :
          "bg-gray-800 text-gray-400 border border-gray-700"
        )}>
          Score: {slot.score}
        </span>
      </div>

      {bd && (
        <div className="space-y-2">
          <ScoreRow label="Base" value={bd.base} />
          <ScoreRow label="Gap après (=0 → +5)" value={bd.gapAfter} positive />
          <ScoreRow label="Gap avant (=0 → +5)" value={bd.gapBefore} positive />
          <ScoreRow label="Fit parfait (avant+après=0)" value={bd.perfectFit} positive />
          <ScoreRow label="Clustering baie" value={bd.bayClustering} positive />
          <ScoreRow label="Heure de pointe (17-21h)" value={bd.peakHour} positive />
          <ScoreRow label="Gap inefficace (30-60m)" value={bd.inefficientGap} negative />
          <ScoreRow label="Espace ouvert (préserver)" value={bd.openStretchPenalty} negative />
          <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-bold">
            <span className="text-gray-400">Total</span>
            <span className="text-green-400">{bd.total}</span>
          </div>
        </div>
      )}

      {slot.allBays && (
        <div className="space-y-1.5 pt-2 border-t border-gray-700">
          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Détail par baie</span>
          {slot.allBays.map((bay: BayEvaluation) => (
            <div key={bay.bayId} className={cn(
              "flex items-center justify-between text-xs py-1 px-2 rounded",
              bay.bayId === slot.assignedBayId ? "bg-green-900/30 border border-green-800" : "",
              !bay.isValid ? "opacity-40" : ""
            )}>
              <span className={cn(
                bay.bayId === slot.assignedBayId ? "text-green-400 font-bold" : "text-gray-400"
              )}>
                {bay.bayName}
              </span>
              <div className="flex items-center gap-3">
                {bay.debug && (
                  <span className="text-gray-600 text-[10px]">
                    ↑{bay.debug.gapBefore === Infinity ? "∞" : bay.debug.gapBefore + "m"} 
                    ↓{bay.debug.gapAfter === Infinity ? "∞" : bay.debug.gapAfter + "m"}
                  </span>
                )}
                {bay.isValid ? (
                  <span className="text-green-400 font-mono font-bold">{bay.score}</span>
                ) : (
                  <span className="text-red-400 text-[10px] truncate max-w-[100px]">{bay.rejectionReason}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={cn(
        "font-mono font-bold",
        value > 0 && positive ? "text-green-400" : "",
        value < 0 && negative ? "text-red-400" : "",
        value === 0 ? "text-gray-600" : ""
      )}>
        {value > 0 ? "+" : ""}{value}
      </span>
    </div>
  );
}

export function DebugPanel({ slots, bookings, hoveredSlot, selectedDuration }: DebugPanelProps) {
  const { simulators, selectedDate } = useBookingStore();

  const sortedByTime = useMemo(() =>
    [...slots].sort((a, b) => a.time.localeCompare(b.time)),
    [slots]
  );

  const dateLabel = format(selectedDate, "d MMM", { locale: fr }).toUpperCase();

  return (
    <div className="bg-[#1a1f2e] text-gray-300 rounded-xl border border-gray-800 overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <h2 className="text-white font-heading font-bold text-lg uppercase tracking-wider">
          Débogage Système
        </h2>
        <p className="text-gray-500 text-xs mt-1">État du Moteur de Disponibilité</p>
        <p className="text-primary text-xs mt-0.5 font-medium">
          Mode horaire : {selectedDuration ? selectedDuration / 60 : "—"}h • {dateLabel}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Utilisation des Baies ({dateLabel})
            </span>
          </div>
          <div className="space-y-4">
            {simulators.map(sim => (
              <BayTimeline
                key={sim.id}
                bayId={sim.id}
                bayName={sim.name}
                bookings={bookings}
                hoveredSlot={hoveredSlot}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Inspecteur Détaillé
            </span>
          </div>
          <DetailedInspector slot={hoveredSlot} />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tableau des Candidats Bruts
            </span>
          </div>
          <div className="border border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[280px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[#1a1f2e]">
                  <tr className="text-gray-500 border-b border-gray-700">
                    <th className="text-left py-2 px-3 font-bold">Heure</th>
                    <th className="text-left py-2 px-3 font-bold">Baie</th>
                    <th className="text-right py-2 px-3 font-bold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByTime.map((slot, i) => {
                    const isHovered = hoveredSlot?.time === slot.time;
                    return (
                      <tr key={i} className={cn(
                        "border-b border-gray-800 transition-colors",
                        isHovered ? "bg-green-900/20 text-green-400" : "hover:bg-gray-800/50"
                      )}>
                        <td className="py-1.5 px-3 font-mono font-bold">
                          {slot.time.slice(11, 16)}
                        </td>
                        <td className="py-1.5 px-3">
                          Baie {slot.assignedBayId}
                        </td>
                        <td className={cn(
                          "py-1.5 px-3 text-right font-mono font-bold",
                          slot.score >= 5 ? "text-green-400" :
                          slot.score >= 3 ? "text-yellow-400" :
                          "text-gray-500"
                        )}>
                          {slot.score}
                        </td>
                      </tr>
                    );
                  })}
                  {sortedByTime.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-600">Aucun créneau</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-gray-800 text-center">
        <p className="text-[10px] text-gray-600">
          Gap=0 → +5 | PerfectFit → +3 | Cluster → +2 | Peak → +1 | Ineff. → -3 | OpenStretch → -4
        </p>
      </div>
    </div>
  );
}
