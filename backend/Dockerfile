FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du projet
COPY . .

# ===== DEBUG =====
RUN echo "===== DEBUG START =====" \
 && pwd \
 && echo "" \
 && echo "===== FILES =====" \
 && ls -la \
 && echo "" \
 && echo "===== PACKAGE.JSON =====" \
 && cat package.json \
 && echo "" \
 && echo "===== NPM SCRIPTS =====" \
 && npm run \
 && echo "===== DEBUG END ====="

# Port exposé
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health >/dev/null || exit 1

# Démarrage
CMD ["npm", "start"]