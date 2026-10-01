import { type ReactNode, useState } from 'react'
import { Outlet } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Lightbulb,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

/* ------------------------------------------------
   StudentLayout — marco visual del Estudiante
   Header + sidebar con navegación lineal de talleres
   + área de contenido. Responsive: sidebar colapsable.
   ------------------------------------------------ */

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Mi progreso', path: '/estudiante', icon: <LayoutDashboard size={20} /> },
  { label: 'Marco teórico', path: '/estudiante/marco-teorico', icon: <BookOpen size={20} /> },
  { label: 'Talleres', path: '/estudiante/talleres', icon: <ClipboardList size={20} /> },
  { label: 'Innovaciones', path: '/estudiante/innovaciones', icon: <Lightbulb size={20} /> },
]

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* ===== Header ===== */}
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
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
          <span className="hidden sm:inline text-xs bg-accent-ia/10 text-accent-ia px-2 py-0.5 rounded-full font-medium">
            Estudiante
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
            fixed md:static top-[57px] left-0 h-[calc(100vh-57px)]
            w-60 bg-surface border-r border-border
            flex flex-col p-4 gap-1
            z-30 transition-transform duration-200
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className="
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  text-texto/70 hover:bg-accent-ia/5 hover:text-accent-ia
                  transition-colors
                "
              >
                {item.icon}
                {item.label}
              </a>
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
