import { useEffect } from "react";

interface PageMetaOptions {
  title: string;
  description?: string;
}

const PAGE_META: Record<string, PageMetaOptions> = {
  "/": {
    title: "Golf SIM Sorel-Tracy | Simulateur de Golf Intérieur Haut de Gamme",
    description:
      "Découvrez Golf SIM Sorel-Tracy : 4 simulateurs de golf intérieur haut de gamme, ambiance lounge, bar et événements. Réservez votre session dès maintenant.",
  },
  "/about": {
    title: "À propos | Golf SIM Sorel-Tracy",
    description:
      "Découvrez l'histoire et la mission de Golf SIM Sorel-Tracy.",
  },
  "/rates": {
    title: "Tarifs et Forfaits | Golf SIM Sorel-Tracy",
    description:
      "Consultez nos tarifs : à partir de 25$/heure. Sessions de 1h à 4h.",
  },
  "/gallery": {
    title: "Galerie Photos | Golf SIM Sorel-Tracy",
    description:
      "Explorez notre galerie : simulateurs de golf, espace lounge et bar.",
  },
  "/contact": {
    title: "Contact | Golf SIM Sorel-Tracy",
    description:
      "Contactez Golf SIM Sorel-Tracy au (450) 561-3815.",
  },
  "/booking": {
    title: "Réservation | Golf SIM Sorel-Tracy",
    description:
      "Réservez votre simulateur de golf en ligne.",
  },
  "/politique-de-confidentialite": {
    title: "Politique de Confidentialité | Golf SIM Sorel-Tracy",
  },
  "/politique-de-cookies": {
    title: "Politique de Cookies | Golf SIM Sorel-Tracy",
  },
  "/login": {
    title: "Connexion Admin | Golf SIM Sorel-Tracy",
  },
  "/admin": {
    title: "Administration | Golf SIM Sorel-Tracy",
  },
};

export function usePageMeta(path: string) {
  useEffect(() => {
    const meta = PAGE_META[path];
    if (meta) {
      document.title = meta.title;

      const descriptionMeta = document.querySelector('meta[name="description"]');
      if (descriptionMeta && meta.description) {
        descriptionMeta.setAttribute("content", meta.description);
      }
    }
  }, [path]);
}
