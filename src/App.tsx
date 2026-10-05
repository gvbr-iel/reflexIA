import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

/* La guarda de ruta se carga de inmediato: protege /estudiante. */
import RequireStudent from './components/RequireStudent'

/* ---------- Layouts y vistas ----------
   Cada pantalla se carga bajo demanda cuando se visita su ruta (lazy), por
   lo que no se importan de forma estática: hacerlo duplicaría el nombre. */
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const TeacherLayout = lazy(() => import('./layouts/TeacherLayout'))
const StudentLayout = lazy(() => import('./layouts/StudentLayout'))
const WhiteListView = lazy(() => import('./views/admin-whitelist/WhiteListView'))
const TeacherDashboardView = lazy(
  () => import('./views/teacher-dashboard/TeacherDashboardView'),
)
const ReflectionsView = lazy(() => import('./views/reflections/ReflectionsView'))
const DeadlinesView = lazy(() => import('./views/work-pacing/DeadlinesView'))
const StudentDashboardView = lazy(
  () => import('./views/student-dashboard/StudentDashboardView'),
)
const TheoryQuizView = lazy(() => import('./views/theory-verification/TheoryQuizView'))
const RepositoryView = lazy(() => import('./views/repository/RepositoryView'))
const CriticalIncidentView = lazy(
  () => import('./views/critical-incidents/CriticalIncidentView'),
)
const InnovationsView = lazy(() => import('./views/innovations/InnovationsView'))
const LandingPage = lazy(() => import('./views/landingpage/LandingPage'))
const LoginView = lazy(() => import('./views/auth/LoginView'))

/* ------------------------------------------------
   App — árbol de rutas de la aplicación.
   Cada rol tiene un layout envolvente (con sidebar)
   y rutas hijas anidadas renderizadas vía <Outlet>.
   ------------------------------------------------ */
export default function App() {
  return (
    <Suspense
      fallback={
        <main
          role="status"
          className="flex min-h-screen items-center justify-center p-6 text-base text-texto/70"
        >
          Cargando…
        </main>
      }
    >
      <Routes>
        {/* ===== Página pública de presentación ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/iniciar-sesion" element={<LoginView />} />

        {/* ===== Admin ===== */}
        <Route
          path="/admin"
          element={
            <RequireStudent allowedRoles={['admin']}>
              <AdminLayout />
            </RequireStudent>
          }
        >
          {/* /admin → redirige a /admin/whitelist */}
          <Route index element={<Navigate to="whitelist" replace />} />
          <Route path="whitelist" element={<WhiteListView />} />
        </Route>

        {/* ===== Docente ===== */}
        <Route
          path="/docente"
          element={
            <RequireStudent allowedRoles={['teacher']}>
              <TeacherLayout />
            </RequireStudent>
          }
        >
          <Route index element={<TeacherDashboardView />} />
          <Route path="reflexiones" element={<ReflectionsView />} />
          <Route path="plazos" element={<DeadlinesView />} />
        </Route>

        {/* ===== Estudiante ===== */}
        <Route
          path="/estudiante"
          element={
            <RequireStudent>
              <StudentLayout />
            </RequireStudent>
          }
        >
          <Route index element={<StudentDashboardView />} />
          <Route path="marco-teorico" element={<TheoryQuizView />} />
          {/* /estudiante/talleres → lista de talleres;
              /estudiante/talleres/:workshopId → asistente de incidentes
              críticos del taller elegido, sin salir de la sección Talleres. */}
          <Route path="talleres">
            <Route index element={<RepositoryView />} />
            <Route path=":workshopId" element={<CriticalIncidentView />} />
          </Route>
          <Route path="innovaciones" element={<InnovationsView />} />
        </Route>

        {/* ===== Fallback ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
