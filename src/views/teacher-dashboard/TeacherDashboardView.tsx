import Button from '../../components/Button'
import StudentFilterBar from './components/StudentFilterBar'
import StudentProgressTable from './components/StudentProgressTable'
import TeacherStats from './components/TeacherStats'
import { useTeacherDashboard } from './hooks/useTeacherDashboard'

/* ------------------------------------------------
   TeacherDashboardView — panel principal del profesor guía

   Seguimiento semanal de los estudiantes: cuántos aprobaron
   el marco teórico, cómo van sus talleres y quién tiene
   plazos vencidos. A las otras secciones del profesor
   (Plazos e intentos y Reflexiones) se llega desde el
   menú lateral.

   Esta vista no tiene lógica propia: toda la lógica vive en el
   hook useTeacherDashboard y aquí solo se conectan sus datos
   con los componentes.

   Se muestra dentro de TeacherLayout (regla R6).
   ------------------------------------------------ */

/** Fecha y hora legibles en español (e.g. "5 oct 2026, 16:30"). */
const updatedFormatter = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export default function TeacherDashboardView() {
  // Toda la lógica y los datos del panel.
  const dashboard = useTeacherDashboard()

  // Mensaje cuando la tabla no tiene filas: sin estudiantes o filtro sin coincidencias.
  const emptyMessage = dashboard.isEmpty
    ? 'Aún no hay estudiantes en seguimiento.'
    : 'Ningún estudiante coincide con este filtro.'

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* ---- Encabezado: título, explicación y fecha de los datos ---- */}
      <header>
        <h1 className="mb-2 font-heading text-2xl font-bold text-texto md:text-3xl">
          Panel docente
        </h1>
        <p className="max-w-2xl text-texto/70">
          Sigue el avance semanal de tus estudiantes en el marco teórico y los talleres de
          incidentes críticos.
        </p>
        {/* Aclara que los datos son de ejemplo (prototipo). */}
        <p className="mt-1 text-sm text-texto/60">
          Datos de ejemplo
          {dashboard.generatedAt && ` · Actualizado el ${updatedFormatter.format(new Date(dashboard.generatedAt))}`}
        </p>
      </header>

      {dashboard.error ? (
        /* ---- Estado de error: no se pudo cargar el avance ---- */
        <div role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
          <p className="text-texto">{dashboard.error}</p>
          <Button variant="outline" onClick={dashboard.retry}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen. */}
          <TeacherStats summary={dashboard.summary} isLoading={dashboard.isLoading} />

          {/* ---- Seguimiento de estudiantes ---- */}
          <section aria-labelledby="students-title" className="space-y-4">
            <div>
              <h2 id="students-title" className="font-heading text-lg font-semibold text-texto">
                Seguimiento de estudiantes
              </h2>
              <p className="text-sm text-texto/70">
                Filtra por situación para ver quién necesita apoyo.
              </p>
            </div>

            <StudentFilterBar
              filter={dashboard.filter}
              counts={dashboard.filterCounts}
              onChange={dashboard.setFilter}
              isLoading={dashboard.isLoading}
            />

            <div className="rounded-xl border border-border bg-surface p-4 md:p-6">
              <StudentProgressTable
                students={dashboard.students}
                getSituation={dashboard.getSituation}
                isLoading={dashboard.isLoading}
                emptyMessage={emptyMessage}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
