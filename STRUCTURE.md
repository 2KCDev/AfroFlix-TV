# Architecture du projet - AfroFlix.TV

Racine actuelle:
```text
/home/celestin/mes-dossiers/NOLLYWOOD
```

## Vue d'ensemble

```text
NOLLYWOOD/
├── backend/                 # API REST Node.js / Express
├── frontend/                # Application React / Vite / Tailwind
├── docker/                  # Schema et initialisation PostgreSQL
├── docs/                    # Documentation de deploiement et conformite
├── docker-compose.yml       # Orchestration PostgreSQL + backend + frontend
├── .env                     # Variables Docker Compose locales
├── cahier-des-charges.md    # Cahier des charges conforme au projet reel
├── guide-complet.md         # Guide utilisateur et administration
├── README.md                # Presentation generale
└── STRUCTURE.md             # Ce fichier
```

## Backend

```text
backend/
├── src/
│   ├── index.js                 # Demarrage Express, securite, routes
│   ├── db/
│   │   ├── pool.js              # Connexion PostgreSQL
│   │   └── init.js              # Migrations/contraintes au demarrage
│   ├── middleware/
│   │   └── auth.js              # JWT, optionalAuth, RBAC
│   ├── utils/
│   │   └── validation.js        # Joi, email, mot de passe, pagination, URL
│   ├── controllers/             # Logique metier
│   ├── routes/                  # Routes Express
│   └── services/
│       └── emailService.js      # Emails transactionnels
├── uploads/posters/             # Affiches uploadees
├── Dockerfile
├── package.json
├── .env
└── .env.example
```

Routes principales:
- `/api/auth`: register, login, forgot/reset password, me.
- `/api/films`: films, recherche, tendances, vues, gestion editeur/admin.
- `/api/actors` et `/api/acteurs`: acteurs.
- `/api/articles`: articles et categories.
- `/api/genres`: genres.
- `/api/comments`: commentaires et moderation.
- `/api/ratings`: notes.
- `/api/favorites` et `/api/favoris`: favoris.
- `/api/contact`: formulaire contact et lecture admin.
- `/api/admin`: dashboard et utilisateurs.
- `/api/uploads`: upload affiches.

Securite backend:
- Helmet + CSP;
- CORS configure;
- rate limit global;
- rate limit specifique auth;
- JWT avec secret fort obligatoire en production;
- RBAC: user, editor, moderator, admin;
- Joi pour valider les entrees;
- requetes SQL parametrees;
- bcrypt pour les mots de passe;
- reset token hashe en base;
- contraintes PostgreSQL de second niveau.

## Frontend

```text
frontend/
├── src/
│   ├── App.jsx                  # Routes React
│   ├── index.jsx                # Point d'entree React
│   ├── main.js                  # Compatibilite entree Vite
│   ├── services/api.js          # Client API centralise
│   ├── context/AuthContext.jsx  # Session utilisateur
│   ├── hooks/                   # Hooks films/auth
│   ├── pages/                   # Pages publiques/admin
│   ├── components/              # Layout, cartes, formulaires, admin
│   ├── styles/index.css
│   └── utils/content.js
├── public/
│   ├── ads.txt
│   ├── robots.txt
│   └── sitemap.xml
├── nginx.conf                   # Nginx frontend + proxy API
├── Dockerfile
├── Dockerfile.dev
├── package.json
└── vite.config.js
```

Routes frontend:
- `/`
- `/auth`
- `/films`, `/films/:slug`, `/genre/:genre`
- `/acteurs`, `/acteurs/:slug`
- `/actualites`, `/actualites/:slug`
- `/classements`
- `/critiques`
- `/recherche`
- `/favoris`
- `/admin/*`
- `/about`, `/contact`, `/privacy`, `/terms`, `/cookies`, `/copyright`, `/legal`

Navigation principale:
- Accueil
- Films
- Acteurs
- Actualites
- Classements
- Recherche

Le lien Critiques n'est pas dans le menu principal desktop, mobile ou tablette.

## Base de donnees

Schema source:
```text
docker/init-db.sql
```

Tables:
- users
- films
- actors
- genres
- film_genres
- film_actors
- articles
- comments
- ratings
- favorites
- views
- contact_messages
- password_reset_tokens
- comment_reports

Indexes notables:
- slugs films/acteurs/articles;
- email utilisateurs;
- roles;
- relations;
- files de moderation;
- tokens reset;
- trigrammes sur titres/noms pour recherche.

## Docker

Services:
- `postgres`: PostgreSQL 15 Alpine, volume `postgres_data`.
- `backend`: API Express sur port 5000.
- `frontend`: build React servi par Nginx sur port 80.

Reseau:
- `afroflix-tv-network`.

Volumes:
- `postgres_data`;
- `./backend/uploads:/app/uploads`.

Commandes:
```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose exec postgres psql -U afroflix_tv -d afroflix_tv_db -f /docker-entrypoint-initdb.d/init.sql
```

## Fichiers importants pour developpeurs

- `backend/src/utils/validation.js`: regles de validation serveur.
- `backend/src/middleware/auth.js`: roles et verification JWT.
- `backend/src/db/init.js`: contraintes appliquees au demarrage.
- `docker/init-db.sql`: schema complet et donnees initiales.
- `frontend/src/services/api.js`: toutes les methodes API consommees par l'interface.
- `frontend/src/components/layout/Header.jsx`: menu principal.
- `frontend/src/pages/AdminPanel.jsx`: entree administration.
- `frontend/nginx.conf`: proxy `/api` et `/uploads`.
- `docs/DEPLOYMENT.md`: guide de deploiement.
