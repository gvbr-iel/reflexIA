/**
 * @module views/repository/RepositoryView
 *
 * Repositorio de talleres prácticos de incidentes críticos (RF-03).
 *
 * Aplica la regla de negocio RF-03 / RF-04:
 * Solo los estudiantes que hayan aprobado la evaluación diagnóstica
 * del marco teórico pueden acceder a los talleres prácticos.
 *
 * Si el marco teórico está pendiente, muestra un estado bloqueado
 * con acceso directo a la evaluación.
 *
 * La lista de talleres y su estado (bloqueado, disponible, en curso,
 * aprobado o reprobado) se leen de la misma fuente que el asistente de
 * incidentes críticos (`useWorkshops`), y cada botón abre el asistente
 * del taller elegido (/estudiante/talleres/:workshopId), sin salir de la
 * sección Talleres.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import { theoryQuizService } from '../../services/theoryQuizService'
import type { TheoryApprovalStatus } from '../../models/theoryQuiz'
import type { Workshop } from '../../models/criticalIncident'
import { useWorkshops } from '../../hooks/useWorkshops'
import { workshopRoute } from '../../utils/routes'
import Button from '../../components/Button'
import WorkshopStatusBadge from '../../components/WorkshopStatusBadge'

/** Texto del botón de un taller que no está bloqueado. */
function actionLabel(workshop: Workshop): string {
  if (workshop.status === 'in-progress') return 'Continuar taller'
  if (workshop.status === 'completed') return 'Ver taller'
  return 'Comenzar taller'
}

/** Formatea una fecha YYYY-MM-DD (se interpreta como fecha local). */
function formatDeadline(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function RepositoryView() {
  const navigate = useNavigate()
  const [approval, setApproval] = useState<TheoryApprovalStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const {
    workshops,
    isLoading: isLoadingWorkshops,
    error: workshopsError,
    retry: retryWorkshops,
  } = useWorkshops()

  useEffect(() => {
    theoryQuizService.getApprovalStatus()
      .then((res) => setApproval(res))
      .catch((err) => console.error('Error al consultar estado de marco teórico:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin" />
        <p className="text-texto/60 text-sm">Comprobando requisitos de acceso…</p>
      </div>
    )
  }

  // ── Estado bloqueado: no ha aprobado el marco teórico (RF-03 / RF-04) ──
  if (!approval?.isApproved) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center">
        <div className="bg-surface rounded-2xl border border-border p-8 md:p-12 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-primary/10 px-3 py-1 rounded-full">
              Requisito previo obligatorio (RF-03 / REF-21)
            </span>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-texto">
              Talleres Prácticos Bloqueados
            </h1>
            <p className="text-texto/70 text-base max-w-lg mx-auto leading-relaxed">
              Para ingresar a los talleres y redactar incidentes críticos con el asistente inteligente, debes primero demostrar tu dominio del marco teórico sobre reflexión pedagógica.
            </p>
          </div>

          <div className="bg-bg rounded-xl border border-border p-4 text-left flex items-start gap-3">
            <BookOpen size={20} className="text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-texto block">Evaluación del Marco Teórico (RF-04):</span>
              <span className="text-texto/70">10 preguntas aleatorias, 15 minutos, máximo 3 intentos. Requiere al menos 70% de aciertos.</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight size={20} />}
              onClick={() => navigate('/estudiante/marco-teorico')}
              className="w-full sm:w-auto"
            >
              Ir a la evaluación del marco teórico
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Lista de talleres: carga, error, vacío o tarjetas ──
  function renderWorkshops() {
    if (isLoadingWorkshops) {
      return (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="status"
          aria-busy="true"
          aria-label="Cargando talleres"
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-52 rounded-xl bg-border/50 animate-pulse" />
          ))}
        </div>
      )
    }

    if (workshopsError) {
      return (
        <div role="alert" className="bg-surface rounded-xl border border-border p-5 space-y-3">
          <p className="text-texto">{workshopsError}</p>
          <Button variant="outline" size="sm" onClick={retryWorkshops}>
            Reintentar
          </Button>
        </div>
      )
    }

    if (workshops.length === 0) {
      return <p className="text-texto/70">Por ahora no hay talleres disponibles.</p>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workshops.map((workshop) => (
          <div
            key={workshop.id}
            className="bg-surface rounded-xl border border-border p-5 hover:border-secondary/50 transition-all flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                  Taller {workshop.number}
                </span>
                {workshop.deadline && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-texto/60">
                    <Calendar size={12} /> {formatDeadline(workshop.deadline)}
                  </span>
                )}
              </div>

              <h3 className="font-heading text-lg font-bold text-texto">
                {workshop.title}: {workshop.topic}
              </h3>
              <p className="text-xs font-medium text-secondary">
                {workshop.subtitle}
              </p>
              <p className="text-sm text-texto/70 leading-relaxed">
                {workshop.description}
              </p>
            </div>

            <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-3">
              <WorkshopStatusBadge workshop={workshop} />
              {workshop.status === 'locked' ? (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Lock size={14} />}
                  disabled
                >
                  Bloqueado
                </Button>
              ) : (
                <Button
                  variant={workshop.status === 'completed' ? 'outline' : 'primary'}
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  onClick={() => navigate(workshopRoute(workshop.id))}
                >
                  {actionLabel(workshop)}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Estado desbloqueado: marco teórico aprobado ──
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-ia uppercase tracking-wider mb-2">
              <CheckCircle2 size={14} />
              Requisitos completados
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-texto">
              Talleres de Incidentes Críticos
            </h1>
            <p className="text-texto/70 text-sm md:text-base mt-1">
              Ciclo reflexivo guiado en 4 talleres prácticos con retroalimentación IA ("El Impulso").
            </p>
          </div>

          <div className="flex items-center gap-2 bg-accent-ia/10 text-accent-ia px-3 py-2 rounded-xl text-xs font-semibold">
            <Sparkles size={16} />
            <span>Marco teórico verificado</span>
          </div>
        </div>
      </div>

      {/* Lista de talleres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-texto flex items-center gap-2">
            <Layers size={20} className="text-secondary" />
            Talleres del Semestre
          </h2>
          <span className="text-xs text-texto/60 font-medium">
            {workshops.length > 0 ? workshops.length : 4} etapas secuenciales
          </span>
        </div>

        {renderWorkshops()}
      </div>
    </div>
  )
}
