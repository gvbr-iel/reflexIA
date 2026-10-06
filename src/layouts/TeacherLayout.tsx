import { type ReactNode, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { FileText, Clock, Lightbulb, LayoutDashboard, Menu, X, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/* ------------------------------------------------
   TeacherLayout — marco visual del Profesor guía
   Header + sidebar con navegación + área de contenido.
   Responsive: sidebar colapsable en móvil.

   Las pantallas hijas (panel, reflexiones, plazos e
   innovaciones, definidas en App.tsx) se dibujan
   dentro de <Outlet />, en el área de contenido.
   ------------------------------------------------ */

/** Un enlace del menú lateral. */
interface NavItem {
  /** Texto visible. */
  label: string
  /** Ruta a la que lleva. */
  path: string
  /** Ícono de lucide-react. */
  icon: ReactNode
}

/** Enlaces del menú del profesor guía. */
const navItems: NavItem[] = [
  { label: 'Panel docente', path: '/docente', icon: <LayoutDashboard size={20} /> },
  { label: 'Reflexiones', path: '/docente/reflexiones', icon: <FileText size={20} /> },
  { label: 'Plazos e intentos', path: '/docente/plazos', icon: <Clock size={20} /> },
  { label: 'Innovaciones', path: '/docente/innovaciones', icon: <Lightbulb size={20} /> },
]

export default function TeacherLayout() {
  // En móvil el menú lateral empieza oculto y se abre con el botón de hamburguesa.
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  /** Cierra la sesión y vuelve al login. */
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
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={sidebarOpen}
            aria-controls="teacher-navigation"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <span className="font-heading font-bold text-xl text-primary">
            Reflex<span className="text-accent-ia">IA</span>
          </span>
          <span className="hidden sm:inline text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
            Profesor guía
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
          <nav id="teacher-navigation" className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-texto/70 hover:bg-secondary/5 hover:text-secondary'
                  }`
                }
              >
                {/* El contenido también recibe isActive: así se dibuja la barra
                    verde a la izquierda solo en el enlace activo. */}
                {({ isActive }) => (
                  <>
                    {item.icon}
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute left-0 h-6 w-1 rounded-r-full bg-accent-ia"
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ===== Contenido principal ===== */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Aquí se dibuja la pantalla hija de la ruta actual. */}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
