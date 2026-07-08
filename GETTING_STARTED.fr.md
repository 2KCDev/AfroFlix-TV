# 🚀 Démarrage - Plateforme AFROFLIX.TV

Bienvenue sur la plateforme AFROFLIX.TV ! Ce guide vous aide à démarrer en 5 minutes.

## ✅ Prérequis

- **Docker** (v20.10+) + **Docker Compose**
- **Git** (optionnel)
- **Navigateur web** (Chrome, Firefox, Safari, Edge)

## 1️⃣ Installation (2 minutes)

### Option A : Depuis le dossier existant

```bash
cd /home/celestin/mes-dossiers/AFROFLIX.TV/afroflix-tv-platform

# Créer le fichier .env pour le backend
cat > backend/.env << 'ENVFILE'
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
DB_HOST=db
DB_PORT=5432
DB_NAME=afroflix_tv_db
DB_USER=afroflix_tv
DB_PASSWORD=afroflix_tv123
JWT_SECRET=your-super-secret-key-change-later
GOOGLE_ADSENSE_ENABLED=false
ENVFILE
```

### Option B : Depuis Git (si vous avez cloné)

```bash
git clone <repo-url>
cd afroflix-tv-platform
cp backend/.env.example backend/.env
# Éditer backend/.env si nécessaire
```

## 2️⃣ Lancer les services (2 minutes)

```bash
# Démarrer tous les containers Docker
docker-compose up -d

# Vérifier le statut (attendre 30 secondes)
docker-compose ps

# Voir les logs (optionnel)
docker-compose logs -f backend
```

## 3️⃣ Vérifier les accès (1 minute)

Ouvrez votre navigateur et testez :

| Service | URL | Attendu |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Page React affichée |
| **Backend** | http://localhost:5000/api/health | JSON `{"status":"ok"}` |
| **Database** | http://localhost:5050 | pgAdmin login |

### Test pgAdmin (optionnel)
- URL: http://localhost:5050
- Email: `admin@afroflix-tv.com`
- Password: `admin123+`

## 4️⃣ Modifier le code (développement)

Le code se met à jour **automatiquement** quand vous modifiez les fichiers :

```bash
# Éditer backend
nano backend/src/index.js
# Les changements apparaissent immédiatement

# Éditer frontend
nano frontend/src/App.js
# Le navigateur rafraîchit automatiquement
```

## 5️⃣ Arrêter les services

```bash
# Arrêter (sans supprimer les données)
docker-compose down

# Arrêter + nettoyer les données
docker-compose down -v
```

---

## 📚 Documentation Disponible

Consultez ces fichiers selon vos besoins :

- **🚀 `README.md`** - Vue d'ensemble complète
- **⚡ `QUICKSTART.md`** - Démarrage ultra-rapide  
- **📋 `PROJECT_SUMMARY.md`** - État d'avancement
- **🔧 `docs/DEPLOYMENT.md`** - Déploiement production
- **✅ `docs/ADSENSE_CHECKLIST.md`** - Conformité Google
- **📖 `docs/legal-pages/`** - Pages légales (modèles)

## 🎯 Prochaines Étapes

### Court terme (cette semaine)
1. [ ] Modifier les pages React dans `frontend/src/pages/`
2. [ ] Ajouter des routes backend dans `backend/src/routes/`
3. [ ] Tester l'API avec Postman ou curl
4. [ ] Créer du contenu (films, acteurs)

### Moyen terme (dans 1-2 semaines)
1. [ ] Implémenter l'authentification
2. [ ] Créer le système de commentaires
3. [ ] Ajouter la recherche
4. [ ] Configurer Google Analytics

### Long terme (avant lancement)
1. [ ] Sécuriser le site (SSL, HTTPS)
2. [ ] Optimiser la performance (PageSpeed 70+)
3. [ ] Mettre en ligne (domaine + serveur)
4. [ ] Demander approbation Google AdSense

## 🐛 Troubleshooting

### "Cannot GET /"
**Problème** : Frontend ne charge pas
**Solution** :
```bash
docker-compose logs -f frontend
# Vérifier si 'npm start' s'est bien lancé
docker-compose exec frontend npm install
```

### "Cannot connect to API"
**Problème** : Backend inaccessible
**Solution** :
```bash
docker-compose logs -f backend
# Vérifier si le serveur écoute le port 5000
curl http://localhost:5000/api/health
```

### "Database connection error"
**Problème** : BD PostgreSQL ne démarre pas
**Solution** :
```bash
docker-compose logs -f db
# Vérifier les permissions
docker-compose down -v && docker-compose up -d
```

### Port déjà utilisé
**Problème** : "Address already in use"
**Solution** :
```bash
# Trouver quel service utilise le port
lsof -i :3000  # Frontend
lsof -i :5000  # Backend
lsof -i :5432  # Database
lsof -i :5050  # pgAdmin

# Arrêter les services précédents
docker-compose down
```

## 💡 Tips Utiles

### Voir les logs en temps réel
```bash
# Tous les logs
docker-compose logs -f

# Juste backend
docker-compose logs -f backend

# Juste frontend
docker-compose logs -f frontend

# Dernières 50 lignes
docker-compose logs --tail 50 backend
```

### Accéder au terminal du container
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec db psql -U afroflix_tv -d afroflix_tv_db
```

### Redémarrer un service
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db
```

### Reconstruire les images
```bash
docker-compose build --no-cache
docker-compose up -d
```

## 📊 Fichiers Importants

```
afroflix-tv-platform/
├── README.md ..................... Documentation principale
├── QUICKSTART.md ................. Démarrage 5 min
├── PROJECT_SUMMARY.md ............ État du projet
├── docker-compose.yml ............ Configuration services
├── docker-compose.dev.yml ........ Config développement
│
├── backend/
│   ├── package.json .............. Dépendances Node
│   ├── Dockerfile ................ Image Docker
│   └── src/
│       ├── index.js .............. Serveur principal
│       ├── routes/ ............... Endpoints API
│       └── db/ ................... Database & schema
│
├── frontend/
│   ├── package.json .............. Dépendances React
│   ├── Dockerfile ................ Production image
│   ├── Dockerfile.dev ............ Dev image
│   ├── nginx.conf ................ Serveur web
│   └── src/
│       ├── App.js ................ Composant principal
│       └── pages/ ................ Pages React
│
└── docs/
    ├── DEPLOYMENT.md ............. Mise en production
    ├── ADSENSE_CHECKLIST.md ....... Conformité Google
    └── legal-pages/ .............. Pages légales (modèles)
```

## 🔐 Sécurité

### Ne jamais commiter
- `.env` (contient mots de passe)
- `node_modules/`
- `.DS_Store`
- `*.log`

### Avant la production
1. Changer `JWT_SECRET` par une clé sécurisée
2. Changer `DB_PASSWORD` par un mot de passe fort
3. Configurer SSL/HTTPS
4. Activer CORS restrictif
5. Vérifier `helmet` config

## 📞 Support

### Questions sur le projet
→ Voir `README.md`

### Problèmes de déploiement
→ Voir `docs/DEPLOYMENT.md`

### Conformité Google AdSense
→ Voir `docs/ADSENSE_CHECKLIST.md`

### Pages légales
→ Voir `docs/legal-pages/`

---

## ✨ Résumé

| Étape | Commande | Temps |
|-------|----------|-------|
| 1️⃣ Configuration | `cat > backend/.env` | 1 min |
| 2️⃣ Démarrer | `docker-compose up -d` | 1 min |
| 3️⃣ Vérifier | Ouvrir http://localhost:3000 | 1 min |
| 4️⃣ Développer | Éditer les fichiers | ∞ |
| 5️⃣ Arrêter | `docker-compose down` | <1 min |

**Total : ~5 minutes pour démarrer ! 🎉**

---

**Plateforme AFROFLIX.TV v1.0**
*Créée pour le développement rapide et le déploiement production*

Mise à jour : Juin 2024
