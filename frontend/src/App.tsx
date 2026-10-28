import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import './App.css'
import { RegisterForm } from './components/Register/RegisterForm'
import { Footer } from './components/Footer/Footer'
import { Profile } from './components/Profile/Profile'
import { LoginButton } from './components/Login/Login'

export default function App() {
  const { isAuthenticated } = useAuth0()
  const [activeTab, setActiveTab] = useState<'register' | 'overview' | 'quickstart'>('register')
  const [registeredUsersCount, setRegisteredUsersCount] = useState(0)

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, letterSpacing: '-0.025em' }}>E-Commerce</span>
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

      {activeTab === 'register' && (
        <section id="section-register" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <RegisterForm
            onSuccess={() => {
              setRegisteredUsersCount((prev) => prev + 1)
            }}
          />
        </section>
      )}
      <Footer onNavigate={(tab: 'register' | 'overview') => setActiveTab(tab)} />

    </div>

  )
}
