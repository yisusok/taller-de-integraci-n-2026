import { useState } from 'react'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'quickstart'>('overview')

  return (
    <div className="app-container">
      <header>
        <div className="badge">
          <span className="pulse-dot"></span>
          Infraestructura Inicializada
        </div>
        <h1 className="hero-title">E-Commerce Platform</h1>
        <p className="hero-subtitle">
          Taller de Integración 2026 &mdash; Arquitectura basada en NestJS, React y PostgreSQL con registro de decisiones y diagramas.
        </p>
      </header>

      <div className="cards-grid">
        <div className="card">
          <div>
            <span className="card-icon">⚡</span>
            <h2 className="card-title">Frontend React</h2>
            <p className="card-desc">
              Interfaz de usuario SPA construida con React 19, TypeScript y empaquetador Vite para máximo rendimiento.
            </p>
          </div>
          <div className="card-meta">
            <span className="status-tag">● Listo</span>
            <span className="port-tag">localhost:5173</span>
          </div>
        </div>

        <div className="card">
          <div>
            <span className="card-icon">🛡️</span>
            <h2 className="card-title">Backend NestJS</h2>
            <p className="card-desc">
              API REST modular con inyección de dependencias, TypeScript estricto y TypeORM configurado.
            </p>
          </div>
          <div className="card-meta">
            <span className="status-tag">● Listo</span>
            <span className="port-tag">localhost:3000</span>
          </div>
        </div>

        <div className="card">
          <div>
            <span className="card-icon">🐘</span>
            <h2 className="card-title">PostgreSQL</h2>
            <p className="card-desc">
              Base de datos relacional para consistencia ACID de inventarios, carritos y órdenes de compra.
            </p>
          </div>
          <div className="card-meta">
            <span className="status-tag">● Local / Nativo</span>
            <span className="port-tag">localhost:5432</span>
          </div>
        </div>
      </div>

      <section className="doc-section">
        <h3>📂 Documentación & Decision Records (DR)</h3>
        <p>
          El proyecto cuenta con un sistema de <strong>Architecture Decision Records (ADR)</strong> y diagramas estructurados en la carpeta <code>/documentacion</code>.
        </p>
        <div className="doc-links">
          <a
            href="https://github.com"
            onClick={(e) => {
              e.preventDefault()
              alert('Revisa la carpeta /documentacion/DR en tu proyecto.')
            }}
            className="doc-btn"
          >
            📋 Ver ADRs (/documentacion/DR)
          </a>
          <a
            href="https://github.com"
            onClick={(e) => {
              e.preventDefault()
              alert('Revisa la carpeta /documentacion/diagramas en tu proyecto.')
            }}
            className="doc-btn secondary"
          >
            📊 Ver Diagramas (/documentacion/diagramas)
          </a>
          <button
            onClick={() => setActiveTab(activeTab === 'overview' ? 'quickstart' : 'overview')}
            className="doc-btn secondary"
          >
            {activeTab === 'overview' ? '📖 Guía de Comandos' : '⬅ Volver al Resumen'}
          </button>
        </div>

        {activeTab === 'quickstart' && (
          <div style={{ marginTop: '1.5rem', background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#cbd5e1' }}>
            <p style={{ margin: '0 0 0.5rem 0', color: '#818cf8', fontWeight: 600 }}>Comandos rápidos:</p>
            <div># 1. Base de datos PostgreSQL (Servicio local / pgAdmin)</div>
            <div style={{ color: '#38bdf8' }}>CREATE DATABASE ecommerce_db;</div>
            <br />
            <div># 2. Iniciar Backend (NestJS)</div>
            <div style={{ color: '#38bdf8' }}>cd backend &amp;&amp; npm run start:dev</div>
            <br />
            <div># 3. Iniciar Frontend (React)</div>
            <div style={{ color: '#38bdf8' }}>cd frontend &amp;&amp; npm run dev</div>
          </div>
        )}
      </section>

      <footer className="footer">
        Taller de Integración 2026 &bull; Infraestructura inicializada con éxito
      </footer>
    </div>
  )
}
