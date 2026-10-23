import { useState } from 'react'
import './App.css'

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
  const [cartCount, setCartCount] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, { talle?: number; color?: string }>>({})

  const handleSelectVariant = (productId: string, key: 'talle' | 'color', val: any) => {
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
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo-group">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">E-COMMERCE 2026</span>
        </div>
        <div className="nav-actions">
          <button className="cart-btn">
            🛒 Carrito <span className="cart-badge">{cartCount}</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero-banner">
        <h1>Catálogo de Temporada</h1>
        <p>Selecciona tu producto y variante preferida para comprar.</p>
      </header>

      {/* Product Grid */}
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

      <footer className="store-footer">
        &copy; 2026 E-Commerce &bull; Taller de Integración
      </footer>
    </div>
  )
}
