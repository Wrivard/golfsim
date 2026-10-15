import { useCallback, useEffect, useRef, useState } from "react";

export function useBookingProtection(confirmed: boolean) {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    clearTimeout(timer.current);
    const request = new AbortController();
    controller.current = request;
    setToken(""); setReady(false); setError("");
    try {
      const response = await fetch("/api/booking/protection", { cache: "no-store", signal: request.signal });
      const result = await response.json();
      if (!response.ok || !result.ok || typeof result.token !== "string") {
        throw new Error(result.message || "Vérification indisponible. Veuillez réessayer.");
      }
      if (request.signal.aborted) return;
      setToken(result.token);
      timer.current = setTimeout(() => setReady(true), Math.max(2_000, Number(result.waitMs) || 0) + 250);
    } catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error && !(err instanceof TypeError) && !(err instanceof SyntaxError)
        ? err.message : "Vérification indisponible. Vérifiez votre connexion puis réessayez.");
    }
  }, []);
  useEffect(() => {
    if (!confirmed) void refresh();
    return () => { controller.current?.abort(); clearTimeout(timer.current); };
  }, [confirmed, refresh]);
  return { token, ready, error, refresh };
}

export type BookingProtection = ReturnType<typeof useBookingProtection>;
