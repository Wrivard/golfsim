# Guide du personnel — Direction et sources

## Public et usage

Personnel de Golf SIM Sorel-Tracy, notamment des personnes plus âgées. Le guide est lu seul, sur papier, pour accomplir une réservation sans assistance. Les titres sont des étapes pratiques. Le contenu est condensé à la demande de l’utilisateur, sans les étapes évidentes ni les numéros répétés.

## Direction visuelle

Guide de six pages : trois côté client, trois côté administration. Chaque page comporte trois actions simples. Un numéro apparaît une seule fois, à côté de son texte ; les captures n’ont aucun numéro ajouté. Les contrôles sont agrandis, entourés et indiqués par une flèche. Les étapes évidentes et les méthodes alternatives ont été retirées.

- Mode clair. Crème `#F7F3E8`, texte `#1B1A18`, accent `#2B5734`, provenant du site existant.
- Titres Oswald 700 ; texte DM Sans 400/700. Deux familles et deux graisses.
- Motifs : bandeau de chapitre / page et repères numérotés entourant les contrôles.
- Les encadrés sont statiques : rien ne dépend du survol pour apparaître sur papier. Les diapositives et le PDF public gardent des espaces pour les accès. Seul le PDF confidentiel destiné au personnel reçoit les accès réels, à partir du champ sécurisé ; ce fichier n’est jamais copié dans les assets publics.
- Chaque photographie et logo visible appartient à la capture réelle du site ; aucun écran ou logo n’a été redessiné.

## Captures et confidentialité

Les PNG source et leurs coordonnées se trouvent dans `public/images/`. Les dérivés agrandis sont des recadrages de ces captures, jamais des maquettes.

Le navigateur a utilisé la véritable interface, les véritables routes de réservation, l’authentification par session et le stockage transactionnel du site, avec un PostgreSQL temporaire séparé. Seules la connexion au stockage et les opérations externes Google Calendar ont été isolées. Aucun compte, rendez-vous, courriel ou client réel n’a été modifié. La connexion administrateur a été effectuée normalement avec un compte de démonstration ; aucun contournement d’authentification n’a été ajouté à l’application.

Les dates, noms et coordonnées affichés sont fictifs. Aucun secret n’apparaît dans le guide. Les captures montrant « synchronisé » ne prouvent pas une synchronisation Google réelle : celle-ci est explicitement hors du test.

## Impression

Le PDF est prévu pour du papier Lettre US, orientation paysage, une page par feuille. Les couleurs ne portent pas seules l’information : numéros, libellés, bordures et flèches restent interprétables en noir et blanc. Conserver le PDF et imprimer en « Taille réelle / 100 % ».
