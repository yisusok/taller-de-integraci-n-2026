import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
import { LoginForm } from './components/Login/LoginForm'
import { RegisterForm } from './components/Register/RegisterForm'
import { ResetPasswordForm } from './components/ResetPassword/ResetPasswordForm'
import { Footer } from './components/Footer/Footer'
import { Profile } from './components/Profile/Profile'
import { LoginButton } from './components/Login/Login'

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { tab: 'login' as const, token: '' }
  }
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  return {
    tab: (token ? 'reset-password' : 'login') as
      | 'login'
      | 'register'
      | 'forgot-password'
      | 'reset-password'
      | 'overview',
    token: token || '',
  }
}

export default function App() {
  const { isAuthenticated, user, logout } = useAuth0()
  const initial = getInitialState()
  const [activeTab, setActiveTab] = useState<
    'login' | 'register' | 'forgot-password' | 'reset-password' | 'overview'
  >(initial.tab)
  const [resetToken, setResetToken] = useState<string>(initial.token)
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0)

  // Sincronización automática de OAuth con el backend al iniciar sesión
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      const defaultApiUrl =
        (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
        'http://localhost:3000'

      fetch(`${defaultApiUrl}/auth/sync-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          nombre: user.name || user.nickname || 'Usuario Google',
          avatar: user.picture || null,
          providerId: user.sub || null,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Error al sincronizar con el servidor')
          return res.json()
        })
        .then((data) => {
          console.log('Usuario OAuth sincronizado en PostgreSQL:', data)
        })
        .catch((err) => console.error('Error al sincronizar con backend:', err))
    }
  }, [isAuthenticated, user])

  return (
    <div className="app-container">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 0',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{ fontWeight: 700, letterSpacing: '-0.025em', cursor: 'pointer' }}
            onClick={() => setActiveTab(isAuthenticated ? 'login' : 'login')}
          >
            E-Commerce
          </span>
          {registeredUsersCount > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
              ✓ {registeredUsersCount} cuenta(s) creada(s)
            </span>
          )}
        </div>
        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Profile />
            <LoginButton />
          </div>
        )}
      </header>

      {isAuthenticated && user ? (
        <section
          id="section-profile"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}
        >
          <div className="auth-clean-wrapper" id="profile-card">
            <div className="auth-clean-header" style={{ marginBottom: '1.5rem' }}>
              <span
                className="auth-clean-tag"
                style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}
              >
                ● Sesión Activa
              </span>
              <h2 className="auth-clean-title">¡Bienvenido!</h2>
              <p className="auth-clean-subtitle">Iniciaste sesión correctamente en tu cuenta</p>
            </div>

            <div className="auth-profile-box">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name || 'Usuario'}
                  className="auth-profile-avatar"
                />
              ) : (
                <div
                  className="auth-profile-avatar"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f3f4f6',
                    fontSize: '2rem',
                  }}
                >
                  👤
                </div>
              )}
              <div>
                <h3 className="auth-profile-name">{user.name || 'Usuario'}</h3>
                <p className="auth-profile-email">{user.email}</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="clean-submit-btn"
                style={{ background: '#111827' }}
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </section>
      ) : (
        <>
          {activeTab === 'login' && (
            <section
              id="section-login"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <LoginForm
                onGoToRegister={() => setActiveTab('register')}
                onForgotPassword={() => setActiveTab('forgot-password')}
              />
            </section>
          )}

          {activeTab === 'register' && (
            <section
              id="section-register"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <RegisterForm
                onSuccess={() => {
                  setRegisteredUsersCount((prev) => prev + 1)
                  setActiveTab('login')
                }}
                onGoToLogin={() => setActiveTab('login')}
                onForgotPassword={() => setActiveTab('forgot-password')}
              />
            </section>
          )}

          {(activeTab === 'forgot-password' || activeTab === 'reset-password') && (
            <section
              id="section-reset-password"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <ResetPasswordForm
                initialToken={resetToken}
                onBackToLogin={() => {
                  setResetToken('')
                  setActiveTab('login')
                }}
                onSuccess={() => {
                  setResetToken('')
                  setActiveTab('login')
                }}
              />
            </section>
          )}
        </>
      )}

      <Footer onNavigate={(tab: 'login' | 'register' | 'overview') => setActiveTab(tab)} />
    </div>
  )
}
