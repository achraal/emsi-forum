# ⚙️ EMSI Forum — Backend API

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.143+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org)
[![Alembic](https://img.shields.io/badge/Alembic-1.20+-333333?style=for-the-badge&logo=alembic&logoColor=white)](https://alembic.sqlalchemy.org)
[![UV](https://img.shields.io/badge/uv-Package_Manager-DE5FE9?style=for-the-badge&logo=astral&logoColor=white)](https://docs.astral.sh/uv/)

<p align="center">
  <b>API REST haute performance développée avec FastAPI et SQLAlchemy pour la gestion complète du Forum Entreprises EMSI.</b>
  <br />
  Authentification institutionnelle, jetons QR sécurisés, gestion de CVs PDF, intégration Microsoft Entra ID et notifications push Expo.
</p>

</div>

---

## 📋 Table des matières
- [Aperçu & Architecture](#-aperçu--architecture)
- [Fonctionnalités Techniques](#-fonctionnalités-techniques)
- [Modèles de Données](#-modèles-de-données)
- [Points de Terminaison (Endpoints API)](#-points-de-terminaison-endpoints-api)
- [Sécurité & Authentification](#-sécurité--authentification)
- [Installation & Démarrage](#-installation--démarrage)
- [Configuration (.env)](#-configuration-env)
- [Initialisation de la Base de Données](#-initialisation-de-la-base-de-données)

---

## 🏛 Aperçu & Architecture

Le backend repose sur l'architecture modulaire moderne de FastAPI, couplée à SQLAlchemy 2.0 en ORM et PostgreSQL en base de données relationnelle.

```text
emsi-forum-backend/
├── pyproject.toml              # Métadonnées du projet et dépendances
├── uv.lock                     # Fichier de verrouillage des versions
├── .python-version             # Version Python recommandée (3.13)
├── .env                        # Variables d'environnement
├── uploads/                    # Répertoire persistant de médias
│   ├── cvs/                    # CVs des étudiants (fichiers PDF assainis)
│   └── logos/                  # Logos des entreprises sponsors
└── src/
    ├── main.py                 # Instanciation FastAPI, CORS & montage des routeurs
    ├── api/                    # Routeurs d'API REST
    │   ├── auth.py             # Inscription, Login, Microsoft Entra ID SSO
    │   ├── profile.py          # Profil étudiant, téléversement/téléchargement CV
    │   ├── entreprise.py       # CRUD entreprises, téléversement logos
    │   ├── interactions.py     # Suivi des visites et dépôts de CV
    │   ├── badge.py            # Scan de badges QR, recherche d'étudiants
    │   ├── survey.py           # Questionnaire de satisfaction du forum
    │   ├── announcements.py    # Diffusion d'annonces & push notifications Expo
    │   ├── admin.py            # KPIs et statistiques du tableau de bord
    │   └── deps.py             # Dépendances FastAPI (get_current_user, get_current_admin)
    ├── core/
    │   ├── config.py           # Chargement Pydantic BaseSettings
    │   ├── database.py         # Moteur SQLAlchemy, SessionLocal & Base
    │   ├── security.py         # Hachage Argon2/Bcrypt, création/vérification JWT
    │   └── init_db.py          # Seeder de démarrage (Admin par défaut & sponsors)
    ├── models/                 # Modèles SQLAlchemy (tables PostgreSQL)
    │   ├── user.py             # Utilisateurs (étudiants, recruteurs, admins)
    │   ├── enterprise.py       # Entreprises partenaires et stands
    │   ├── badge_scan.py       # Historique des scans de badges QR
    │   ├── interaction.py      # Visites de stands et dépôts de CV
    │   ├── survey.py           # Enquêtes de satisfaction
    │   └── announcement.py     # Annonces diffusées
    └── schemas/                # Schémas de validation Pydantic v2
```

---

## ⚡ Fonctionnalités Techniques

1. **Validation Stricte des Emails Institutionnels** : Seules les adresses se terminant par `@emsi-edu.ma` peuvent s'inscrire ou se connecter.
2. **Double Authentification Hybride** :
   - Inscription classique par mot de passe avec hachage de pointe **Argon2 / Bcrypt**.
   - **SSO Microsoft Entra ID** : Échange de code d'autorisation OAuth2 contre un jeton Microsoft et récupération automatique du profil via la **Microsoft Graph API** (`https://graph.microsoft.com/v1.0/me`).
3. **Jetons QR Personnalisés** : Chaque participant reçoit à la création un jeton QR unique cryptographique au format `EMSI-2026-<uuid>`.
4. **Gestion Dématérialisée des CVs** :
   - Validation stricte des fichiers au format PDF (`application/pdf`).
   - Assainissement du nom de fichier (`CV_Nom_Prenom_<uuid>.pdf`).
   - Suppression automatique de l'ancien fichier physique lors d'un remplacement.
   - Endpoint de téléchargement direct (`FileResponse`).
5. **Notifications Push en Arrière-Plan** : Intégration de `exponent-server-sdk` avec `BackgroundTasks` de FastAPI pour notifier instantanément les utilisateurs sur leurs téléphones sans bloquer les requêtes HTTP.
6. **Statistiques Décisionnelles en Temps Réel** : Requêtes agrégées SQLAlchemy pour générer les indicateurs clés du forum (top entreprises visitées, total CVs, moyennes des avis).

---

## 🗄 Modèles de Données

```mermaid
erDiagram
    USER ||--o{ BADGE_SCAN : "is scanned"
    USER ||--o{ INTERACTION : "interacts"
    USER ||--o| SURVEY : "submits"
    ENTERPRISE ||--o{ INTERACTION : "receives"

    USER {
        int id PK
        string email UK
        string hashed_password
        string first_name
        string last_name
        string filiere
        string promo
        string site
        string classe
        string cv_url
        string github_url
        text skills
        string role "student | recruiter | admin"
        string expo_push_token
        string qr_code_token UK
    }

    ENTERPRISE {
        int id PK
        string name
        string category "Diamond | Gold | Silver"
        string logo_url
        text description
        text target_profiles
    }

    BADGE_SCAN {
        int id PK
        int student_id FK
        string student_email
        int scanned_by_id FK
        string scanned_by_email
        datetime scanned_at
        text notes
        string location
    }

    INTERACTION {
        int id PK
        int user_id FK
        int enterprise_id FK
        boolean visited
        boolean cv_dropped
    }

    SURVEY {
        int id PK
        int user_id FK
        int rating
        text feedback
        datetime created_at
    }

    ANNOUNCEMENT {
        int id PK
        string title
        text message
        datetime created_at
    }
```

---

## 🌐 Points de Terminaison (Endpoints API)

Toutes les routes sont préfixées par `/api`.

### 🔐 Authentification (`/api/auth`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Inscription étudiant (réservée `@emsi-edu.ma`) | Public |
| `POST` | `/api/auth/login` | Connexion OAuth2 Password Form et émission JWT | Public |
| `POST` | `/api/auth/microsoft` | Échange de code OAuth2 Microsoft Entra ID & connexion | Public |

### 👤 Profil & CV (`/api/profile`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile/` | Récupère le profil de l'utilisateur connecté | Authentifié |
| `PUT` | `/api/profile/` | Met à jour le profil (filière, promo, skills, etc.) | Authentifié |
| `POST` | `/api/profile/upload-cv` | Téléverse un CV PDF (remplace l'ancien) | Authentifié |
| `DELETE` | `/api/profile/delete-cv` | Supprime le CV existant | Authentifié |
| `GET` | `/api/profile/cv/download` | Télécharge le CV PDF de l'étudiant | Authentifié |
| `GET` | `/api/profile/my-qr-token` | Récupère le jeton QR unique de l'utilisateur | Authentifié |

### 🏢 Entreprises (`/api/enterprises`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/enterprises/` | Liste toutes les entreprises sponsors | Authentifié |
| `POST` | `/api/enterprises/` | Ajoute une nouvelle entreprise | Admin |
| `POST` | `/api/enterprises/upload-logo` | Téléverse le logo d'une entreprise | Admin |
| `PUT` | `/api/enterprises/{id}` | Modifie une entreprise existante | Admin |
| `DELETE` | `/api/enterprises/{id}` | Supprime une entreprise | Admin |

### 🔍 Badges & Scans (`/api/badge`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/badge/scan` | Scanne et enregistre le badge QR d'un étudiant | Admin / Recruteur |
| `GET` | `/api/badge/my-scans` | Historique des scans effectués par le recruteur | Admin / Recruteur |
| `GET` | `/api/badge/search-student` | Recherche d'un étudiant par email | Admin / Recruteur |

### 🤝 Interactions & Stands (`/api/interactions`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/interactions/` | Marquer un stand comme visité ou CV déposé | Authentifié |
| `GET` | `/api/interactions/` | Liste de mes interactions | Authentifié |

### 📢 Annonces & Push (`/api/announcements`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/announcements/` | Publie une annonce et envoie des pushs Expo | Admin |
| `GET` | `/api/announcements/` | Liste les dernières annonces du forum | Authentifié |
| `PUT` | `/api/announcements/token` | Enregistre le token de notification push mobile | Authentifié |

### 📊 Tableau de Bord & Enquêtes (`/api/admin` & `/api/survey`)
| Méthode | Route | Description | Accès |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/kpis` | Métriques globales du forum (visites, CVs, note) | Admin |
| `GET` | `/api/survey/` | Récupère l'avis soumis par l'utilisateur | Authentifié |
| `POST` | `/api/survey/` | Soumet ou met à jour la note et le feedback | Authentifié |

---

## 🛠 Installation & Démarrage

### 1. Préparation de l'environnement virtuel

```bash
cd emsi-forum-backend

# Utilisation recommandée de Astral uv :
uv venv
# Activer sous Windows :
.venv\Scripts\activate
# Activer sous Linux/macOS :
# source .venv/bin/activate

# Installation des dépendances
uv pip install -r pyproject.toml
```

### 2. Configuration du fichier `.env`

Créez un fichier `.env` à la racine de `emsi-forum-backend/` :

```env
DATABASE_URL=postgresql://postgres:mot_de_passe@localhost:5432/emsi_forum
SECRET_KEY=votre_cle_secrete_jwt_generee_aleatoirement
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 3. Lancement de l'API

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

- **Documentation Swagger interactive** : [http://localhost:8000/docs](http://localhost:8000/docs)
- **Documentation Redoc** : [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🌱 Initialisation de la Base de Données

Un script de pré-remplissage (`src/core/init_db.py`) est fourni pour créer automatiquement les données initiales de démonstration :

- **Compte Super Administrateur** : `admin@emsi.ma` (mot de passe : `Admin123$`)
- **Entreprise témoin** : *Capgemini Maroc* (Catégorie Diamond)

---

## 🔒 Sécurité

- Mots de passe chiffrés à l'aide de contextes adaptatifs **Argon2** avec vérification de rehachage transparent.
- Accès aux routes sensibles strictement restreint par rôle (`student`, `recruiter`, `admin`) via les dépendances `get_current_user` et `get_current_admin`.
- Uploads de CVs filtrés par type MIME et extension `.pdf` avec assainissement des noms de chemins contre les failles *Path Traversal*.
