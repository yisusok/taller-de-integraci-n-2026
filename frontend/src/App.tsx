import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
import { LoginForm } from './components/Login/LoginForm'
import { RegisterForm } from './components/Register/RegisterForm'
import { ResetPasswordForm } from './components/ResetPassword/ResetPasswordForm'

interface UserSession {
  id?: string
  nombre: string
  email: string
  rol?: string
  avatar?: string | null
}

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
      | 'reset-password'
      | 'backoffice',
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
    talles: [1, 2, 3, 4],
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
    'store' | 'login' | 'register' | 'forgot-password' | 'reset-password' | 'backoffice'
  >(initial.tab)
  const [resetToken, setResetToken] = useState<string>(initial.token)
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0)
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null)

  // Sesión local (email y password)
  const [localUser, setLocalUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('local_user')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return null
        }
      }
    }
    return null
  })

  // Usuario activo unificado (OAuth o Local)
  const activeUser: UserSession | null = localUser || (isAuthenticated && user ? {
    id: user.sub,
    nombre: user.name || user.nickname || 'Usuario Google',
    email: user.email || '',
    avatar: user.picture || null,
    rol: 'cliente',
  } : null)

  // Estados del catálogo, carrito y favoritos
  const [cartCount, setCartCount] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { talle?: number; color?: string }>
  >({})
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_favorites')
        return saved ? JSON.parse(saved) : []
      } catch {
        return []
      }
    }
    return []
  })

  // Estado de movimientos para prueba de Backoffice
  const [backofficeLog, setBackofficeLog] = useState<string | null>(null)

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
          if (data?.access_token) {
            localStorage.setItem('access_token', data.access_token)
          }
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

  /**
   * Middleware de Control de Acceso:
   * Los visitantes anónimos pueden explorar el catálogo libremente,
   * pero deben autenticarse para interactuar con el Carrito de compras.
   */
  const handleAddToCart = (product: ProductItem) => {
    if (!activeUser) {
      setAuthPromptMessage('Debes iniciar sesión para agregar productos al carrito.')
      setActiveTab('login')
      return
    }

    const variant = selectedVariants[product.id]
    if (!variant?.talle || !variant?.color) {
      alert(`Por favor, selecciona talle y color para ${product.nombre}`)
      return
    }
    setCartCount((c) => c + 1)
  }

  /**
   * Middleware de Control de Acceso:
   * La interacción con Favoritos está restringida a usuarios autenticados.
   */
  const handleToggleFavorite = (productId: string) => {
    if (!activeUser) {
      setAuthPromptMessage('Debes iniciar sesión para guardar productos en tus favoritos.')
      setActiveTab('login')
      return
    }

    setFavorites((prev) => {
      const isFav = prev.includes(productId)
      const updated = isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_favorites', JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleCartClick = () => {
    if (!activeUser) {
      setAuthPromptMessage('Debes iniciar sesión para acceder al carrito.')
      setActiveTab('login')
      return
    }
    alert(`Tienes ${cartCount} producto(s) en tu carrito.`)
  }

  const handleLogout = () => {
    setLocalUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('local_user')
      localStorage.removeItem('access_token')
    }
    if (isAuthenticated) {
      logout({ logoutParams: { returnTo: window.location.origin } })
    }
    setActiveTab('store')
  }

  const handleLoginSuccess = (user: UserSession, token?: string) => {
    setLocalUser(user)
    setAuthPromptMessage(null)
    if (typeof window !== 'undefined') {
      localStorage.setItem('local_user', JSON.stringify(user))
      if (token) {
        localStorage.setItem('access_token', token)
      }
    }
    setActiveTab('store')
  }

  const handleTestBackofficeAccess = async () => {
    setBackofficeLog('Consultando API protegida /api/stock/movimientos...')
    const defaultApiUrl =
      (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api\/?$/, '') ||
      'http://localhost:3000'
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    try {
      const res = await fetch(`${defaultApiUrl}/stock/movimientos`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        setBackofficeLog(
          `⛔ Acceso Denegado (HTTP ${res.status}): ${
            errorData.message || 'No autorizado para rutas de backoffice.'
          }`,
        )
      } else {
        const data = await res.json()
        setBackofficeLog(`✅ Acceso Autorizado (HTTP 200). Movimientos: ${data.length}`)
      }
    } catch {
      setBackofficeLog('⛔ Error de conexión con el backend.')
    }
  }

  return (
    <div className="store-container">
      {/* Alerta de Middleware de Control de Acceso */}
      {authPromptMessage && activeTab === 'login' && (
        <div
          style={{
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            color: '#92400e',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            margin: '1rem auto 0 auto',
            maxWidth: '480px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          🔒 {authPromptMessage}
        </div>
      )}

      {/* Navbar Unificada */}
      <nav className="navbar">
        <div
          className="logo-group"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setAuthPromptMessage(null)
            setActiveTab('store')
          }}
        >
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">E-COMMERCE 2026</span>
          {registeredUsersCount > 0 && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginLeft: '0.5rem' }}>
              ✓ {registeredUsersCount} cuenta(s) creada(s)
            </span>
          )}
        </div>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {activeTab !== 'store' && (
            <button
              type="button"
              className="variant-btn"
              onClick={() => {
                setAuthPromptMessage(null)
                setActiveTab('store')
              }}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              ← Ir a la Tienda
            </button>
          )}

          {/* Botón de acceso a Backoffice */}
          <button
            type="button"
            className="variant-btn"
            onClick={() => {
              setAuthPromptMessage(null)
              setActiveTab('backoffice')
            }}
            style={{
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem',
              borderColor: activeTab === 'backoffice' ? '#6366f1' : undefined,
              color: activeTab === 'backoffice' ? '#818cf8' : undefined,
            }}
          >
            🛡️ Backoffice
          </button>

          <button className="cart-btn" onClick={handleCartClick}>
            🛒 Carrito <span className="cart-badge">{cartCount}</span>
          </button>

          {activeUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#a5b4fc',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  setAuthPromptMessage(null)
                  setActiveTab('login')
                }}
              >
                👤 {activeUser.nombre.split(' ')[0]}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid #374151',
                  color: '#9ca3af',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                }}
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="variant-btn active"
              onClick={() => {
                setAuthPromptMessage(null)
                setActiveTab('login')
              }}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              Iniciar Sesión / Registro
            </button>
          )}
        </div>
      </nav>

      {/* Vista de Catálogo Principal (Storefront) - Navegación anónima permitida */}
      {activeTab === 'store' && (
        <>
          <header className="hero-banner">
            <h1>Catálogo de Temporada</h1>
            <p>
              Explora nuestros productos libremente. Para comprar o guardar en favoritos, inicia sesión.
            </p>
          </header>

          <main className="product-grid">
            {SAMPLE_PRODUCTS.map((prod) => {
              const currentVariant = selectedVariants[prod.id] || {}
              const isFavorite = favorites.includes(prod.id)

              return (
                <article key={prod.id} className="product-card" style={{ position: 'relative' }}>
                  {/* Botón de Favoritos (Protegido por Middleware) */}
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(prod.id)}
                    title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '50%',
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                    }}
                  >
                    {isFavorite ? '❤️' : '🤍'}
                  </button>

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

                  {/* Botón Agregar al Carrito (Protegido por Middleware) */}
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

      {/* Vista de Control de Acceso al Backoffice */}
      {activeTab === 'backoffice' && (
        <div style={{ margin: '2rem auto', maxWidth: '640px', padding: '0 1rem' }}>
          <div className="auth-clean-wrapper">
            <div className="auth-clean-header" style={{ marginBottom: '1.5rem' }}>
              <span
                className="auth-clean-tag"
                style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
              >
                🛡️ Control de Acceso RBAC
              </span>
              <h2 className="auth-clean-title">Módulo de Backoffice (Stock)</h2>
              <p className="auth-clean-subtitle">
                Acceso restringido exclusivamente al rol: <strong>administrador</strong>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
              <p>
                <strong>Estado de sesión: </strong>
                {activeUser ? (
                  <span style={{ color: '#10b981', fontWeight: 600 }}>
                    {activeUser.nombre} (Rol: {activeUser.rol || 'cliente'})
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>Visitante Anónimo (Sin autenticar)</span>
                )}
              </p>
              <p style={{ marginTop: '0.5rem', color: '#6b7280' }}>
                Este panel interactúa directamente con los endpoints del backend protegidos con{' '}
                <code>JwtAuthGuard</code> y <code>RolesGuard</code>. Si el rol no está autorizado, la petición será
                rechazada con HTTP 403 Forbidden.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestBackofficeAccess}
              className="clean-submit-btn"
              style={{ background: '#4f46e5', marginBottom: '1rem' }}
            >
              Probar Petición a /api/stock/movimientos
            </button>

            {backofficeLog && (
              <div
                style={{
                  background: '#111827',
                  color: '#e5e7eb',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {backofficeLog}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vistas de Autenticación y Perfil */}
      {activeTab !== 'store' && activeTab !== 'backoffice' && (
        <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {activeUser ? (
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
                {activeUser.avatar ? (
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.nombre}
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
                  <h3 className="auth-profile-name">{activeUser.nombre}</h3>
                  <p className="auth-profile-email">{activeUser.email}</p>
                  {activeUser.rol && (
                    <span style={{ fontSize: '0.75rem', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase' }}>
                      Rol: {activeUser.rol}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAuthPromptMessage(null)
                    setActiveTab('store')
                  }}
                  className="clean-submit-btn"
                  style={{ background: '#4f46e5' }}
                >
                  Continuar Comprando
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
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
                  onSuccess={handleLoginSuccess}
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
