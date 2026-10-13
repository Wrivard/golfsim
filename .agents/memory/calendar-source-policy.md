---
name: Active Calendar source policy
description: Only the connected account and selected calendar may supply bookings and availability.
---

Le calendrier admin et les disponibilités du site doivent utiliser uniquement le calendrier choisi du compte Google actuellement connecté. Les réservations d’un ancien compte ou d’un autre calendrier ne doivent pas bloquer les créneaux ni être transférées automatiquement au nouveau calendrier.

**Why:** L’utilisateur veut éviter les doublons et le mélange des comptes de test et du commerce. Il a explicitement précisé « compte 1 → calendrier choisi du compte 1 », puis « compte 2 → calendrier choisi du compte 2 ».

**How to apply:** Treat the account/calendar pair as the booking source boundary, including conflict checks and suggested slots. A connection change alone is not validation of source isolation. Never delete Google events as a side effect of switching accounts. Ask before permanently deleting historical local reservations.

L’utilisateur a choisi de conserver un historique masqué, exclu des disponibilités, plutôt que de supprimer les anciennes réservations lors d’un changement de calendrier.

**Why:** Choix explicite de l’utilisateur. Un changement de connexion ne doit pas détruire l’historique.

Les associations entre réservations et sources doivent suivre les réservations lors d’un changement de base de données.

**Why:** Réaffecter en bloc un historique multi-comptes au compte courant réactiverait les anciennes réservations et leurs conflits. Une reprise des données ne doit pas perdre cette séparation.

Les changements de source et les opérations de réservation doivent rester exclusifs pendant les appels Google, pas seulement pendant les écritures SQL. Une attente de verrou doit libérer sa connexion avant de réessayer.

**Why:** La source pourrait changer entre l’écriture Google et sa sauvegarde locale. Avec le petit pool serverless, conserver les connexions des opérations en attente peut empêcher l’opération détentrice du verrou de terminer.

Les contraintes d’unicité de créneaux doivent respecter la séparation entre calendriers, pas seulement les requêtes de disponibilité.

**Why:** Un index global baie/date/heure a bloqué une nouvelle réservation malgré une disponibilité correcte, car un ancien calendrier masqué occupait exactement le même créneau.

**How to apply:** Ne pas réintroduire d’unicité globale sur les créneaux. Conserver les contrôles de conflit filtrés par source sous verrou transactionnel ; vérifier également les index réellement présents en production après une migration.
