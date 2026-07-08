# ⚡ Quick Start - 5 minutes pour démarrer

## 1️⃣ Cloner le projet

```bash
cd /home/celestin/mes-dossiers/AFROFLIX.TV
git clone <your-repo-url> # ou utilisez le dossier existant
cd afroflix-tv-platform
```

## 2️⃣ Créer les fichiers .env

```bash
# Backend
cat > backend/.env << EOF
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
EOF
```

## 3️⃣ Démarrer Docker

```bash
# Lancer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Voir si tout est up (attendre 30 secondes)
docker-compose logs -f backend
```

## 4️⃣ Vérifier les accès

| Service | URL | Statut |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | ✅ Si "Cannot GET /" |
| **Backend** | http://localhost:5000/api/health | ✅ Si JSON `{"status":"ok"}` |
| **Database** | pgAdmin: http://localhost:5050 | ✅ admin@afroflix-tv.com / admin123 |

## 5️⃣ Premier test (optionnel)

```bash
# Vérifier la connexion API
curl http://localhost:5000/api/health

# Devrait retourner:
# {"status":"ok","timestamp":"2024-06-29T..."}
```

## 🎉 Bravo ! Vous êtes prêt

Commandes utiles :

```bash
# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Arrêter
docker-compose down

# Redémarrer
docker-compose restart

# Nettoyer tout (attention!)
docker-compose down -v
```

## 📁 Structure générée

```
afroflix-tv-platform/
├── backend/          # API Node.js/Express
├── frontend/         # React app
├── docker/           # Configs Docker
├── docs/             # Documentation
└── docker-compose.yml # Orchestration
```

## 🚀 Prochaines étapes

1. **Développement du contenu**
   - Créer pages films
   - Ajouter acteurs
   - Écrire articles

2. **Développement features**
   - Implémenter les routes restantes
   - Ajouter l'authentification
   - Gérer les commentaires

3. **SEO & AdSense**
   - Configurer Google Analytics
   - Créer sitemap
   - Demander approbation AdSense

4. **Déploiement**
   - Configurer serveur production
   - Sécuriser avec SSL
   - Mettre en ligne

## 📞 Besoin d'aide ?

Consultez les fichiers :
- `README.md` - Vue générale
- `docs/DEPLOYMENT.md` - Guide production
- `docs/legal-pages/` - Pages légales

---

**Maintenant, développez ! 🎬**
