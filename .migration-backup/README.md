# Golf SIM Sorel-Tracy - Site Web

Bienvenue dans le code source du site web Golf SIM Sorel-Tracy.

## 🚀 Démarrage rapide

Pour lancer le site localement :

1.  Ouvrir un terminal.
2.  Exécuter `npm install` (si ce n'est pas déjà fait).
3.  Exécuter `npm run dev`.
4.  Ouvrir le lien affiché (habituellement http://localhost:5000).

## 📁 Structure du projet

-   `client/src/pages` : Contient les pages du site (Accueil, À propos, Tarifs, etc.).
-   `client/src/components` : Contient les composants réutilisables (Navbar, Footer, Cards).
-   `client/src/components/ui` : Composants de base (boutons, champs de formulaire) stylisés avec Tailwind.
-   `attached_assets` : Dossier contenant les images.

## 🎨 Personnalisation

### Images
Pour remplacer les images, déposez vos nouveaux fichiers dans le dossier `client/public` ou `attached_assets` et mettez à jour les chemins dans les fichiers de composants (ex: `src/pages/Home.tsx`).

### Textes
Les textes se trouvent directement dans les fichiers de pages (`src/pages/*.tsx`). Cherchez le texte que vous souhaitez modifier et remplacez-le.

### Couleurs
La palette de couleurs est définie dans `client/src/index.css`. Vous pouvez ajuster les variables CSS (ex: `--primary`, `--background`) pour changer l'apparence globale.

## 🛠 Technologies

-   **React** : Framework JavaScript pour l'interface utilisateur.
-   **Tailwind CSS** : Framework CSS utilitaire pour le style.
-   **Wouter** : Gestionnaire de routes (navigation).
-   **Framer Motion** : Pour les animations fluides.

## 📦 Déploiement

Ce projet est prêt à être déployé sur Replit ou tout autre hébergeur compatible Node.js/Vite (Vercel, Netlify).

1.  Construire le projet : `npm run build`
2.  Lancer le serveur de production : `npm start`
