# devops-b3

Projet support pour le cours DevOps — Bachelor B3.

Stack : **Python/FastAPI** · **React/Vite** · **MongoDB**

---

## Structure du projet

```
devops-b3/
├── backend/
│   ├── main.py              # API FastAPI (auth + JWT)
│   ├── requirements.txt     # Dépendances Python
│   └── Dockerfile           # À compléter ✏️
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Interface login/inscription
│   │   └── index.css        # Styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile           # À compléter ✏️
├── .github/
│   └── workflows/
│       └── ci.yml           # À compléter ✏️
├── docker-compose.yml       # À compléter ✏️
├── .env.example             # Template des variables d'environnement
├── .gitignore
└── README.md
```

---

## Lancer le projet en local (sans Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows : venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API disponible sur http://localhost:8000
Documentation Swagger sur http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Front disponible sur http://localhost:5173

### MongoDB
Vous avez besoin d'une instance MongoDB locale ou via Docker :
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

---

## Ce que vous devez faire

### Jour 1 — Docker

**1. Écrire le Dockerfile du backend** (`backend/Dockerfile`)
- Image de base : `python:3.12-slim`
- Installer les dépendances depuis `requirements.txt`
- Exposer le port 8000
- Lancer avec : `uvicorn main:app --host 0.0.0.0 --port 8000`

**2. Écrire le Dockerfile du frontend** (`frontend/Dockerfile`)
- Multi-stage obligatoire :
  - Stage 1 : builder avec `node:20-alpine`, `npm ci`, `npm run build`
  - Stage 2 : `nginx:alpine` qui sert le dossier `dist/`

**3. Compléter le docker-compose.yml**
- 3 services : `backend`, `frontend`, `mongo`
- Variables d'environnement depuis le fichier `.env`
- Volume persistant pour MongoDB
- L'ensemble doit démarrer avec `docker compose up -d`

### Jour 2 — CI/CD

**4. Compléter le workflow GitHub Actions** (`.github/workflows/ci.yml`)
- Déclenché sur push sur `main/master`
- Run tests du backend
- Run tests du frontend
- Build frontend
- Login Docker Hub via secrets
- Build et push des deux images
- Possibilité de bonus si vous faites d'autres étapes de vôtre choix

---

## Endpoints de l'API

| Méthode | Route            | Auth     | Description                        |
|---------|------------------|----------|------------------------------------|
| GET     | `/`              | Non      | Health check                       |
| POST    | `/auth/register` | Non      | Créer un compte                    |
| POST    | `/auth/login`    | Non      | Connexion → retourne un JWT        |
| GET     | `/greet`         | JWT      | Message de bienvenue personnalisé  |

---

## Variables d'environnement

Copiez `.env.example` en `.env` avant de démarrer :
```bash
cp .env.example .env
```

| Variable    | Description                         | Valeur par défaut              |
|-------------|-------------------------------------|--------------------------------|
| `SECRET_KEY`| Clé de signature des JWT            | `changeme_local_dev`           |
