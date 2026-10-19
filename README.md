# 🎓 EMSI Forum — Plateforme Digitale du Forum Entreprises

<div align="center">

![EMSI Forum Banner](https://img.shields.io/badge/EMSI-Forum_Entreprises_2027-006b31?style=for-the-badge&logo=mortarboard&logoColor=white)
<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.143+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React Native](https://img.shields.io/badge/React_Native-0.86+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>Écosystème digital tout-en-un pour le Forum Entreprises de l'École Marocaine des Sciences de l'Ingénieur (EMSI).</b>
  <br />
  Mise en relation étudiants-recruteurs, badges QR interactifs, CVthèque dématérialisée, plans 2D & 3D immersifs, notifications push et tableau de bord décisionnel.
</p>

[Fonctionnalités](#-fonctionnalités-clés) • [Architecture](#-architecture-globale) • [Démarrage Rapide](#-démarrage-rapide) • [Variables d'Environnement](#-variables-denvironnement) • [Documentation Sous-Projets](#-documentation-détaillée)

---

</div>

## 📌 À propos du projet

Le **Forum Entreprises EMSI** est un carrefour annuel d'insertion professionnelle reliant des milliers d'élèves ingénieurs aux plus grandes entreprises technologiques nationales et internationales (Capgemini, etc.).

Cette solution a été pensée pour moderniser, fluidifier et digitaliser l'expérience de l'événement à travers deux briques interconnectées :
1. **Un Backend robuste (FastAPI & PostgreSQL)** garantissant une gestion sécurisée des profils, l'authentification institutionnelle Microsoft Entra ID (@emsi-edu.ma), la génération de tokens QR uniques et l'envoi de notifications push via Expo.
2. **Une Application Mobile fluide (React Native & Expo)** offrant aux étudiants leur badge QR dématérialisé, un plan 2D/3D interactif des stands, le dépôt direct de CV, et aux recruteurs/administrateurs un scanner de badges haute vélocité avec métriques en temps réel.

---

## ✨ Fonctionnalités Clés

### 👨‍🎓 Pour les Élèves Ingénieurs
- **Authentification Sécurisée** : Connexion classique ou SSO Microsoft Entra ID réservée aux adresses institutionnelles `@emsi-edu.ma`.
- **Badge Numérique Unique** : Badge QR Code dynamique avec mode luminosité maximale pour un scan fluide aux stands.
- **Cartographie Interactive** :
  - **Plan 2D** : Navigation interactive des stands avec zoom, panoramique, rotation à 90° et consultation des fiches entreprises.
  - **Immersion 3D** : Visite virtuelle et visualisation moderne de l'espace forum via WebGL / Spline.
- **Catalogue d'Entreprises** : Fiches détaillées, catégories de sponsoring (*Diamond, Gold, Silver*), profils recherchés et coordonnées.
- **CVthèque & Profil Ingénieur** : Dépôt et mise à jour de CV PDF, liens GitHub/LinkedIn, sélection de compétences clés (*Next.js, FastAPI, Spring Boot, AWS...*).
- **Interactions & Enquêtes** : Dépôt de candidature aux stands et évaluation de satisfaction du forum avec notation sur 5 étoiles.

### 💼 Pour les Recruteurs & Administrateurs
- **Scanner Haute Vélocité** : Scan direct par caméra des badges QR étudiants avec prévention des doublons, recherche manuelle par e-mail et consultation instantanée du CV.
- **Historique des Rencontres** : Suivi horodaté des étudiants rencontrés avec prise de notes contextuelles.
- **Diffusion d'Annonces Push** : Envoi de notifications push instantanées à tous les participants équipés de l'application mobile.
- **Tableau de Bord & KPIs** :
  - Nombre total d'étudiants inscrits et présents.
  - Volume de CVs déposés.
  - Indice de satisfaction moyen.
  - Classement en temps réel des stands et entreprises les plus visités.

---

## 🏛 Architecture Globale

```mermaid
flowchart TB
  subgraph MobileApp ["📱 Client Mobile (React Native / Expo SDK 57)"]
    UI_Student["Espace Étudiant\n(Badge QR, Plans 2D/3D, CV)"]
    UI_Admin["Espace Admin & Recruteur\n(Scanner Caméra, KPIs, Annonces)"]
    Store["Zustand Store + Axios Interceptors"]
  end

  subgraph BackendAPI ["⚙️ Serveur API (FastAPI / Python 3.13)"]
    AuthRouter["Module Auth\n(Argon2, JWT, SSO Microsoft Entra)"]
    BadgeRouter["Module Badge & Scans\n(QR Verification, Audit Log)"]
    EntrepriseRouter["Module Entreprises & Interactions\n(Catalog, Uploads, CV Drop)"]
    AdminRouter["Module Dashboard & KPIs\n(Statistiques, Enquêtes)"]
    PushService["Service Push Notifications\n(Exponent Server SDK)"]
  end

  subgraph StorageServices ["💾 Données & Médias"]
    DB[(PostgreSQL Database)]
    StaticFiles["Stockage Fichiers\n(/uploads/cvs, /uploads/logos)"]
  end

  subgraph CloudServices ["☁️ Services Externes"]
    MSGraph["Microsoft Graph API / Azure AD"]
    ExpoPushGateway["Expo Push Notification Gateway"]
    SplineCloud["Spline 3D Cloud Runtime"]
  end

  UI_Student -->|REST API + JWT| BackendAPI
  UI_Admin -->|REST API + JWT| BackendAPI
  UI_Student -->|Scène 3D Interactive| SplineCloud

  BackendAPI -->|OAuth 2.0 / Code Exchange| MSGraph
  BackendAPI -->|Tâches de fond - BackgroundTasks| ExpoPushGateway
  ExpoPushGateway -.->|Push Notifications| MobileApp

  BackendAPI --> DB
  BackendAPI --> StaticFiles
```

---

## 📂 Structure du Répertoire

```text
emsi-forum/
├── README.md                      # Documentation principale du projet (Monorepo)
├── emsi-forum-backend/            # Backend REST API
│   ├── pyproject.toml             # Dépendances Python (uv / pip)
│   ├── .env                       # Configuration environnement serveur
│   ├── README.md                  # Documentation détaillée du backend
│   ├── uploads/                   # Fichiers médias persistés (CVs, logos)
│   └── src/
│       ├── main.py                # Point d'entrée FastAPI & middlewares
│       ├── api/                   # Routeurs REST (auth, badge, profile, etc.)
│       ├── core/                  # Configuration, base de données & sécurité
│       ├── models/                # Modèles SQLAlchemy (User, Enterprise, Scan, etc.)
│       └── schemas/               # Schémas Pydantic (validation & sérialisation)
└── emsi-forum-mobile/             # Application Mobile Universelle
    ├── package.json               # Dépendances React Native & scripts Expo
    ├── app.json                   # Configuration Expo & permissions
    ├── .env                       # Variables d'environnement de l'app mobile
    ├── README.md                  # Documentation détaillée du client mobile
    ├── App.jsx                    # Point d'entrée de l'application & chargement polices
    └── src/
        ├── context/               # Contexte de thème (Mode Clair / Sombre EMSI)
        ├── navigation/            # React Navigation (Tabs, Stacks, Role Guard)
        ├── screens/               # Écrans (Auth, Forum, Plans 2D/3D, Profil, Admin)
        ├── services/              # Client API Axios avec intercepteur JWT
        └── store/                 # Gestion d'état global avec Zustand
```

---

## 🚀 Démarrage Rapide

### Prérequis
- [Python 3.13+](https://www.python.org/) et gestionnaire [uv](https://docs.astral.sh/uv/) (ou `pip` / `venv`)
- [Node.js 18+](https://nodejs.org/) et `npm`
- [PostgreSQL](https://www.postgresql.org/) installé et en cours d'exécution
- Smartphone avec l'application [Expo Go](https://expo.dev/go) (ou émulateur Android / simulateur iOS)

---

### 1. Démarrer le Backend

```bash
# Se placer dans le répertoire backend
cd emsi-forum-backend

# Créer et activer l'environnement virtuel avec uv (recommandé)
uv venv
# Sur Windows :
.venv\Scripts\activate
# Sur macOS/Linux :
# source .venv/bin/activate

# Installer les dépendances
uv pip install -r pyproject.toml
# Ou avec pip standard : pip install -e .

# Configurer le fichier .env (voir section Variables d'Environnement)

# Lancer le serveur de développement
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

> **API Interactive** accessible sur : [http://localhost:8000/docs](http://localhost:8000/docs)  
> **Route racine** : [http://localhost:8000/](http://localhost:8000/)

---

### 2. Démarrer l'Application Mobile

```bash
# Ouvrir un second terminal et naviguer dans le dossier mobile
cd emsi-forum-mobile

# Installer les dépendances Node.js
npm install

# Configurer l'adresse IP locale du backend dans le fichier .env
# Exemple : EXPO_PUBLIC_API_URL=http://<VOTRE_IP_LOCALE>:8000

# Lancer le serveur Expo
npx expo start
```

Puis :
- Flashez le QR Code affiché dans votre terminal avec votre téléphone via l'application **Expo Go**.
- Ou appuyez sur `a` pour ouvrir dans un émulateur Android, `i` pour iOS, ou `w` pour tester dans le navigateur web.

---

## 🔑 Variables d'Environnement

### Backend (`emsi-forum-backend/.env`)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL | `postgresql://postgres:motdepasse@localhost:5432/emsi_forum` |
| `SECRET_KEY` | Clé secrète pour signature JWT | `votre_cle_secrete_ultra_securisee` |
| `ALGORITHM` | Algorithme de chiffrement JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité du token JWT | `1440` (24 heures) |

### Mobile (`emsi-forum-mobile/.env`)

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | URL de l'API FastAPI (utilisez l'IP de votre machine en Wi-Fi) | `http://192.168.1.50:8000` |
| `EXPO_PUBLIC_SPLINE_SCENE_URL` | Lien vers la scène 3D Spline hébergée | `https://my.spline.design/spline3dstarterfile-.../` |

---

## 📚 Documentation Détaillée

Pour des guides d'installation avancés, les détails des endpoints de l'API et les architectures internes :
- 🔗 **[Documentation Backend](file:///c:/Users/achra/Desktop/emsi-forum/emsi-forum-backend/README.md)** : Schémas de base de données, intégration Microsoft Graph API, commandes Alembic, gestion des uploads de CV.
- 🔗 **[Documentation Mobile](file:///c:/Users/achra/Desktop/emsi-forum/emsi-forum-mobile/README.md)** : Navigation basée sur les rôles, intégration caméra QR, gestionnaire de thèmes clair/sombre, intégration Spline 3D.

---

## 👥 Auteur & Remerciements

Développé pour l'**École Marocaine des Sciences de l'Ingénieur (EMSI)**.

- **Auteur** : [achraal](https://github.com/achraal) (`achrafbenagri28@gmail.com`)
- **Événement** : Forum Entreprises EMSI 2026

---

## 📄 Licence

Ce projet est sous licence MIT — consultez le fichier [LICENSE](file:///c:/Users/achra/Desktop/emsi-forum/emsi-forum-mobile/LICENSE) pour plus d'informations.
