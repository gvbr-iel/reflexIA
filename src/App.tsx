import { Routes, Route, Navigate } from 'react-router-dom'

/* ---------- Layouts ---------- */
import AdminLayout from './layouts/AdminLayout'
import TeacherLayout from './layouts/TeacherLayout'
import StudentLayout from './layouts/StudentLayout'

/* ---------- Vistas — Admin ---------- */
import WhiteListView from './views/admin-whitelist/WhiteListView'

/* ---------- Vistas — Docente ---------- */
import TeacherDashboardView from './views/teacher-dashboard/TeacherDashboardView'
import ReflectionsView from './views/reflections/ReflectionsView'
import DeadlinesView from './views/deadlines/DeadlinesView'

/* ---------- Vistas — Estudiante ---------- */
import StudentDashboardView from './views/student-dashboard/StudentDashboardView'
import TheoryQuizView from './views/theory-verification/TheoryQuizView'
import RepositoryView from './views/repository/RepositoryView'
import CriticalIncidentView from './views/critical-incidents/CriticalIncidentView'
import LandingPage from './views/landingpage/LandingPage'

/* ------------------------------------------------
   App — árbol de rutas de la aplicación.
   Cada rol tiene un layout envolvente (con sidebar)
   y rutas hijas anidadas renderizadas vía <Outlet>.
   ------------------------------------------------ */
export default function App() {
  return (
    <Routes>
      {/* ===== Página pública de presentación ===== */}
      <Route path="/" element={<LandingPage />} />

      {/* ===== Admin ===== */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* /admin → redirige a /admin/whitelist */}
        <Route index element={<Navigate to="whitelist" replace />} />
        <Route path="whitelist" element={<WhiteListView />} />
      </Route>

      {/* ===== Docente ===== */}
      <Route path="/docente" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboardView />} />
        <Route path="reflexiones" element={<ReflectionsView />} />
        <Route path="plazos" element={<DeadlinesView />} />
      </Route>

      {/* ===== Estudiante ===== */}
      <Route path="/estudiante" element={<StudentLayout />}>
        <Route index element={<StudentDashboardView />} />
        <Route path="marco-teorico" element={<TheoryQuizView />} />
        <Route path="talleres" element={<RepositoryView />} />
        <Route path="innovaciones/:workshopId?" element={<CriticalIncidentView />} />
      </Route>

      {/* ===== Fallback ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
