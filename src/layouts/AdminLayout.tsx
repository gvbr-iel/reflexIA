import { type ReactNode, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Users, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/* ------------------------------------------------
   AdminLayout — marco visual del Administrador
   Header + sidebar con navegación + área de contenido.
   Responsive: sidebar colapsable en móvil.
   ------------------------------------------------ */

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Whitelist', path: '/admin/whitelist', icon: <Users size={20} /> },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/iniciar-sesion', { replace: true })
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-surface border-b border-border h-14 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Hamburguesa (solo móvil) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <span className="font-heading font-bold text-xl text-primary">
            Reflex<span className="text-accent-ia">IA</span>
          </span>
          <span className="hidden sm:inline text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            Administrador
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user?.email && (
            <span
              className="hidden md:inline text-xs text-texto/60 font-medium truncate max-w-[200px]"
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-texto/60 hover:text-texto transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* ===== Sidebar ===== */}
        {/* Overlay móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`
            fixed md:sticky top-14 left-0 h-[calc(100vh-3.5rem)] shrink-0
            w-60 bg-surface border-r border-border
            flex flex-col p-4 gap-1
            z-30 transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-texto/70 hover:bg-primary/5 hover:text-primary'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ===== Contenido principal ===== */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
