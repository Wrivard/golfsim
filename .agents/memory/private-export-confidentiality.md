---
name: Private export confidentiality
description: Protect confidential exports from every preview server in the monorepo.
---

Un export confidentiel n’est pas protégé simplement parce qu’il est hors du dossier public ou ignoré par Git.

**Why:** Les serveurs Vite du monorepo peuvent autoriser la racine du workspace et servir ses fichiers par leurs URL de fichiers. Cela peut exposer un PDF confidentiel pourtant absent des assets publics.

**How to apply:** Tout serveur de prévisualisation, y compris un nouvel artifact, doit refuser explicitement les exports privés et garder le contrôle strict des fichiers activé. Conserver les protections par défaut des secrets et vérifier le refus HTTP avec un fichier non sensible, sans lire le contenu d’un export confidentiel.
