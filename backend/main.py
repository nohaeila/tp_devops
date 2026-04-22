from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
import jwt
import os
from datetime import datetime, timedelta

app = FastAPI()

# ─── CORS ────────────────────────────────────────────────────────────────────
# Autorise le front React (port 5173 en dev, port 80 en prod) à appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── CONFIG ──────────────────────────────────────────────────────────────────
# Toutes les variables sensibles viennent des variables d'environnement
# Jamais de valeurs hardcodées en production
MONGO_URL   = os.getenv("MONGO_URL", "mongodb://localhost:27017")
SECRET_KEY  = os.getenv("SECRET_KEY", "changeme_in_production")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_MINUTES = 60

# ─── CONNEXION MONGODB ───────────────────────────────────────────────────────
client = MongoClient(MONGO_URL)
db     = client["devops_b3"]
users  = db["users"]

# ─── HACHAGE DES MOTS DE PASSE ───────────────────────────────────────────────
# On ne stocke jamais un mot de passe en clair — bcrypt le hache
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── SCHÉMAS PYDANTIC ────────────────────────────────────────────────────────
# Définit la forme attendue des requêtes entrantes
class UserRegister(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# ─── HELPERS JWT ─────────────────────────────────────────────────────────────
def create_token(username: str) -> str:
    """Crée un JWT signé avec une expiration."""
    payload = {
        "sub": username,
        "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    """Décode et valide un JWT, retourne le username."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ─── ROUTES ──────────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    """Route de santé — utilisée par Docker et la CI pour vérifier que l'app tourne."""
    return {"status": "ok", "message": "API DevOps B3 opérationnelle"}


@app.post("/auth/register")
def register(body: UserRegister):
    """Inscription — vérifie que le username n'existe pas, hache le mot de passe."""
    if users.find_one({"username": body.username}):
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur est déjà pris")

    hashed = pwd_context.hash(body.password)
    users.insert_one({"username": body.username, "password": hashed})

    return {"message": f"Compte créé pour {body.username}"}


@app.post("/auth/login")
def login(body: UserLogin):
    """Login — vérifie le mot de passe et retourne un JWT."""
    user = users.find_one({"username": body.username})

    if not user or not pwd_context.verify(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    token = create_token(body.username)
    return {"access_token": token, "token_type": "bearer"}


@app.get("/greet")
def greet(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """Route protégée — nécessite un JWT valide dans le header Authorization."""
    username = decode_token(credentials.credentials)
    return {"message": f"Bonjour {username}, bienvenue sur DevOps B3 ! 👋"}
