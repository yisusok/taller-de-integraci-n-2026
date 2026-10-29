import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
import { LoginForm } from './components/Login/LoginForm'
import { RegisterForm } from './components/Register/RegisterForm'
import { ResetPasswordForm } from './components/ResetPassword/ResetPasswordForm'
import { Profile } from './components/Profile/Profile'
import { LoginButton } from './components/Login/Login'

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { tab: 'store' as const, token: '' }
  }
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  return {
    tab: (token ? 'reset-password' : 'store') as
      | 'store'
      | 'login'
      | 'register'
      | 'forgot-password'
      | 'reset-password',
    token: token || '',
  }
}

interface ProductItem {
  id: string
  nombre: string
  categoria: string
  precioVenta: number
  skuBase: string
  talles: number[]
  colores: string[]
}

const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: '1',
    nombre: 'Zapatillas Deportivas Runner Pro',
    categoria: 'Calzado',
    precioVenta: 89999,
    skuBase: 'ZAP-RUN-01',
    talles: [39, 40, 41, 42, 43],
    colores: ['Negro', 'Azul', 'Blanco'],
  },
  {
    id: '2',
    nombre: 'Remera Técnica Dry-Fit',
    categoria: 'Indumentaria',
    precioVenta: 24999,
    skuBase: 'REM-DRY-02',
    talles: [1, 2, 3, 4], // Talles S, M, L, XL
    colores: ['Negro', 'Gris', 'Rojo'],
  },
  {
    id: '3',
    nombre: 'Buzo Hoodie Essential',
    categoria: 'Indumentaria',
    precioVenta: 54999,
    skuBase: 'BUZ-ESS-03',
    talles: [2, 3, 4],
    colores: ['Negro', 'Beige', 'Verde'],
  },
  {
    id: '4',
    nombre: 'Pantalón Jogger Training',
    categoria: 'Indumentaria',
    precioVenta: 42999,
    skuBase: 'PAN-JOG-04',
    talles: [38, 40, 42],
    colores: ['Negro', 'Gris Oscuro'],
  },
]

export default function App() {
  const { isAuthenticated, user, logout } = useAuth0()
  const initial = getInitialState()
  const [activeTab, setActiveTab] = useState<
    'store' | 'login' | 'register' | 'forgot-password' | 'reset-password'
  >(initial.tab)
  const [resetToken, setResetToken] = useState<string>(initial.token)
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0)

  // Estados del catálogo y carrito
  const [cartCount, setCartCount] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { talle?: number; color?: string }>
  >({})

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

  const handleSelectVariant = (productId: string, key: 'talle' | 'color', val: unknown) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [key]: val,
      },
    }))
  }

  const handleAddToCart = (product: ProductItem) => {
    const variant = selectedVariants[product.id]
    if (!variant?.talle || !variant?.color) {
      alert(`Por favor, selecciona talle y color para ${product.nombre}`)
      return
    }
    setCartCount((c) => c + 1)
  }

  return (
    <div className="store-container">
      {/* Navbar Unificada */}
      <nav className="navbar">
        <div
          className="logo-group"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveTab('store')}
        >
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">E-COMMERCE 2026</span>
          {registeredUsersCount > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginLeft: '0.5rem' }}>
              ✓ {registeredUsersCount} cuenta(s) creada(s)
            </span>
          )}
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {activeTab !== 'store' && (
            <button
              type="button"
              className="variant-btn"
              onClick={() => setActiveTab('store')}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              ← Ir a la Tienda
            </button>
          )}

          <button className="cart-btn">
            🛒 Carrito <span className="cart-badge">{cartCount}</span>
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Profile />
              <LoginButton />
            </div>
          ) : (
            <button
              type="button"
              className="variant-btn active"
              onClick={() => setActiveTab('login')}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </nav>

      {/* Vista de Catálogo Principal (Storefront) */}
      {activeTab === 'store' && (
        <>
          <header className="hero-banner">
            <h1>Catálogo de Temporada</h1>
            <p>Selecciona tu producto y variante preferida para comprar.</p>
          </header>

          <main className="product-grid">
            {SAMPLE_PRODUCTS.map((prod) => {
              const currentVariant = selectedVariants[prod.id] || {}
              return (
                <article key={prod.id} className="product-card">
                  <div className="product-category">{prod.categoria}</div>
                  <h2 className="product-title">{prod.nombre}</h2>
                  <div className="product-sku">SKU Base: {prod.skuBase}</div>
                  <div className="product-price">${prod.precioVenta.toLocaleString('es-AR')}</div>

                  {/* Talles */}
                  <div className="variant-group">
                    <span className="variant-label">Talle:</span>
                    <div className="variant-options">
                      {prod.talles.map((talle) => (
                        <button
                          key={talle}
                          type="button"
                          className={`variant-btn ${currentVariant.talle === talle ? 'active' : ''}`}
                          onClick={() => handleSelectVariant(prod.id, 'talle', talle)}
                        >
                          {talle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Colores */}
                  <div className="variant-group">
                    <span className="variant-label">Color:</span>
                    <div className="variant-options">
                      {prod.colores.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`variant-btn ${currentVariant.color === color ? 'active' : ''}`}
                          onClick={() => handleSelectVariant(prod.id, 'color', color)}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(prod)}
                  >
                    Agregar al Carrito
                  </button>
                </article>
              )
            })}
          </main>
        </>
      )}

      {/* Vistas de Autenticación y Perfil */}
      {activeTab !== 'store' && (
        <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {isAuthenticated && user ? (
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

              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className="clean-submit-btn"
                  style={{ background: '#4f46e5' }}
                >
                  Continuar Comprando
                </button>
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
          ) : (
            <>
              {activeTab === 'login' && (
                <LoginForm
                  onGoToRegister={() => setActiveTab('register')}
                  onForgotPassword={() => setActiveTab('forgot-password')}
                />
              )}

              {activeTab === 'register' && (
                <RegisterForm
                  onSuccess={() => {
                    setRegisteredUsersCount((prev) => prev + 1)
                    setActiveTab('login')
                  }}
                  onGoToLogin={() => setActiveTab('login')}
                  onForgotPassword={() => setActiveTab('forgot-password')}
                />
              )}

              {(activeTab === 'forgot-password' || activeTab === 'reset-password') && (
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
              )}
            </>
          )}
        </div>
      )}

      <footer className="store-footer">
        &copy; 2026 E-Commerce &bull; Taller de Integración
      </footer>
    </div>
  )
}
