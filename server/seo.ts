import { type Express, type Request, type Response } from "express";

const SITE_NAME = "Golf SIM Sorel-Tracy";

function getSiteDomain(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) {
    return process.env.REPLIT_DEPLOYMENT_URL.replace(/\/$/, "");
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  return "https://golfsimsorel-tracy.replit.app";
}

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
}

const PAGE_META: Record<string, PageMeta> = {
  "/": {
    title: "Golf SIM Sorel-Tracy | Simulateur de Golf Intérieur Haut de Gamme",
    description:
      "Découvrez Golf SIM Sorel-Tracy : 4 simulateurs de golf intérieur haut de gamme, ambiance lounge, bar et événements. Réservez votre session dès maintenant au 215 Bd Fiset, Sorel-Tracy.",
    canonical: "/",
    ogTitle: "Golf SIM Sorel-Tracy | Simulateur de Golf Intérieur",
    ogDescription:
      "4 simulateurs haut de gamme, ambiance lounge et bar. Réservez votre session de golf intérieur à Sorel-Tracy.",
  },
  "/about": {
    title: "À propos | Golf SIM Sorel-Tracy",
    description:
      "Découvrez l'histoire et la mission de Golf SIM Sorel-Tracy. Un espace lounge premium dédié aux passionnés de golf, situé au cœur de Sorel-Tracy.",
    canonical: "/about",
    ogTitle: "À propos de Golf SIM Sorel-Tracy",
    ogDescription:
      "Plus qu'un centre de simulation : une destination golf premium à Sorel-Tracy.",
  },
  "/rates": {
    title: "Tarifs et Forfaits | Golf SIM Sorel-Tracy",
    description:
      "Consultez nos tarifs : à partir de 25$/heure. Sessions de 1h à 4h, forfaits pratique et loisir. Réservez un simulateur de golf intérieur à Sorel-Tracy.",
    canonical: "/rates",
    ogTitle: "Tarifs – Golf SIM Sorel-Tracy",
    ogDescription:
      "À partir de 25$/h. Sessions de 1 à 4 heures sur simulateur haut de gamme.",
  },
  "/gallery": {
    title: "Galerie Photos | Golf SIM Sorel-Tracy",
    description:
      "Explorez notre galerie : simulateurs de golf, espace lounge, bar et ambiance haut de gamme chez Golf SIM Sorel-Tracy.",
    canonical: "/gallery",
    ogTitle: "Galerie – Golf SIM Sorel-Tracy",
    ogDescription:
      "Découvrez nos installations en images : simulateurs, lounge et bar.",
  },
  "/contact": {
    title: "Contact | Golf SIM Sorel-Tracy",
    description:
      "Contactez Golf SIM Sorel-Tracy au (450) 561-3815 ou visitez-nous au 215 Bd Fiset, Sorel-Tracy, QC J3P 3P3. Formulaire de contact disponible.",
    canonical: "/contact",
    ogTitle: "Contactez-nous – Golf SIM Sorel-Tracy",
    ogDescription:
      "215 Bd Fiset, Sorel-Tracy | (450) 561-3815. Écrivez-nous ou passez nous voir.",
  },
  "/booking": {
    title: "Réservation | Golf SIM Sorel-Tracy",
    description:
      "Réservez votre simulateur de golf en ligne. Choisissez votre durée, créneau et baie. Confirmation instantanée chez Golf SIM Sorel-Tracy.",
    canonical: "/booking",
    ogTitle: "Réserver un simulateur – Golf SIM Sorel-Tracy",
    ogDescription:
      "Réservation en ligne rapide. Choisissez votre créneau parmi 4 simulateurs.",
  },
  "/politique-de-confidentialite": {
    title: "Politique de Confidentialité | Golf SIM Sorel-Tracy",
    description:
      "Politique de confidentialité de Golf SIM Sorel-Tracy. Découvrez comment nous protégeons vos données personnelles.",
    canonical: "/politique-de-confidentialite",
    ogTitle: "Politique de Confidentialité",
    ogDescription:
      "Comment Golf SIM Sorel-Tracy protège vos données personnelles.",
  },
  "/politique-de-cookies": {
    title: "Politique de Cookies | Golf SIM Sorel-Tracy",
    description:
      "Politique de cookies de Golf SIM Sorel-Tracy. Informations sur les cookies utilisés sur notre site.",
    canonical: "/politique-de-cookies",
    ogTitle: "Politique de Cookies",
    ogDescription:
      "Informations sur les cookies utilisés par Golf SIM Sorel-Tracy.",
  },
  "/login": {
    title: "Connexion Admin | Golf SIM Sorel-Tracy",
    description: "",
    canonical: "/login",
    noindex: true,
  },
  "/admin": {
    title: "Administration | Golf SIM Sorel-Tracy",
    description: "",
    canonical: "/admin",
    noindex: true,
  },
};

function getLocalBusinessSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "Golf SIM Sorel-Tracy",
    description:
      "Centre de simulateurs de golf intérieur haut de gamme avec 4 baies, ambiance lounge et bar à Sorel-Tracy, Québec.",
    url: getSiteDomain(),
    telephone: "+14505613815",
    address: {
      "@type": "PostalAddress",
      streetAddress: "215 Bd Fiset",
      addressLocality: "Sorel-Tracy",
      addressRegion: "QC",
      postalCode: "J3P 3P3",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 46.0371,
      longitude: -73.1215,
    },
    image: `${getSiteDomain()}/opengraph.jpg`,
    priceRange: "$$",
    currenciesAccepted: "CAD",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    areaServed: {
      "@type": "City",
      name: "Sorel-Tracy",
    },
    sameAs: [],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Sessions de golf en simulateur",
      itemListElement: [
        {
          "@type": "Offer",
          name: "Session Pratique (1h)",
          price: "25",
          priceCurrency: "CAD",
          description: "1 heure de simulateur de golf intérieur",
        },
        {
          "@type": "Offer",
          name: "Session Loisir (2-4h)",
          price: "28",
          priceCurrency: "CAD",
          description:
            "Session de 2 à 4 heures de simulateur de golf intérieur (par heure)",
        },
      ],
    },
  };
}

function getSiteUrl(): string {
  return getSiteDomain();
}

export function injectSeoMeta(html: string, path: string): string {
  const meta = PAGE_META[path] || PAGE_META["/"];
  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}${meta.canonical}`;
  const ogImageUrl = `${siteUrl}/opengraph.jpg`;

  let headInjection = "";

  headInjection += `<title>${meta.title}</title>\n`;
  headInjection += `    <meta name="description" content="${meta.description}" />\n`;
  headInjection += `    <link rel="canonical" href="${canonicalUrl}" />\n`;

  if (meta.noindex) {
    headInjection += `    <meta name="robots" content="noindex, nofollow" />\n`;
  }

  headInjection += `    <meta property="og:title" content="${meta.ogTitle || meta.title}" />\n`;
  headInjection += `    <meta property="og:description" content="${meta.ogDescription || meta.description}" />\n`;
  headInjection += `    <meta property="og:type" content="website" />\n`;
  headInjection += `    <meta property="og:url" content="${canonicalUrl}" />\n`;
  headInjection += `    <meta property="og:image" content="${ogImageUrl}" />\n`;
  headInjection += `    <meta property="og:image:width" content="1200" />\n`;
  headInjection += `    <meta property="og:image:height" content="630" />\n`;
  headInjection += `    <meta property="og:site_name" content="${SITE_NAME}" />\n`;
  headInjection += `    <meta property="og:locale" content="fr_CA" />\n`;

  headInjection += `    <meta name="twitter:card" content="summary_large_image" />\n`;
  headInjection += `    <meta name="twitter:title" content="${meta.ogTitle || meta.title}" />\n`;
  headInjection += `    <meta name="twitter:description" content="${meta.ogDescription || meta.description}" />\n`;
  headInjection += `    <meta name="twitter:image" content="${ogImageUrl}" />\n`;

  if (path === "/") {
    const schema = getLocalBusinessSchema();
    headInjection += `    <script type="application/ld+json">${JSON.stringify(schema)}</script>\n`;
  }

  let result = html;

  result = result.replace(/<title>[^<]*<\/title>\s*/g, "");
  result = result.replace(/<meta\s+name="description"[^>]*\/?\s*>\s*/g, "");
  result = result.replace(/<meta\s+property="og:[^"]*"[^>]*\/?\s*>\s*/g, "");
  result = result.replace(/<meta\s+name="twitter:[^"]*"[^>]*\/?\s*>\s*/g, "");
  result = result.replace(/<meta\s+name="robots"[^>]*\/?\s*>\s*/g, "");
  result = result.replace(/<link\s+rel="canonical"[^>]*\/?\s*>\s*/g, "");
  result = result.replace(/<script\s+type="application\/ld\+json">[^<]*<\/script>\s*/g, "");

  result = result.replace("</head>", `    ${headInjection}  </head>`);

  return result;
}

export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const siteUrl = getSiteUrl();
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin
Disallow: /login

Sitemap: ${siteUrl}/sitemap.xml
`;
    res.type("text/plain").send(robotsTxt);
  });

  app.get("/sitemap.xml", (_req: Request, res: Response) => {
    const siteUrl = getSiteUrl();
    const publicPages = [
      { loc: "/", priority: "1.0", changefreq: "weekly" },
      { loc: "/about", priority: "0.8", changefreq: "monthly" },
      { loc: "/rates", priority: "0.9", changefreq: "monthly" },
      { loc: "/gallery", priority: "0.7", changefreq: "monthly" },
      { loc: "/contact", priority: "0.8", changefreq: "monthly" },
      { loc: "/booking", priority: "0.9", changefreq: "daily" },
      { loc: "/politique-de-confidentialite", priority: "0.3", changefreq: "yearly" },
      { loc: "/politique-de-cookies", priority: "0.3", changefreq: "yearly" },
    ];

    const lastmod = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of publicPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${siteUrl}${page.loc}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.type("application/xml").send(xml);
  });
}
