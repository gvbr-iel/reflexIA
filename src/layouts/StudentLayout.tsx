import { type ReactNode, useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Lightbulb,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { theoryQuizService } from '../services/theoryQuizService'

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
  const [isTheoryApproved, setIsTheoryApproved] = useState<boolean | null>(null)
  const location = useLocation()

  useEffect(() => {
    // Consultar estado de aprobación del marco teórico
    theoryQuizService.getApprovalStatus().then((status) => {
      setIsTheoryApproved(status.isApproved)
    })
  }, [location.pathname])

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
            {navItems.map((item) => {
              const isTheoryItem = item.path === '/estudiante/marco-teorico'
              const isTalleresItem = item.path === '/estudiante/talleres'

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent-ia/10 text-accent-ia'
                        : 'text-texto/70 hover:bg-accent-ia/5 hover:text-accent-ia'
                    }`
                  }
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>

                  {/* Indicador marco teórico: aprobado */}
                  {isTheoryItem && isTheoryApproved === true && (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent-ia bg-accent-ia/10 px-1.5 py-0.5 rounded-full"
                      title="Marco teórico aprobado"
                    >
                      <CheckCircle2 size={12} />
                      <span className="hidden lg:inline text-[10px]">Listo</span>
                    </span>
                  )}

                  {/* Indicador marco teórico: pendiente */}
                  {isTheoryItem && isTheoryApproved === false && (
                    <span
                      className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full"
                      title="Evaluación requerida"
                    >
                      Req.
                    </span>
                  )}

                  {/* Indicador talleres: bloqueado si no ha aprobado */}
                  {isTalleresItem && isTheoryApproved === false && (
                    <span
                      className="text-texto/40"
                      title="Bloqueado hasta aprobar el marco teórico (RF-03)"
                    >
                      <Lock size={13} />
                    </span>
                  )}
                </NavLink>
              )
            })}
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
