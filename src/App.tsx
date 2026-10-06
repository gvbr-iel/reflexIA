/**
 * @module App
 *
 * Árbol de rutas de la aplicación: decide qué pantalla se muestra según la URL.
 *
 * Organización:
 * - Rutas públicas: la página de presentación (`/`) y el login (`/iniciar-sesion`).
 * - Una ruta por rol (`/admin`, `/docente`, `/estudiante`). Cada una:
 *     1. pasa por la guarda `RequireStudent`, que revisa la sesión y el rol;
 *     2. dibuja el layout del rol (cabecera + menú lateral);
 *     3. muestra la pantalla hija dentro del `<Outlet />` del layout.
 * - Cualquier otra URL vuelve a la página de inicio.
 */

import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

/* La guarda de ruta se importa de forma normal (no lazy) porque se necesita
   de inmediato para decidir si se puede entrar a cada sección. */
import RequireStudent from './components/RequireStudent'

/* ---------- Layouts y vistas ----------
   Cada pantalla se carga "bajo demanda" (lazy): su código se descarga recién
   cuando el usuario visita la ruta. Así la primera carga de la app es más
   liviana. Mientras se descarga, <Suspense> muestra el texto "Cargando…". */
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

/** Componente raíz con todas las rutas de la aplicación. */
export default function App() {
  return (
    // Texto que se ve mientras se descarga el código de una pantalla lazy.
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
        {/* ===== Rutas públicas: no necesitan sesión ===== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/iniciar-sesion" element={<LoginView />} />

        {/* ===== Administrador: solo el rol 'admin' ===== */}
        <Route
          path="/admin"
          element={
            <RequireStudent allowedRoles={['admin']}>
              <AdminLayout />
            </RequireStudent>
          }
        >
          {/* /admin → redirige a /admin/whitelist (HU-01) */}
          <Route index element={<Navigate to="whitelist" replace />} />
          <Route path="whitelist" element={<WhiteListView />} />
        </Route>

        {/* ===== Profesor guía: solo el rol 'teacher' ===== */}
        <Route
          path="/docente"
          element={
            <RequireStudent allowedRoles={['teacher']}>
              <TeacherLayout />
            </RequireStudent>
          }
        >
          {/* "index" es la pantalla de /docente sin nada más en la URL. */}
          <Route index element={<TeacherDashboardView />} />
          <Route path="reflexiones" element={<ReflectionsView />} />
          <Route path="plazos" element={<DeadlinesView />} />
          <Route path="innovaciones" element={<InnovationsView />} />
        </Route>

        {/* ===== Estudiante: por defecto la guarda solo deja pasar a 'student' ===== */}
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
              críticos del taller elegido, sin salir de la sección Talleres.
              ":workshopId" es un parámetro: la vista lo lee con useParams(). */}
          <Route path="talleres">
            <Route index element={<RepositoryView />} />
            <Route path=":workshopId" element={<CriticalIncidentView />} />
          </Route>
          <Route path="innovaciones" element={<InnovationsView />} />
        </Route>

        {/* ===== Ruta comodín: cualquier URL desconocida vuelve al inicio ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
