export async function staffLogin(
  credentials: { username: string; password: string },
  fetcher: typeof fetch = fetch,
) {
  let response: Response;
  try {
    response = await fetcher(`${import.meta.env?.BASE_URL ?? "/"}api/auth/login`, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error("Connexion impossible. Vérifiez votre connexion Internet et réessayez.");
  }
  if (response.status === 401) throw new Error("Identifiants invalides.");
  if (response.status === 429) throw new Error("Trop de tentatives. Veuillez réessayer dans 15 minutes.");
  if (response.status === 403) throw new Error("Connexion refusée. Ouvrez le site à son adresse officielle et réessayez.");
  const unavailable = "Service temporairement indisponible. Réessayez plus tard ou prévenez le responsable.";
  if (!response.ok) throw new Error(unavailable);
  let data: unknown;
  try { data = await response.json(); } catch { throw new Error(unavailable); }
  if (!data || typeof data !== "object" || !("ok" in data) || data.ok !== true) throw new Error(unavailable);
  return data;
}
