import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './App.css';
import { LoginForm } from './components/Login/LoginForm';
import { RegisterForm } from './components/Register/RegisterForm';
import { ResetPasswordForm } from './components/ResetPassword/ResetPasswordForm';
import { AddressBook } from './components/AddressBook/AddressBook';
import { StockBackoffice } from './components/Stock/StockBackoffice';
import { AdminProductForm } from './components/AdminProducts/AdminProductForm';
import { catalogApi, messageFromError } from './components/Catalog/api';
import type { Categoria, Producto, Variante } from './components/Catalog/api';
import { StoreHeader } from './components/Storefront/StoreHeader';
import { StoreNavDrawer } from './components/Storefront/StoreNavDrawer';
import { CartDrawer } from './components/Storefront/CartDrawer';
import { NewsletterBanner } from './components/Storefront/NewsletterBanner';
import { StoreFooter } from './components/Storefront/StoreFooter';
import { AuthBenefitsAside } from './components/Storefront/AuthBenefitsAside';
import { HomeView } from './components/Storefront/HomeView';
import { SportsView } from './components/Storefront/SportsView';
import { CatalogView } from './components/Storefront/CatalogView';
import { ProductDetailView } from './components/Storefront/ProductDetailView';
import { FavoritesView } from './components/Storefront/FavoritesView';
import {
  DEFAULT_CATALOG_FILTERS,
  getDefaultAvailableVariant,
  getProductImage,
} from './components/Storefront/storefront.types';
import type {
  CartItem,
  CatalogFilters,
  StoreView,
  UserSession,
} from './components/Storefront/storefront.types';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { view: 'home' as StoreView, token: '' };
  }
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  return {
    view: (token ? 'reset-password' : 'home') as StoreView,
    token: token || '',
  };
};

export default function App() {
  const { isAuthenticated, user, logout } = useAuth0();
  const initial = getInitialState();
  const [activeView, setActiveView] = useState<StoreView>(initial.view);
  const [previousStoreView, setPreviousStoreView] = useState<
    'home' | 'catalog' | 'sports' | 'favorites'
  >('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [resetToken, setResetToken] = useState<string>(initial.token);
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(
    null,
  );

  const [filters, setFilters] = useState<CatalogFilters>(
    DEFAULT_CATALOG_FILTERS,
  );
  const [homeProducts, setHomeProducts] = useState<Producto[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState<string | null>(null);

  const [storeProducts, setStoreProducts] = useState<Producto[]>([]);
  const [storeTotal, setStoreTotal] = useState(0);
  const [storeLimit, setStoreLimit] = useState(24);
  const [storeCategories, setStoreCategories] = useState<Categoria[]>([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storeReloadNonce, setStoreReloadNonce] = useState(0);

  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [localUser, setLocalUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('local_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const activeUser: UserSession | null =
    localUser ||
    (isAuthenticated && user
      ? {
          id: user.sub,
          nombre: user.name || user.nickname || 'Usuario Google',
          email: user.email || '',
          avatar: user.picture || null,
          rol: 'cliente',
        }
      : null);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_favorites');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const isBackoffice = activeView === 'backoffice';

  useEffect(() => {
    if (isBackoffice) return;
    let ignore = false;
    const timer = setTimeout(() => {
      setHomeLoading(true);
      setHomeError(null);
      Promise.all([
        catalogApi.listProducts({ limit: 100 }),
        catalogApi.listCategories(),
      ])
        .then(([prods, cats]) => {
          if (ignore) return;
          setHomeProducts(prods.items);
          setStoreCategories(cats);
        })
        .catch((err: unknown) => {
          if (ignore) return;
          setHomeError(
            messageFromError(err, 'No se pudo cargar el catálogo de productos.'),
          );
        })
        .finally(() => {
          if (!ignore) setHomeLoading(false);
        });
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [isBackoffice, storeReloadNonce]);

  useEffect(() => {
    if (activeView !== 'catalog') return;
    let ignore = false;
    const delay = filters.search ? 160 : 0;
    const timer = setTimeout(() => {
      setStoreLoading(true);
      setStoreError(null);
      catalogApi
        .listProducts({
          search: filters.search || undefined,
          categoria_id: filters.categoriaId || undefined,
          marca: filters.marca || undefined,
          limit: filters.sportTag ? 100 : storeLimit,
        })
        .then((prods) => {
          if (ignore) return;
          setStoreProducts(prods.items);
          setStoreTotal(prods.total);
        })
        .catch((err: unknown) => {
          if (ignore) return;
          setStoreError(
            messageFromError(err, 'No se pudo cargar el catálogo.'),
          );
        })
        .finally(() => {
          if (!ignore) setStoreLoading(false);
        });
    }, delay);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    activeView,
    filters.search,
    filters.categoriaId,
    filters.marca,
    filters.sportTag,
    storeLimit,
    storeReloadNonce,
  ]);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      const defaultApiUrl =
        (import.meta.env.VITE_API_URL as string | undefined)?.replace(
          /\/api\/?$/,
          '',
        ) || 'http://localhost:3000';

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
          if (!res.ok) throw new Error('Error al sincronizar con el servidor');
          return res.json();
        })
        .then((data) => {
          if (data?.access_token) {
            localStorage.setItem('access_token', data.access_token);
          }
        })
        .catch((err) => console.error('Error al sincronizar con backend:', err));
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const scrollTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateTo = (view: StoreView) => {
    setAuthPromptMessage(null);
    setActiveView(view);
    scrollTop();
  };

  const requireAuth = (message: string): boolean => {
    if (activeUser) {
      return true;
    }
    setAuthPromptMessage(message);
    setActiveView('login');
    scrollTop();
    return false;
  };

  const handleOpenCatalogWithReset = () => {
    setStoreLimit(24);
    setFilters(DEFAULT_CATALOG_FILTERS);
    navigateTo('catalog');
  };

  const handleSelectDiscipline = (tag: string, label: string) => {
    setStoreLimit(24);
    setFilters({
      ...DEFAULT_CATALOG_FILTERS,
      sportTag: tag,
      sportLabel: label,
    });
    navigateTo('catalog');
  };

  const handleSelectBrand = (brand: string) => {
    setStoreLimit(24);
    setFilters({
      ...DEFAULT_CATALOG_FILTERS,
      marca: brand,
    });
    navigateTo('catalog');
  };

  const handleOpenCombos = () => {
    const comboCategory = storeCategories.find((cat) =>
      cat.nombre.toLowerCase().includes('combo'),
    );
    setStoreLimit(24);
    setFilters({
      ...DEFAULT_CATALOG_FILTERS,
      categoriaId: comboCategory?.id || '',
      search: comboCategory ? '' : 'combo',
    });
    navigateTo('catalog');
  };

  const handleOpenProduct = (productId: string) => {
    if (
      activeView === 'home' ||
      activeView === 'catalog' ||
      activeView === 'sports' ||
      activeView === 'favorites'
    ) {
      setPreviousStoreView(activeView);
    }
    setSelectedProductId(productId);
    setActiveView('product');
    scrollTop();
  };

  const handleToggleFavorite = (productId: string) => {
    if (
      !requireAuth(
        'Debes iniciar sesión para guardar productos en tus favoritos.',
      )
    ) {
      return;
    }

    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const updated = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_favorites', JSON.stringify(updated));
      }
      setToastMessage(
        exists
          ? 'Producto eliminado de favoritos.'
          : 'Producto guardado en tus favoritos.',
      );
      return updated;
    });
  };

  const handleAddToCart = (
    product: Producto,
    variant: Variante,
    quantity: number,
  ): boolean => {
    if (
      !requireAuth(
        'Debes iniciar sesión para agregar productos al carrito.',
      )
    ) {
      return false;
    }

    if (variant.stock_actual <= 0) {
      setToastMessage('La variante seleccionada no tiene stock disponible.');
      return false;
    }

    const key = variant.id;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.key === key);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, variant.stock_actual);
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: nextQty, maxStock: variant.stock_actual }
            : item,
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variant.id,
          nombre: product.nombre,
          marca: product.marca,
          imagenUrl: getProductImage(product),
          precio: product.precio,
          talle: variant.talle,
          color: variant.color,
          quantity: Math.min(Math.max(1, quantity), variant.stock_actual),
          maxStock: variant.stock_actual,
        },
      ];
    });

    setToastMessage(`Agregado al carrito: ${product.nombre}`);
    return true;
  };

  const handleQuickAddToCart = (product: Producto) => {
    if (
      !requireAuth(
        'Debes iniciar sesión para agregar productos al carrito.',
      )
    ) {
      return;
    }

    if (product.variantes.length === 1 && product.variantes[0].stock_actual > 0) {
      handleAddToCart(product, product.variantes[0], 1);
      return;
    }

    if (product.variantes.length > 1) {
      const available = getDefaultAvailableVariant(product);
      if (!available || available.stock_actual <= 0) {
        handleOpenProduct(product.id);
        return;
      }
      setToastMessage(`Elige talle y color para ${product.nombre}.`);
      handleOpenProduct(product.id);
      return;
    }

    handleOpenProduct(product.id);
  };

  const handleUpdateCartQuantity = (key: string, nextQty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.key === key
          ? {
              ...item,
              quantity: Math.min(Math.max(1, nextQty), item.maxStock),
            }
          : item,
      ),
    );
  };

  const handleRemoveCartItem = (key: string) => {
    setCartItems((prev) => prev.filter((item) => item.key !== key));
  };

  const handleOpenCart = () => {
    if (!requireAuth('Debes iniciar sesión para acceder al carrito.')) {
      return;
    }
    setCartDrawerOpen(true);
  };

  const handleOpenFavorites = () => {
    if (!requireAuth('Debes iniciar sesión para ver tus favoritos.')) {
      return;
    }
    navigateTo('favorites');
  };

  const handleOpenAccount = () => {
    setAuthPromptMessage(null);
    if (activeUser) {
      navigateTo('account');
    } else {
      navigateTo('login');
    }
  };

  const handleLogout = () => {
    setLocalUser(null);
    setCartItems([]);
    setCartDrawerOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('local_user');
      localStorage.removeItem('access_token');
    }
    if (isAuthenticated) {
      logout({ logoutParams: { returnTo: window.location.origin } });
    }
    navigateTo('home');
  };

  const handleLoginSuccess = (loggedUser: UserSession, token?: string) => {
    setLocalUser(loggedUser);
    setAuthPromptMessage(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('local_user', JSON.stringify(loggedUser));
      if (token) {
        localStorage.setItem('access_token', token);
      }
    }
    navigateTo('home');
  };

  if (activeView === 'backoffice') {
    return (
      <>
        <StockBackoffice
          activeUser={activeUser}
          onGoToStore={() => {
            setStoreReloadNonce((n) => n + 1);
            navigateTo('home');
          }}
          onGoToLogin={() => navigateTo('login')}
          onLogout={handleLogout}
        />
        <AdminProductForm />
      </>
    );
  }

  const catalogProductsById = new Map<string, Producto>();
  for (const prod of homeProducts) catalogProductsById.set(prod.id, prod);
  for (const prod of storeProducts) catalogProductsById.set(prod.id, prod);
  const allKnownProducts = Array.from(catalogProductsById.values());

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isAuthView =
    activeView === 'login' ||
    activeView === 'register' ||
    activeView === 'forgot-password' ||
    activeView === 'reset-password';

  const authHeading =
    activeView === 'register'
      ? {
          title: 'CREAR CUENTA',
          subtitle: 'Regístrate para comprar más rápido y guardar tus favoritos.',
        }
      : activeView === 'forgot-password' || activeView === 'reset-password'
        ? {
            title: 'RECUPERAR CONTRASEÑA',
            subtitle: 'Solicita o confirma el enlace de recuperación para tu cuenta.',
          }
        : {
            title: 'INICIAR SESIÓN',
            subtitle: 'Ingresa para guardar tus favoritos y gestionar tus envíos.',
          };

  return (
    <div className="store-shell">
      <StoreHeader
        searchValue={filters.search}
        onSearchChange={(val) => {
          setStoreLimit(24);
          setFilters((prev) => ({ ...prev, search: val }));
          if (val.trim() && activeView !== 'catalog') {
            setActiveView('catalog');
          }
        }}
        onSearchSubmit={() => {
          setStoreLimit(24);
          navigateTo('catalog');
        }}
        cartCount={cartCount}
        favoritesCount={favorites.length}
        activeUser={activeUser}
        activeView={activeView}
        onNavigate={navigateTo}
        onSelectDiscipline={handleSelectDiscipline}
        onOpenMenu={() => setNavDrawerOpen(true)}
        onOpenCart={handleOpenCart}
        onOpenFavorites={handleOpenFavorites}
        onOpenAccount={handleOpenAccount}
        onOpenBackoffice={() => navigateTo('backoffice')}
      />

      <main className="sf-main">
        {activeView === 'home' && (
          <HomeView
            products={homeProducts}
            loading={homeLoading}
            error={homeError}
            favorites={favorites}
            isAdmin={activeUser?.rol === 'administrador'}
            onRetry={() => setStoreReloadNonce((n) => n + 1)}
            onOpenProduct={handleOpenProduct}
            onOpenCatalog={handleOpenCatalogWithReset}
            onOpenSports={() => navigateTo('sports')}
            onSelectDiscipline={handleSelectDiscipline}
            onSelectBrand={handleSelectBrand}
            onOpenCombos={handleOpenCombos}
            onToggleFavorite={handleToggleFavorite}
            onQuickAddToCart={handleQuickAddToCart}
            onOpenBackoffice={() => navigateTo('backoffice')}
          />
        )}

        {activeView === 'sports' && (
          <SportsView
            products={homeProducts}
            onSelectDiscipline={handleSelectDiscipline}
            onOpenCatalog={handleOpenCatalogWithReset}
          />
        )}

        {activeView === 'catalog' && (
          <CatalogView
            products={storeProducts}
            categories={storeCategories}
            total={storeTotal}
            loading={storeLoading}
            error={storeError}
            filters={filters}
            favorites={favorites}
            isAdmin={activeUser?.rol === 'administrador'}
            onUpdateFilters={(patch) => {
              setStoreLimit(24);
              setFilters((prev) => ({ ...prev, ...patch }));
            }}
            onResetFilters={() => {
              setStoreLimit(24);
              setFilters(DEFAULT_CATALOG_FILTERS);
            }}
            onRetry={() => setStoreReloadNonce((n) => n + 1)}
            onLoadMore={() => setStoreLimit((l) => l + 24)}
            onOpenProduct={handleOpenProduct}
            onToggleFavorite={handleToggleFavorite}
            onOpenBackoffice={() => navigateTo('backoffice')}
          />
        )}

        {activeView === 'product' && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            initialProduct={catalogProductsById.get(selectedProductId)}
            favorites={favorites}
            onBack={() => navigateTo(previousStoreView)}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onFilterByCategory={(categoriaId) => {
              setStoreLimit(24);
              setFilters({ ...DEFAULT_CATALOG_FILTERS, categoriaId });
              navigateTo('catalog');
            }}
            onFilterByTag={(tag) => {
              setStoreLimit(24);
              setFilters({ ...DEFAULT_CATALOG_FILTERS, search: tag });
              navigateTo('catalog');
            }}
          />
        )}

        {activeView === 'favorites' && (
          <FavoritesView
            products={allKnownProducts}
            favorites={favorites}
            activeUser={activeUser}
            onToggleFavorite={handleToggleFavorite}
            onOpenProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onNavigate={navigateTo}
            onOpenCatalog={handleOpenCatalogWithReset}
            onOpenBackoffice={() => navigateTo('backoffice')}
            onLogout={handleLogout}
          />
        )}

        {isAuthView && (
          <div className="sf-container sf-page-shell">
            <div className="sf-page-heading">
              <p className="sf-eyebrow">MI CUENTA</p>
              <h1 className="sf-page-title">{authHeading.title}</h1>
              <p className="sf-page-subtitle">{authHeading.subtitle}</p>
            </div>

            {activeUser ? (
              <div className="sf-profile-panel">
                <p>Ya iniciaste sesión como {activeUser.nombre}.</p>
                <div className="sf-profile-actions">
                  <button
                    type="button"
                    className="sf-btn sf-btn--primary"
                    onClick={() => navigateTo('account')}
                  >
                    IR A MI PERFIL
                  </button>
                  <button
                    type="button"
                    className="sf-btn sf-btn--outline"
                    onClick={() => navigateTo('home')}
                  >
                    VOLVER A LA TIENDA
                  </button>
                </div>
              </div>
            ) : (
              <div className="sf-auth-layout">
                <div className="sf-auth-slot">
                  {authPromptMessage && (
                    <div className="sf-auth-prompt" role="alert">
                      {authPromptMessage}
                    </div>
                  )}

                  {registeredUsersCount > 0 && activeView === 'login' && (
                    <div className="sf-inline-alert is-ok" style={{ marginBottom: '16px' }}>
                      Cuenta creada ({registeredUsersCount}). Ya puedes ingresar con tus credenciales.
                    </div>
                  )}

                  {activeView === 'login' && (
                    <LoginForm
                      onGoToRegister={() => setActiveView('register')}
                      onForgotPassword={() => setActiveView('forgot-password')}
                      onSuccess={handleLoginSuccess}
                    />
                  )}

                  {activeView === 'register' && (
                    <RegisterForm
                      onSuccess={() => {
                        setRegisteredUsersCount((prev) => prev + 1);
                        setActiveView('login');
                      }}
                      onGoToLogin={() => setActiveView('login')}
                      onForgotPassword={() => setActiveView('forgot-password')}
                    />
                  )}

                  {(activeView === 'forgot-password' ||
                    activeView === 'reset-password') && (
                    <ResetPasswordForm
                      initialToken={resetToken}
                      onBackToLogin={() => {
                        setResetToken('');
                        setActiveView('login');
                      }}
                      onSuccess={() => {
                        setResetToken('');
                        setActiveView('login');
                      }}
                    />
                  )}
                </div>

                <AuthBenefitsAside />
              </div>
            )}
          </div>
        )}

        {activeView === 'account' && (
          <div className="sf-container sf-page-shell">
            <div className="sf-page-heading">
              <p className="sf-eyebrow">MI CUENTA</p>
              <h1 className="sf-page-title">MI PERFIL Y DOMICILIOS</h1>
              <p className="sf-page-subtitle">
                Administra tu sesión y tus direcciones guardadas para acelerar tus compras.
              </p>
            </div>

            {activeUser ? (
              <div className="sf-account-grid">
                <nav
                  className="sf-account-sidebar"
                  aria-label="Navegación de cuenta"
                >
                  <p className="sf-account-sidebar__heading">MI CUENTA</p>
                  <button
                    type="button"
                    className="sf-account-nav-item is-active"
                    onClick={() => navigateTo('account')}
                  >
                    Mi perfil y domicilios
                  </button>
                  <button
                    type="button"
                    className="sf-account-nav-item"
                    onClick={handleOpenFavorites}
                  >
                    Favoritos ({favorites.length})
                  </button>
                  <button
                    type="button"
                    className="sf-account-nav-item"
                    onClick={handleOpenCatalogWithReset}
                  >
                    Catálogo de calzado
                  </button>
                  {activeUser.rol === 'administrador' && (
                    <button
                      type="button"
                      className="sf-account-nav-item"
                      onClick={() => navigateTo('backoffice')}
                    >
                      Panel administrativo
                    </button>
                  )}
                  <button
                    type="button"
                    className="sf-account-nav-item"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                  <hr className="sf-divider" />
                  <p className="sf-account-sidebar__note">
                    ¿Necesitas ayuda? soporte@sneackers.com
                  </p>
                </nav>

                <div className="sf-account-content">
                  <div className="sf-profile-panel">
                    <div className="sf-profile-summary">
                      {activeUser.avatar ? (
                        <img
                          src={activeUser.avatar}
                          alt={activeUser.nombre}
                          className="sf-profile-avatar"
                        />
                      ) : (
                        <div className="sf-profile-avatar sf-profile-avatar--placeholder">
                          {activeUser.nombre.trim().charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}

                      <div>
                        <h2 className="sf-profile-name">{activeUser.nombre}</h2>
                        <p className="sf-profile-email">{activeUser.email}</p>
                        {activeUser.rol && (
                          <span className="sf-role-badge">
                            Rol: {activeUser.rol}
                          </span>
                        )}
                      </div>
                    </div>

                    <AddressBook />

                    <div className="sf-profile-actions">
                      <button
                        type="button"
                        className="sf-btn sf-btn--primary"
                        onClick={handleOpenCatalogWithReset}
                      >
                        CONTINUAR COMPRANDO
                      </button>
                      <button
                        type="button"
                        className="sf-btn sf-btn--outline"
                        onClick={handleLogout}
                      >
                        CERRAR SESIÓN
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="sf-state-box">
                <p>Inicia sesión para gestionar tu perfil y tus direcciones de envío.</p>
                <button
                  type="button"
                  className="sf-btn sf-btn--primary"
                  onClick={() => navigateTo('login')}
                >
                  INICIAR SESIÓN
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {(activeView === 'home' ||
        activeView === 'sports' ||
        activeView === 'catalog') && <NewsletterBanner />}

      <StoreFooter
        activeUser={activeUser}
        onNavigate={navigateTo}
        onOpenCatalog={handleOpenCatalogWithReset}
        onOpenFavorites={handleOpenFavorites}
        onOpenBackoffice={() => navigateTo('backoffice')}
        onLogout={handleLogout}
      />

      <StoreNavDrawer
        open={navDrawerOpen}
        onClose={() => setNavDrawerOpen(false)}
        activeUser={activeUser}
        favoritesCount={favorites.length}
        onSelectDiscipline={handleSelectDiscipline}
        onOpenCatalog={handleOpenCatalogWithReset}
        onOpenCombos={handleOpenCombos}
        onOpenFavorites={handleOpenFavorites}
        onNavigate={navigateTo}
        onOpenBackoffice={() => navigateTo('backoffice')}
        onLogout={handleLogout}
      />

      <CartDrawer
        open={cartDrawerOpen}
        items={cartItems}
        onClose={() => setCartDrawerOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onContinueShopping={handleOpenCatalogWithReset}
      />

      {toastMessage && (
        <div className="sf-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
