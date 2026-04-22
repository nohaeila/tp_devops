import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ─── Formulaire de connexion / inscription ────────────────────────────────
function AuthForm({ mode, onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.detail || 'Une erreur est survenue')
        return
      }

      // Si login réussi, on stocke le token et on notifie le parent
      if (mode === 'login') {
        localStorage.setItem('token', data.access_token)
        onSuccess(username)
      } else {
        onSuccess(null) // inscription réussie, on bascule sur le login
      }
    } catch {
      setError("Impossible de contacter l'API — vérifiez que le backend tourne")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <input
        type="text"
        placeholder="Nom d'utilisateur"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
      </button>
    </form>
  )
}

// ─── Page d'accueil après connexion ──────────────────────────────────────
function GreetPage({ username, onLogout }) {
  const [greeting, setGreeting] = useState('')
  const [error, setError]       = useState('')

  const fetchGreeting = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/greet`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail)
        return
      }
      setGreeting(data.message)
    } catch {
      setError("Impossible de contacter l'API")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    onLogout()
  }

  return (
    <div className="greet">
      <h2>Connecté en tant que <strong>{username}</strong></h2>
      <button onClick={fetchGreeting}>Récupérer le message de bienvenue</button>
      {greeting && <p className="greeting">{greeting}</p>}
      {error   && <p className="error">{error}</p>}
      <button onClick={handleLogout} className="logout">Se déconnecter</button>
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [loggedUser, setLoggedUser] = useState(null)

  const handleAuthSuccess = (username) => {
    if (username) {
      setLoggedUser(username)
    } else {
      // Inscription réussie → on bascule sur le login
      setMode('login')
    }
  }

  if (loggedUser) {
    return <GreetPage username={loggedUser} onLogout={() => setLoggedUser(null)} />
  }

  return (
    <div className="container">
      <h1>DevOps B3</h1>
      <div className="tabs">
        <button
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          Connexion
        </button>
        <button
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          Inscription
        </button>
      </div>
      <AuthForm mode={mode} onSuccess={handleAuthSuccess} />
    </div>
  )
}
