FROM node:20-alpine

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copier tous les fichiers du projet
COPY . .

# Exposer le port utilisé par server.js
EXPOSE 3001

# Lancer le serveur
CMD ["node", "server.js"]