# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Frontend React/Vite
#
# CE FICHIER EST VOLONTAIREMENT VIDE.
# Votre mission : écrire le Dockerfile qui conteneurise le front.
#
# Critères attendus :
#   - Utiliser un multi-stage build (obligatoire ici) :
#       Stage 1 "builder" : image node:20-alpine, installer les dépendances,
#                           builder l'app (npm run build → dossier dist/)
#       Stage 2 "runner"  : image nginx:alpine, copier le dist/ dans
#                           /usr/share/nginx/html, exposer le port 8080
#
# Pourquoi multi-stage ? L'image finale ne doit pas contenir Node ni
# node_modules — juste les fichiers statiques servis par Nginx.
# ─────────────────────────────────────────────────────────────────────────────