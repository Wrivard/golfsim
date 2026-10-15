import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
}
declare global { interface Window { turnstile?: TurnstileApi } }
let scriptPromise: Promise<TurnstileApi> | undefined;
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    document.getElementById("golf-turnstile")?.remove();
    const script = document.createElement("script");
    script.id = "golf-turnstile";
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.setAttribute("data-cookieconsent", "ignore");
    const fail = () => { clearTimeout(timeout); script.remove(); scriptPromise = undefined; reject(new Error("Turnstile unavailable")); };
    const timeout = setTimeout(fail, 12_000);
    script.onerror = fail;
    script.onload = () => {
      if (!window.turnstile) { fail(); return; }
      clearTimeout(timeout);
      resolve(window.turnstile);
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function TurnstileChallenge({ siteKey, binding, onToken }: {
  siteKey: string; binding: string; onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let stopped = false, widget: string | undefined, api: TurnstileApi | undefined;
    onToken(""); setError("");
    const failed = () => {
      if (!stopped) { onToken(""); setError("Vérification indisponible. Vérifiez votre connexion ou votre bloqueur de contenu, puis réessayez."); }
    };
    void loadTurnstile().then(loaded => {
      if (stopped || !container.current) return;
      api = loaded;
      widget = api.render(container.current, {
        sitekey: siteKey, action: "booking", cData: binding,
        theme: "light", language: "fr", size: container.current.clientWidth >= 300 ? "flexible" : "compact",
        "response-field": false, "refresh-expired": "auto",
        callback: (token: string) => { if (!stopped) { setError(""); onToken(token); } },
        "expired-callback": () => { if (!stopped) onToken(""); },
        "error-callback": () => { failed(); return true; },
        "timeout-callback": failed, "unsupported-callback": failed,
      });
    }).catch(failed);
    return () => { stopped = true; onToken(""); if (widget !== undefined) api?.remove(widget); };
  }, [siteKey, binding, retry, onToken]);
  return <div className="space-y-2 text-center" data-cookieconsent="ignore">
    <p className="text-xs text-muted-foreground">Vérification de sécurité anti-robot</p>
    <div ref={container} className="flex w-full justify-center" />
    {error && <div role="alert" className="text-sm text-destructive">
      <p>{error}</p>
      <Button type="button" variant="link" onClick={() => setRetry(value => value + 1)}>Réessayer la vérification anti-robot</Button>
    </div>}
  </div>;
}
