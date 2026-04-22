import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

// ─── helpers ──────────────────────────────────────────────────────────────────

function mockFetch(response, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  })
}

// ─── App – rendu initial ──────────────────────────────────────────────────────

describe('App – rendu initial', () => {
  it('affiche le titre DevOps B3', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /devops b3/i })).toBeInTheDocument()
  })

  it('affiche les onglets Connexion et Inscription', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inscription/i })).toBeInTheDocument()
  })

  it("ouvre le formulaire de connexion par défaut", () => {
    render(<App />)
    expect(screen.getByPlaceholderText(/nom d'utilisateur/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/mot de passe/i)).toBeInTheDocument()
  })
})

// ─── App – navigation entre onglets ──────────────────────────────────────────

describe('App – navigation entre onglets', () => {
  it("bascule sur l'onglet Inscription", async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /inscription/i }))
    expect(screen.getByRole('button', { name: /s'inscrire/i })).toBeInTheDocument()
  })

  it('revient sur Connexion depuis Inscription', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /inscription/i }))
    await userEvent.click(screen.getByRole('button', { name: /connexion/i }))
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })
})

// ─── AuthForm – connexion ─────────────────────────────────────────────────────

describe('AuthForm – connexion', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('soumet le formulaire avec les bonnes valeurs', async () => {
    mockFetch({ access_token: 'tok123' })
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'alice', password: 'secret' }),
      })
    )
  })

  it('stocke le token dans localStorage après connexion réussie', async () => {
    mockFetch({ access_token: 'tok123' })
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() => expect(localStorage.getItem('token')).toBe('tok123'))
  })

  it('affiche la GreetPage après connexion réussie', async () => {
    mockFetch({ access_token: 'tok123' })
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() =>
      expect(screen.getByText(/connecté en tant que/i)).toBeInTheDocument()
    )
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it("affiche un message d'erreur si le serveur renvoie 401", async () => {
    mockFetch({ detail: 'Identifiants invalides' }, false)
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'mauvais')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() =>
      expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument()
    )
  })

  it("affiche un message d'erreur si le fetch échoue (réseau)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    await waitFor(() =>
      expect(screen.getByText(/impossible de contacter l'api/i)).toBeInTheDocument()
    )
  })

  it('désactive le bouton pendant le chargement', async () => {
    global.fetch = vi.fn(() => new Promise(() => {}))
    render(<App />)

    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'alice')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'secret')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))

    expect(screen.getByRole('button', { name: /chargement/i })).toBeDisabled()
  })
})

// ─── AuthForm – inscription ───────────────────────────────────────────────────

describe('AuthForm – inscription', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('bascule sur Connexion après une inscription réussie', async () => {
    mockFetch({ message: 'Compte créé' })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /inscription/i }))
    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'bob')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    )
  })

  it("appelle l'endpoint /auth/register", async () => {
    mockFetch({ message: 'ok' })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /inscription/i }))
    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), 'bob')
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.any(Object)
    )
  })
})

// ─── GreetPage ────────────────────────────────────────────────────────────────

describe('GreetPage', () => {
  async function loginAs(username) {
    mockFetch({ access_token: 'tok' })
    render(<App />)
    await userEvent.type(screen.getByPlaceholderText(/nom d'utilisateur/i), username)
    await userEvent.type(screen.getByPlaceholderText(/mot de passe/i), 'pass')
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }))
    await waitFor(() => screen.getByText(/connecté en tant que/i))
  }

  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it("affiche le nom d'utilisateur connecté", async () => {
    await loginAs('alice')
    expect(screen.getByText('alice')).toBeInTheDocument()
  })

  it('affiche le message de bienvenue après le clic', async () => {
    await loginAs('alice')
    mockFetch({ message: 'Bonjour alice !' })

    await userEvent.click(
      screen.getByRole('button', { name: /récupérer le message/i })
    )

    await waitFor(() =>
      expect(screen.getByText(/bonjour alice/i)).toBeInTheDocument()
    )
  })

  it('affiche une erreur si /greet échoue', async () => {
    await loginAs('alice')
    mockFetch({ detail: 'Non autorisé' }, false)

    await userEvent.click(
      screen.getByRole('button', { name: /récupérer le message/i })
    )

    await waitFor(() =>
      expect(screen.getByText(/non autorisé/i)).toBeInTheDocument()
    )
  })

  it('appelle /greet avec le header Authorization', async () => {
    await loginAs('alice')
    mockFetch({ message: 'Salut !' })

    await userEvent.click(
      screen.getByRole('button', { name: /récupérer le message/i })
    )

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/greet'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Bearer'),
          }),
        })
      )
    )
  })

  it('déconnecte et revient au formulaire de connexion', async () => {
    await loginAs('alice')
    await userEvent.click(screen.getByRole('button', { name: /se déconnecter/i }))

    expect(screen.getByRole('heading', { name: /devops b3/i })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
