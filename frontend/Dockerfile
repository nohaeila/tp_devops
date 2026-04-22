# ── STAGE 1 : Compilation du React ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

# ── STAGE 2 : Servir avec Nginx ──
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80