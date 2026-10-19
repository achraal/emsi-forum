# 📱 EMSI Forum — Application Mobile

<div align="center">

[![React Native](https://img.shields.io/badge/React_Native-0.86+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-brown?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![Three.js](https://img.shields.io/badge/Three.js-Spline_3D-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://spline.design)

<p align="center">
  <b>Application mobile universelle (iOS, Android & Web) pour les participants et organisateurs du Forum Entreprises EMSI.</b>
  <br />
  Badges QR dynamiques, scanner recruteur avec caméra intégrée, plan 2D zoomable & immersion 3D Spline, CVthèque et thème sombre adaptatif.
</p>

</div>

---

## 📋 Table des matières
- [Aperçu de l'Application](#-aperçu-de-lapplication)
- [Fonctionnalités Principales](#-fonctionnalités-principales)
- [Expérience par Rôle](#-expérience-par-rôle)
- [Architecture & Structure du Code](#-architecture--structure-du-code)
- [Design System & Thèmes](#-design-system--thèmes)
- [Installation & Démarrage](#-installation--démarrage)
- [Configuration (.env)](#-configuration-env)
- [Résolution des Problèmes Courants](#-résolution-des-problèmes-courants)

---

## 🌟 Aperçu de l'Application

L'application **EMSI Forum Mobile** a été conçue pour offrir une expérience fluide, réactive et ergonomique aux étudiants et partenaires recruteurs lors du forum annuel.

Construite sur **React Native 0.86** et **Expo SDK 57**, elle intègre les dernières fonctionnalités matérielles des smartphones : caméra haute définition pour le scan de badges, capteur de luminosité pour le QR code, notifications push déportées et moteur de rendu WebGL pour la navigation 3D.

---

## ✨ Fonctionnalités Principales

### 🪪 Badge QR Dynamique de l'Étudiant
- Génération instantanée d'un QR code vectoriel sécurisé lié au profil unique de l'étudiant.
- **Mode Boost de Luminosité** : Bascule d'un simple geste pour faciliter la lecture par les douchettes ou caméras des recruteurs sous forte lumière ambiante.
- Informations résumées affichées : Filière, promotion, campus de rattachement.

### 📷 Scanner Haute Vélocité pour Recruteurs
- Scanner intégré propulsé par `expo-camera` avec viseur animé.
- **Verrou synchrone anti-double scan** : Empêche l'enregistrement multiple accidentel du même badge.
- **Affichage instantané du profil** : Nom, prénom, email, compétences, lien GitHub et bouton de consultation directe du CV PDF.
- **Recherche de secours par email** : Permet de retrouver manuellement un étudiant si son écran est endommagé.
- **Historique local et distant** : Suivi chronologique de tous les étudiants scannés pendant la journée avec prise de notes.

### 🗺 Cartographie Interactive Multi-Niveaux
- **Plan 2D Interactif (`Map2DScreen`)** :
  - Zoom et panoramique fluides (`react-native-image-pan-zoom`).
  - Bouton de rotation du plan à 90°, 180° et 270° pour s'orienter facilement dans le hall.
  - Marqueurs interactifs positionnés sur les coordonnées `map_pos_x` et `map_pos_y` des stands d'entreprises.
- **Immersion 3D Interactive (`Map3DScreen`)** :
  - Scène 3D spatiale rendue via WebView et Spline Cloud.
  - Déplacement immersif dans les allées du forum avec gestion des états hors-ligne et retry.

### 📄 Gestionnaire de CV & Profil Ingénieur
- Dépôt de fichier CV en direct depuis le smartphone (`expo-document-picker`).
- Prévisualisation et partage natif (`expo-sharing`, `expo-web-browser`).
- Sélecteur rapide de compétences techniques (*Next.js, FastAPI, Spring Boot, AWS, Docker, Kubernetes, etc.*).

### 🔔 Notifications Push & Annonces
- Réception d'alertes en temps réel pour les keynotes, conférences et annonces urgentes via `expo-notifications`.

---

## 👥 Expérience par Rôle

L'interface et la barre de navigation inférieure s'adaptent dynamiquement dès la connexion grâce au store Zustand et au système de permissions :

| Rôle | Onglets Visibles | Fonctionnalités Dédiées |
| :--- | :--- | :--- |
| **Étudiant (`student`)** | 🏠 Accueil, 🏢 Entreprises, 🗺 Plan (2D/3D), 👤 Profil, ⚙️ Réglages | Badge QR personnel, dépôt de CV aux stands, avis de satisfaction |
| **Recruteur / Admin (`recruiter`, `admin`)** | 📊 Dashboard, 📷 Scanner, 🏢 Entreprises, 👤 Profil, ⚙️ Réglages | Caméra de scan, recherche étudiants, stats de fréquentation, diffusion d'annonces push |

---

## 🏗 Architecture & Structure du Code

```text
emsi-forum-mobile/
├── App.jsx                     # Point d'entrée, chargement des polices Google
├── app.json                    # Configuration du projet Expo et permissions
├── package.json                # Dépendances React Native & scripts
├── .env                        # Variables d'environnement
├── assets/                     # Icônes, splash screen et plan statique
└── src/
    ├── context/
    │   └── ThemeContext.tsx    # Gestionnaire de thème clair/sombre adaptatif EMSI
    ├── navigation/
    │   ├── AppNavigator.tsx    # Guard d'authentification et Bottom Tabs selon rôle
    │   ├── MapNavigator.tsx    # Stack de navigation entre Plan 2D et Vue 3D
    │   └── types.ts            # Définitions TypeScript complètes des routes
    ├── screens/
    │   ├── auth/               # Connexion, Inscription, Modal Mot de passe oublié
    │   ├── forum/              # Accueil, Liste Entreprises, Fiche Détail, Annonces, Avis
    │   ├── map/                # Map2DScreen (Zoom/Rotation) & Map3DScreen (Spline 3D)
    │   ├── profile/            # Profil étudiant, téléversement de CV et badge QR
    │   └── admin/              # Tableau de bord KPIs et Scanner de badges caméra
    ├── services/
    │   └── api.ts              # Instance Axios avec intercepteur automatique du JWT
    ├── store/
    │   └── authStore.ts        # Store global Zustand (Token, Utilisateur, Rôle)
    └── components/             # Composants d'interface réutilisables
```

---

## 🎨 Design System & Thèmes

L'application intègre une charte graphique premium respectant les couleurs officielles de l'EMSI :

- **Vert Institutionnel EMSI** : `#006b31` (Clair) / `#6edd8a` (Sombre)
- **Typographies Modernes** :
  - `Syne` pour les titres audacieux et accrocheurs.
  - `Poppins` pour les sous-titres et éléments d'action.
  - `Inter` pour les descriptions et formulaires lisibles.
- **Mode Sombre Natif** : Détection automatique des préférences système ou sélection manuelle dans l'écran Réglages avec persistance dans AsyncStorage.

---

## 🚀 Installation & Démarrage

### 1. Installation des dépendances

```bash
cd emsi-forum-mobile
npm install
```

### 2. Configuration du fichier `.env`

Créez un fichier `.env` dans le dossier `emsi-forum-mobile/` :

```env
# ⚠️ Remplacez l'adresse IP ci-dessous par l'adresse IP locale de votre machine (ex: ipconfig sur Windows)
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000
EXPO_PUBLIC_SPLINE_SCENE_URL=https://my.spline.design/spline3dstarterfile-2dxSIuBiX74TLSRBgOrxrb0B/
```

> **Important** : Ne pas utiliser `localhost` ou `127.0.0.1` pour `EXPO_PUBLIC_API_URL` car votre smartphone physique ne pourra pas joindre votre ordinateur hôte.

### 3. Lancement du serveur de développement

```bash
npx expo start
```

- **Sur smartphone physique** : Ouvrez l'application **Expo Go** (Android ou iOS) et scannez le QR code affiché dans le terminal.
- **Sur émulateur Android** : Tapez `a` dans le terminal.
- **Sur simulateur iOS** : Tapez `i` dans le terminal.
- **Sur navigateur Web** : Tapez `w` dans le terminal.

---

## 🔧 Résolution des Problèmes Courants

| Problème | Cause fréquente | Solution |
| :--- | :--- | :--- |
| **Network Error / Impossible de se connecter à l'API** | L'IP configurée dans `.env` n'est pas joignable par le téléphone. | Vérifiez que le PC et le téléphone sont sur le **même réseau Wi-Fi** et que le pare-feu autorise le port `8000`. |
| **Caméra noire lors du scan** | Permission caméra non accordée. | Autorisez l'accès à la caméra dans les réglages système de votre téléphone ou dans la boîte de dialogue de l'app. |
| **Scène 3D ne charge pas** | Lien Spline expiré ou réseau lent. | Vérifiez la variable `EXPO_PUBLIC_SPLINE_SCENE_URL` et votre connexion internet, ou cliquez sur "Réessayer". |
| **Erreur de police d'écriture** | Fichiers `@expo-google-fonts` non prêts. | Le Splash Screen reste actif jusqu'à la fin de `useFonts()` dans `App.jsx`. |
