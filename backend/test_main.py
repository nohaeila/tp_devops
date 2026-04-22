"""
Tests rapides pour l'API FastAPI – utilise le TestClient (pas de MongoDB réel).
La base Mongo est mockée via unittest.mock pour rester isolé.
"""
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

import main  # l'app FastAPI

client = TestClient(main.app)


# ─── helpers ──────────────────────────────────────────────────────────────────

def make_token(username: str) -> str:
    """Génère un JWT valide avec la clé secrète de l'app."""
    return main.create_token(username)


# ─── GET / ────────────────────────────────────────────────────────────────────

def test_health_check():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ─── POST /auth/register ──────────────────────────────────────────────────────

def test_register_success():
    with patch.object(main.users, "find_one", return_value=None), \
         patch.object(main.users, "insert_one", return_value=MagicMock()), \
         patch.object(main.pwd_context, "hash", return_value="hashed"):
        res = client.post("/auth/register", json={"username": "alice", "password": "secret"})
    assert res.status_code == 200
    assert "alice" in res.json()["message"]


def test_register_duplicate_username():
    with patch.object(main.users, "find_one", return_value={"username": "alice"}):
        res = client.post("/auth/register", json={"username": "alice", "password": "secret"})
    assert res.status_code == 400
    assert "déjà pris" in res.json()["detail"]


# ─── POST /auth/login ─────────────────────────────────────────────────────────

def test_login_success():
    fake_user = {"username": "alice", "password": "hashed"}

    with patch.object(main.users, "find_one", return_value=fake_user), \
         patch.object(main.pwd_context, "verify", return_value=True):
        res = client.post("/auth/login", json={"username": "alice", "password": "secret"})

    assert res.status_code == 200
    assert "access_token" in res.json()
    assert res.json()["token_type"] == "bearer"


def test_login_wrong_password():
    fake_user = {"username": "alice", "password": "hashed"}

    with patch.object(main.users, "find_one", return_value=fake_user), \
         patch.object(main.pwd_context, "verify", return_value=False):
        res = client.post("/auth/login", json={"username": "alice", "password": "wrong"})

    assert res.status_code == 401
    assert "Identifiants incorrects" in res.json()["detail"]


def test_login_unknown_user():
    with patch.object(main.users, "find_one", return_value=None):
        res = client.post("/auth/login", json={"username": "nobody", "password": "pass"})
    assert res.status_code == 401


# ─── GET /greet ───────────────────────────────────────────────────────────────

def test_greet_success():
    token = make_token("alice")
    res = client.get("/greet", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "alice" in res.json()["message"]


def test_greet_no_token():
    res = client.get("/greet")
    assert res.status_code in (401, 403)  # HTTPBearer renvoie 401 ou 403 selon la version FastAPI


def test_greet_invalid_token():
    res = client.get("/greet", headers={"Authorization": "Bearer token.invalide.ici"})
    assert res.status_code == 401
    assert "invalide" in res.json()["detail"].lower()
