# Golf SIM — préparer Supabase Free sans toucher à Neon

## État et limites

Le propriétaire a approuvé **la préparation**, pas la copie des données ni la
bascule du site. Neon reste la base active. Aucun projet Supabase, transfert,
test distant ou changement DNS n'est effectué par les fichiers de ce dépôt.

Supabase Free annonce 500 Mo de base, 5 Go de transfert mensuel et deux projets
actifs. Il n'a pas le quota d'heures de calcul de Neon. Il reste limité :
ressources partagées, pause après une semaine d'inactivité, pas de sauvegardes
automatiques incluses et pas de garantie de disponibilité. Mesurer la taille,
le transfert et la charge réelle avant de déclarer la marge suffisante.

## 1. Créer les projets gratuits

Dans https://supabase.com/dashboard, créer un projet dédié à Golf SIM sur
**Free**, dans une région proche du site et du serveur Vercel. Ne pas activer
Pro, l'option IPv4 payante ou un domaine personnalisé Supabase.
`golfsimsorel.ca` reste le domaine du site, pas un domaine de base de données.

Prévoir un second projet Free isolé pour les essais. Ne pas employer le projet
de production comme Preview. Les deux projets peuvent partager le même hôte de
pooler : leurs références de projet doivent être différentes.

**Avant toute création de table ou import : désactiver la Data API dans les
réglages Supabase** : Integrations → Data API → désactiver « Enable Data API ».
Le site n'en a pas besoin : les accès passent par Express.
Ne pas exposer les tables via REST, GraphQL ou Realtime. Garder cette API
désactivée, y compris après la migration.

## 2. Connexions sécurisées, sans bascule automatique

Dans le bouton **Connect**, copier la connexion **Transaction pooler**, port
**6543**, pour Vercel. Utiliser l'hôte et l'utilisateur affichés par Supabase :
ne pas les deviner. Ce pooler fonctionne en IPv4 sur Free.

Remplacer le placeholder de mot de passe dans le formulaire sécurisé, jamais
dans le chat ou un fichier Git. Encoder les caractères réservés du mot de passe
dans l'URL. Le code impose TLS ; `sslmode=verify-full` avec le certificat du
fournisseur apporte aussi la vérification du serveur.

Variables de production :

| Variable | Rôle |
| --- | --- |
| `DATABASE_PROVIDER=neon` | Valeur conservée tant que la bascule n'est pas approuvée |
| `NEON_DATABASE_URL` | Connexion existante conservée pour sauvegarde/retour |
| `SUPABASE_DATABASE_URL` | Nouvelle connexion serveur, secret de production |
| `SUPABASE_PRODUCTION_PROJECT_REF` | Référence publique du projet cible de production, dans tous les scopes |

Variables **Preview uniquement** :

- `DATABASE_PROVIDER=supabase`.
- `PREVIEW_DATABASE_URL` : connexion au **projet d'essai distinct**.
- `SUPABASE_PRODUCTION_PROJECT_REF` : référence du projet destiné à la production.
- Calendar et courrier désactivés tant que les tests ne sont pas autorisés.
- Si Calendar est testé, utiliser un calendrier et des identifiants OAuth de
  test, jamais les autorisations Google de production copiées.

Ajouter `SUPABASE_DATABASE_URL` seul ne change pas la base active.
Le code refuse de retomber sur Neon lorsqu'on sélectionne Supabase sans URL.
Il bloque aussi les variantes direct/pooler d'un même projet entre Preview et
production. Ne jamais mettre la connexion dans une variable `VITE_*`.

Les comptes du personnel restent dans `admin_users`, avec leurs hashes
existants. **Ne pas recréer les comptes et ne pas migrer vers Supabase Auth.**

## 3. Copie contrôlée — seulement après autorisation

1. Confirmer la source Neon et le projet Supabase cible, sa gratuité, la Data API
   désactivée et les droits du propriétaire. Faire un état de référence en
   lecture seule : taille, compte des cinq tables métier, réservations par date,
   horaires, correspondances Calendar et utilisateurs.
2. Faire une sauvegarde privée de Neon, chiffrée ou stockée dans un emplacement
   protégé. Elle contient des données clients, des hashes et des jetons Google :
   ne pas la lire dans le chat, l'ajouter à Git, la servir ou la déployer.
3. Sur la cible dédiée **vide**, copier uniquement le schéma et les données de
   `public.bookings`, `public.admin_users`, `public.calendar_settings`,
   `public.oauth_tokens` et `public.operating_schedule`. Employer `pg_dump` /
   `pg_restore` ou la procédure de migration officielle, sans propriétaire ni
   ACL (`--no-owner`, `--no-acl`), avec arrêt sur erreur et restauration
   transactionnelle. Ne pas utiliser `--clean`, `DROP`, `TRUNCATE` ou `push-force`.
   Ne pas restaurer les schémas Supabase `auth`, `storage` ou les rôles du serveur.
4. Pour dump/restore et migrations, utiliser une connexion **directe** si IPv6
   est disponible, sinon le **Session pooler 5432**. Ne pas utiliser le pooler
   Transaction 6543 pour les outils de restauration. Ne pas passer un secret
   dans un argument de commande ou un historique de shell : utiliser un service
   PostgreSQL privé ou l'environnement d'un processus protégé.
5. Appliquer manuellement `docs/migrations/001-vercel-runtime.sql` sur la cible :
   ces tables démarrent vides. Ne pas copier les anciennes sessions, limites,
   verrous ou abonnements push de production vers un environnement d'essai.
6. Appliquer `docs/migrations/002-supabase-private-tables.sql` avec la connexion
   propriétaire `postgres`. Le script active RLS et retire l'accès aux neuf
   tables pour les rôles API publics. Il ne touche pas Neon.
7. Vérifier les comptes, IDs, réservations du 14 octobre, dates/heures,
   horaires et relations Calendar. Vérifier également `relrowsecurity` et
   `has_table_privilege` pour chaque rôle API. Aucun accès public ne doit
   subsister ; conserver la Data API désactivée.

Le dépôt ne lance **aucune** de ces opérations au démarrage ou à la compilation.
Ne pas imprimer les lignes de `oauth_tokens` ou les hashes pour les comparer.
Un comptage seul ne suffit pas à prouver que toutes les données sont identiques.

## 4. Tests avant la production

- Déploiement Vercel Preview : vraie connexion PostgreSQL à la cible de test.
- Connexion du personnel avec les comptes conservés, sessions entre instances.
- Création et modification de date/heure, concurrence, refus d'un conflit.
- Créneaux et « meilleurs choix », durée, nombre de joueurs et confirmations.
- Calendar de test : création, modification, annulation, watch et job planifié.
- Courrier de test : uniquement avec autorisation et destinataire de test.
- Vérifier CPU, mémoire, connexions, taille et transfert avec le calendrier admin
  ouvert et la synchronisation active. Conserver une marge, pas juste une
  consommation située à la limite du forfait.
- Confirmer le processus de sauvegarde privée périodique et de restauration :
  les sauvegardes automatiques ne sont pas incluses dans Free.

Les tests locaux ne prouvent pas la connexion réelle à Supabase ni les droits
sur les tables. Le changement de pilote doit aussi être vérifié sur Vercel.

## 5. Bascule ultérieure et retour

Après accord et tests réussis, mettre les nouvelles réservations en pause pendant
la copie finale afin de ne perdre aucune écriture. Arrêter les anciens workers
Calendar. Refaire la copie validée vers la cible de production vide, vérifier
les données et protections, puis choisir **Production**
`DATABASE_PROVIDER=supabase`. Vérifier le site avant de rouvrir les réservations.

La propriété Calendar, le watch et le scheduler doivent être configurés sur la
nouvelle base et le domaine approuvé. Les jobs et emails restent désactivés
jusqu'à leur autorisation. La migration ne change pas les paramètres DNS WHC.

Ne pas supprimer Neon. Si un retour est nécessaire après de nouvelles
réservations sur Supabase, les réconcilier d'abord : revenir aveuglément sur
l'ancienne copie ferait perdre ces réservations. La bascule n'est pas autorisée
par la seule approbation de cette préparation.

Sources :
- https://supabase.com/pricing
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/api/securing-your-api
