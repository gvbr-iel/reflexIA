import { type ReactNode, useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { FileText, Clock, LayoutDashboard, Menu, X, LogOut } from 'lucide-react'

/* ------------------------------------------------
   TeacherLayout — marco visual del Profesor guía
   Header + sidebar con navegación + área de contenido.
   Responsive: sidebar colapsable en móvil.
   ------------------------------------------------ */

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Panel docente', path: '/docente', icon: <LayoutDashboard size={20} /> },
  { label: 'Reflexiones', path: '/docente/reflexiones', icon: <FileText size={20} /> },
  { label: 'Plazos e intentos', path: '/docente/plazos', icon: <Clock size={20} /> },
]

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-surface border-b border-border h-14 px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-bg transition-colors"
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
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

        <button
          className="flex items-center gap-2 text-sm text-texto/60 hover:text-texto transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Salir</span>
        </button>
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
                      ? 'bg-secondary/10 text-secondary'
                      : 'text-texto/70 hover:bg-secondary/5 hover:text-secondary'
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
