---
name: Active Calendar source policy
description: Only the connected account and selected calendar may supply bookings and availability.
---

Le calendrier admin et les disponibilités du site doivent utiliser uniquement le calendrier choisi du compte Google actuellement connecté. Les réservations d’un ancien compte ou d’un autre calendrier ne doivent pas bloquer les créneaux ni être transférées automatiquement au nouveau calendrier.

**Why:** L’utilisateur veut éviter les doublons et le mélange des comptes de test et du commerce. Il a explicitement précisé « compte 1 → calendrier choisi du compte 1 », puis « compte 2 → calendrier choisi du compte 2 ».

**How to apply:** Treat the account/calendar pair as the booking source boundary, including conflict checks and suggested slots. A connection change alone is not validation of source isolation. Never delete Google events as a side effect of switching accounts. Ask before permanently deleting historical local reservations.
