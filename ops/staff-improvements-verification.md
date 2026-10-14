# Améliorations du personnel — vérification du 14 octobre 2026

## Livraison

- Calendrier public : popover adaptatif, défilement si nécessaire, fermeture à la sélection, date locale conservée.
- Restriction des réservations publiques jusqu'à une date incluse ; les réservations manuelles restent possibles.
- Fermetures physiques : une ou plusieurs baies, journées ou heures, ajouter/modifier/rouvrir depuis Administration. Les réservations existantes en conflit empêchent l'enregistrement ; elles ne sont pas supprimées ni déplacées automatiquement.
- Fermetures respectées sur disponibilités publiques et personnel, confirmation publique, ajout/modification staff et séances récurrentes. Elles utilisent le verrou de source existant et les verrous de dates.
- Nouvelles ligues jusqu'au prochain 30 avril ; mardi non sélectionné initialement. Les séries historiques ne sont pas modifiées.
- Navigation du calendrier admin par date ; baie 4 rouge. Les nouveaux événements Google et les événements modifiés utilisent le rouge Google. Aucun recoloriage en masse des événements Google existants.
- Blocs : même échelle en pixels que les lignes horaires, sans hauteur minimale ajoutée ; heure de fin explicitée pour les réservations d'une heure. Le défaut initial n'a pas été reproduit avec les exemples représentatifs : les tests vérifient précisément 15:00–16:00, demi-heures, 1h30 et plusieurs heures sans modifier les horaires stockés.
- Déplacement entre baies par glisser-déposer sur ordinateur ou sélection/bouton dans les détails sur mobile/clavier. Seule la baie est modifiée ; serveur existant, conflits et Google inchangés. Pas de changement visuel optimiste à annuler en cas d'échec.
- Bouton « Ajouter une réservation » et duplication préremplie. L'original, l'appartenance à une série et les paiements ne sont pas copiés dans la nouvelle réservation.
- Banque de courriels : nouvelles réservations confirmées du site et du personnel seulement, normalisation/dédoublonnage, liste protégée, CSV complet et CSV marketing. Pas de collecte des invités d'un calendrier personnel ou d'import historique sans provenance vérifiée.
- Consentement marketing facultatif et décoché ; journal des consentements/retraits. Liens signés dans les confirmations des contacts consentants et dans l'export marketing. Retrait sans authentification mais avec lien signé ; un ancien lien ne peut pas révoquer un consentement ultérieur.
- Politique de confidentialité mise à jour. Ces mécanismes techniques ne constituent pas une certification juridique ; les futurs messages promotionnels devront également satisfaire les exigences applicables.
- Statistiques existantes déplacées dans Administration, sans nouveaux calculs.
- Mot de passe masqué par défaut, contrôle afficher/masquer accessible.

## Base publiée

L'utilisateur a autorisé explicitement `ops/staff-improvements.sql`.
Le fournisseur et la connexion de production ont été vérifiés depuis le projet Vercel Golf SIM avant l'exécution.
Les trois tables ont été créées dans Neon par transaction. Les 161 réservations existantes sont restées présentes ; les trois tables étaient vides après la migration.

Aucune réservation/client fictif, campagne, modification de calendrier réel ou publication Vercel n'a été effectué pour ces vérifications.

## Tests exécutés

- Génération OpenAPI et vérification des bibliothèques.
- TypeScript API, frontend et fonction Vercel via `pnpm build:vercel`.
- Build de production complet et validation des fichiers sitemap/robots : succès.
- `pnpm test:launch` : 84 tests applicatifs et 8 tests du scheduler réussis.
- `pnpm --filter @workspace/scripts exec tsx ../ops/verify-staff-data.mjs` : vraie base PostgreSQL de développement distincte de Neon, schéma temporaire nettoyé après le test. Migration, dédoublonnage, consentement explicite, conservation par réservation staff, retrait, consentement renouvelé, invalidation de l'ancien lien, journal et contraintes de plages vérifiés.
- Navigateur Chromium : calendrier public sur 320×568, 360×640, 390×844 et contrôles desktop ; duplication, déplacement accessible, banque et formulaire des fermetures à 390 et 1280 px.
- Ces parcours admin étaient **simulés côté API dans le navigateur** : ils ne valident pas une synchronisation Google réelle. Authentification non contournée dans l'application.
- API de développement : contacts refusés sans session (401), liste publique des fermetures disponible (200).
- Capture réelle de la page publique de réservation mobile : affichage fonctionnel.

## Mise en ligne et limites

- Aucun redéploiement effectué. Le site publié conserve son code actuel jusqu'au prochain déploiement.
- Après publication autorisée, vérifier les parcours avec le compte/calendrier client réellement connecté, notamment une création/déplacement contrôlé, sa disponibilité publique et Google, ainsi que les courriels Resend.
- Ne jamais utiliser Neon production pour le script d'essai SQL ; il refuse une base de développement ayant la même identité que Neon.
- L'environnement local utilise Node 24 ; le projet cible Node 22. Le build passe localement mais un véritable build Vercel Node 22 reste une vérification distincte.
- Les avertissements de taille du bundle ne bloquent pas le build. Les problèmes de typage du Canvas sont hors périmètre ; le build produit ne dépend pas de ce sandbox.
