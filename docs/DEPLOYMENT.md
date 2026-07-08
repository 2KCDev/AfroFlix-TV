# 🚀 Guide de Déploiement - AFROFLIX.TV Platform

## Phases de Déploiement

### Phase 1 : Développement local (FAIT ✅)
- [x] Architecture Docker complète
- [x] Base de données PostgreSQL
- [x] Backend Express.js
- [x] Frontend React
- [x] Configuration locale

### Phase 2 : Tests et Optimisation (À FAIRE)
- [ ] Tests unitaires et intégration
- [ ] Tests de performance (Core Web Vitals)
- [ ] Optimisation des images
- [ ] Minification du code
- [ ] Pagination et lazy loading

### Phase 3 : Configuration Production
- [ ] Sécurité : SSL/TLS, headers HTTP
- [ ] Database : Backups automatiques
- [ ] Monitoring : Logs, alertes
- [ ] CDN : Cloudflare ou AWS CloudFront
- [ ] Email : Configuration SMTP
- [ ] DNS : Pointage du domaine

### Phase 4 : Contenu Éditorial
- [ ] Création de 30-50 pages films minimum
- [ ] Fiches acteurs (150+ mots minimum)
- [ ] Articles blog (600+ mots minimum)
- [ ] Vérification des droits d'auteur

### Phase 5 : Conformité Google AdSense
- [ ] Pages légales complètes
- [ ] Google Search Console
- [ ] Google Analytics
- [ ] robots.txt et sitemap
- [ ] ads.txt configuré
- [ ] Demande AdSense

---

## Configuration Production Détaillée

### 1. Variables d'environnement sécurisées

**Backend (.env production)**
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://afroflix.tv

DB_HOST=db-prod-instance
DB_PORT=5432
DB_NAME=afroflix_tv_prod
DB_USER=afroflix_tv_prod_user
DB_PASSWORD=GENERATE_STRONG_PASSWORD_32_CHARS_MIN
DB_SSL=true

JWT_SECRET=GENERATE_STRONG_KEY_64_CHARS_MIN
JWT_EXPIRATION=7d

# Google AdSense
GOOGLE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxx
GOOGLE_ADSENSE_ENABLED=true

# Email Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxx
EMAIL_NOREPLY=noreply@afroflix-tv.com
EMAIL_INFO=info@afroflix-tv.com
EMAIL_ADMIN=admin@afroflix-tv.com
EMAIL_SUPPORT=support@afroflix-tv.com
EMAIL_CONTACT=contact@afroflix-tv.com

# Sentry (error tracking)
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxx

# Logs
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2. Certificats SSL/TLS

```bash
# Utiliser Let's Encrypt avec Certbot
sudo certbot certonly --standalone -d afroflix.tv -d www.afroflix.tv

# Automatiser le renouvellement (tous les 90 jours)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Vérifier l'auto-renouvellement
sudo certbot renew --dry-run
```

### 3. Configuration Nginx Production

```nginx
# /etc/nginx/conf.d/afroflix.tv.conf

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name afroflix.tv www.afroflix.tv;
  return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
  listen 443 ssl http2;
  server_name afroflix.tv www.afroflix.tv;

  # Certificats SSL
  ssl_certificate /etc/letsencrypt/live/afroflix.tv/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/afroflix.tv/privkey.pem;

  # Configuration SSL stricte
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Sécurité des headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
  gzip_min_length 1000;

  # Cache
  client_max_body_size 10M;
  keepalive_timeout 65;

  # Logs
  access_log /var/log/nginx/afroflix.tv_access.log combined;
  error_log /var/log/nginx/afroflix.tv_error.log warn;

  # Root
  root /usr/share/nginx/html;
  index index.html;

  # SPA routing
  location / {
    try_files $uri $uri/ /index.html;
    expires 1h;
  }

  # Static assets - long cache
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # API proxy
  location /api/ {
    proxy_pass http://backend:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
  }

  # Security files
  location /robots.txt {
    expires 30d;
  }

  location /ads.txt {
    expires 7d;
  }

  location /sitemap.xml {
    expires 24h;
  }
}
```

### 4. Docker Compose Production

```yaml
version: '3.9'

services:
  db:
    image: postgres:15-alpine
    container_name: afroflix.tv-db-prod
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - /backups/afroflix.tv:/var/lib/postgresql/data
      - ./docker/backups.sh:/docker-entrypoint-initdb.d/backups.sh
    networks:
      - afroflix.tv-prod
    restart: always
    # Backup daily
    labels:
      - "com.afroflix.tv.backup=daily"

  backend:
    image: afroflix-tv-backend:prod-latest
    container_name: afroflix-tv-backend-prod
    environment:
      NODE_ENV: production
      PORT: 5000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?sslmode=require
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_ADSENSE_CLIENT_ID: ${GOOGLE_ADSENSE_CLIENT_ID}
    depends_on:
      db:
        condition: service_healthy
    networks:
      - afroflix.tv-prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: afroflix-tv-frontend:prod-latest
    container_name: afroflix-tv-frontend-prod
    depends_on:
      - backend
    networks:
      - afroflix.tv-prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  backups:
    driver: local

networks:
  afroflix.tv-prod:
    driver: bridge
```

### 5. Stratégie de Backup

```bash
#!/bin/bash
# backup.sh - Sauvegarde quotidienne

BACKUP_DIR="/backups/afroflix.tv"
DATE=$(date +%Y-%m-%d-%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/afroflix.tv_${DATE}.sql.gz"

# Backup base de données
docker-compose exec -T db pg_dump -U ${DB_USER} ${DB_NAME} | gzip > ${BACKUP_FILE}

# Garder seulement les 30 derniers backups
find ${BACKUP_DIR} -name "afroflix.tv_*.sql.gz" -mtime +30 -delete

# Upload vers S3 (optionnel)
aws s3 cp ${BACKUP_FILE} s3://afroflix.tv-backups/

echo "Backup créé: ${BACKUP_FILE}"
```

### 6. Monitoring et Alertes

```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'afroflix.tv-api'
    static_configs:
      - targets: ['localhost:5000']

  - job_name: 'afroflix-tv-frontend'
    static_configs:
      - targets: ['localhost:80']

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

---

## Checklist de Lancement Production

### Semaine 1 : Infrastructure
- [ ] Domaine acheté et pointé
- [ ] Serveur loué (VPS ou cloud)
- [ ] SSL/TLS configuré
- [ ] Accès SSH sécurisé (clés RSA)
- [ ] Firewall configuré

### Semaine 2 : Application
- [ ] Code deploié et testé
- [ ] Base de données en production
- [ ] Backups automatiques actifs
- [ ] Monitoring en place
- [ ] Logs centralisés

### Semaine 3 : Contenu
- [ ] 30 pages films publiées minimum
- [ ] 10+ articles blog
- [ ] Fiches acteurs complétées
- [ ] Images optimisées

### Semaine 4 : Conformité
- [ ] Google Search Console vérifié
- [ ] Sitemap soumis
- [ ] Analytics configuré
- [ ] ads.txt rempli
- [ ] Pages légales publiées

### Semaine 5 : Optimisation
- [ ] Core Web Vitals vérifiés (PageSpeed 70+)
- [ ] Performance tests
- [ ] SEO audit
- [ ] Accessibilité testée

### Semaine 6 : Google AdSense
- [ ] Vérification finale check-list
- [ ] Demande AdSense
- [ ] Attendre approbation (3-5 jours)
- [ ] Configuration ads
- [ ] Test affichage

---

## URLs Importantes

- **Site production** : https://afroflix.tv
- **Admin** : https://afroflix.tv/admin
- **Analytics** : https://analytics.google.com (configurer GA4)
- **Search Console** : https://search.google.com/search-console
- **AdSense** : https://adsense.google.com
- **pgAdmin** : Accès interne uniquement

---

## Support et Maintenance

### Logs d'erreur
```bash
# Backend
docker logs -f afroflix-tv-backend-prod

# Frontend/Nginx
docker logs -f afroflix-tv-frontend-prod

# Database
docker logs -f afroflix.tv-db-prod
```

### Mise à jour
```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose build --no-cache

# Redeploy
docker-compose down && docker-compose up -d
```

### Rollback
```bash
# Si quelque chose se casse
git revert <commit>
docker-compose up -d
```

---

Mise à jour : Juin 2024
