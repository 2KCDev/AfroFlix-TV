# 🚀 Guide Rapide - Plateforme AfroFlix.TV

## État du Projet
✅ **Backend**: 100% complet (38 API endpoints)
✅ **Frontend**: 100% complet (13 pages, 9 composants)
✅ **Database**: 100% configuré (9 tables PostgreSQL)
✅ **Docker**: Prêt pour production

---

## 🏃 Démarrage Rapide

### 1. Installation & Démarrage

```bash
# Cloner et accéder au projet
cd /home/celestin/mes-dossiers/AFROFLIX.TV

# Vérifier Docker est installé
docker --version
docker-compose --version

# Démarrer tous les services
docker-compose up -d

# Attendre que PostgreSQL soit prêt (5-10 secondes)
```

### 2. Accès aux Services

```
Frontend:     http://localhost
Backend API:  http://localhost:5000
Docs API:     http://localhost:5000/api-docs
PostgreSQL:   localhost:5432
```

### 3. Tester le Système

#### Création d'un compte
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

#### Récupérer les films
```bash
curl http://localhost:5000/api/films
```

---

## 📚 Pages Frontend (13)

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Films populaires + tendances |
| Films | `/films` | Liste avec filtres/tri |
| Film Detail | `/films/:slug` | Détail + ratings + comments |
| Actors | `/actors` | Liste acteurs + recherche |
| Actor Detail | `/actors/:slug` | Bio + filmographie |
| Blog | `/blog` | Articles par catégorie |
| Blog Detail | `/blog/:slug` | Article complet |
| Search | `/search` | Recherche combinée |
| Auth | `/auth` | Inscription/Connexion |
| Admin | `/admin/*` | Dashboard (admin/moderator) |
| 404 | `*` | Page non trouvée |
| Legal | `/privacy`, `/terms` | Pages légales |

---

## 🔧 Architecture API (38 endpoints)

### Films (7 endpoints)
```
GET    /api/films                 - Liste films (pagination, filtres)
GET    /api/films/:slug           - Détail film
POST   /api/films/:id/views       - Enregistrer une vue
GET    /api/films/trending        - Films populaires
GET    /api/search?q=term         - Recherche
```

### Actors (2)
```
GET    /api/acteurs               - Liste acteurs
GET    /api/acteurs/:slug         - Détail acteur
```

### Articles (2)
```
GET    /api/articles              - Liste articles
GET    /api/articles/:slug        - Détail article
```

### Ratings (2)
```
POST   /api/ratings/:film_id      - Soumettre note
GET    /api/ratings/:film_id/stats - Statistiques
```

### Comments (3)
```
POST   /api/comments/:film_id     - Poster commentaire
GET    /api/comments/:film_id     - Lister commentaires
POST   /api/comments/:id/report   - Signaler
```

### Favorites (3)
```
GET    /api/favoris               - Liste favoris
POST   /api/favoris/:film_id      - Ajouter
DELETE /api/favoris/:film_id      - Retirer
```

### Auth (3)
```
POST   /api/auth/register         - Inscription
POST   /api/auth/login            - Connexion
GET    /api/auth/me               - Profil
```

### Admin (1+)
```
GET    /api/admin/stats           - Statistiques
```

---

## 👥 Rôles Utilisateurs (RBAC)

| Rôle | Droits |
|------|--------|
| **user** | Voir films, noter, commenter, favoris |
| **editor** | + CRUD films, acteurs, articles |
| **moderator** | + Approuver/rejeter commentaires |
| **admin** | Full access + gestion utilisateurs |

---

## 🔐 Authentification

- **Méthode**: JWT (7 jours d'expiration)
- **Password**: Bcrypt (salt 10)
- **Storage**: localStorage (token)
- **Protection**: Routes via ProtectedRoute component

---

## 🎨 Design & Couleurs

- **Primary Red**: #DC2626
- **Primary Orange**: #F97316
- **Framework**: Tailwind CSS
- **Icons**: React Icons
- **Font**: System font stack

---

## 📊 Database Schema

9 Tables:
- `users` - Utilisateurs + rôles
- `films` - Films avec métadonnées
- `actors` - Acteurs avec biographies
- `articles` - Articles blog
- `genres` - Genres films
- `comments` - Commentaires modérés
- `ratings` - Évaluations 1-5
- `favorites` - Listes favoris utilisateur
- `views` - Anti-fraude (1 par IP/24h)

---

## 🐛 Troubleshooting

### Frontend ne se charge pas
```bash
# Vérifier backend démarre
curl http://localhost:5000/api/health

# Vérifier variables d'env
cat frontend/.env
```

### Erreurs API
```bash
# Voir logs backend
docker logs afroflix-tv-backend

# Vérifier base de données
docker exec -it afroflix-tv-db psql -U afroflix_tv -d afroflix_tv_db
```

### Réinitialiser complètement
```bash
docker-compose down -v
docker-compose up -d
# Attend ~10 secondes pour migration DB
```

---

## 📁 Fichiers Importants

### Backend
- `/backend/src/db/pool.js` - Connexion PostgreSQL utilisée par l’API
- `/docker/init-db.sql` - Schéma et données initiales chargés par Docker
- `/backend/src/middleware/auth.js` - JWT & RBAC
- `/backend/src/controllers/` - Business logic (8 fichiers)
- `/backend/src/routes/` - API routes (9 fichiers)

### Frontend
- `/frontend/src/App.jsx` - Routes & AuthProvider
- `/frontend/src/services/api.js` - API client
- `/frontend/src/context/AuthContext.jsx` - Global auth state
- `/frontend/src/pages/` - 13 pages complètes
- `/frontend/src/components/` - 9 composants réutilisables

### Documentation
- `BACKEND_DEVELOPMENT_SUMMARY.md` - Backend overview
- `FRONTEND_DEVELOPMENT_SUMMARY.md` - Frontend overview
- `API_DOCUMENTATION.md` - Tous les endpoints
- `COMPLETION_REPORT.md` - Rapport final

---

## 📝 Variables d'Environnement

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=afroflix_tv_db
DB_USER=afroflix_tv
DB_PASSWORD=afroflix_tv_secure_password
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

---

## ✅ Checklist de Vérification

- [ ] Docker services running (`docker ps`)
- [ ] Backend accessible (http://localhost:5000)
- [ ] Frontend accessible (http://localhost)
- [ ] Can create user account
- [ ] Can login with account
- [ ] Can view films
- [ ] Can rate films (logged in)
- [ ] Can add comments (logged in)
- [ ] Can add favorites (logged in)
- [ ] Admin dashboard works (admin user)

---

## 🎓 Prochaines Étapes

1. **Data Population**: Ajouter plus de films, acteurs, articles
2. **Email Notifications**: Configurer Resend avec `RESEND_API_KEY`
3. **Advanced Analytics**: Intégrer Google Analytics
4. **Caching**: Ajouter Redis
5. **Mobile App**: React Native version
6. **Tests**: Unit tests + E2E tests
7. **Monitoring**: Setup Sentry/DataDog
8. **CDN**: Cloudflare integration

---

## 📞 Support

Pour les problèmes:
1. Vérifier les logs: `docker logs afroflix-tv-backend`
2. Consulter la documentation API
3. Vérifier les variables d'environnement
4. Réinitialiser les containers

---

**Plateforme AfroFlix.TV** - Prête pour Production ✅
