/**
 * @module views/student-dashboard/StudentDashboardView
 *
 * Dashboard principal del estudiante ("Mi progreso").
 *
 * Muestra el estado del ciclo reflexivo y el avance del estudiante:
 * 1. Verificación del Marco Teórico (RF-04 / REF-21) - Prerrequisito obligatorio.
 * 2. Talleres de Incidentes Críticos (RF-03) - Desbloqueados tras aprobar el marco teórico.
 * 3. Propuesta de Innovación Pedagógica (RF-07).
 *
 * Cumple con RNF-04: acceso en máximo 2 clics a cualquier taller o marco teórico.
 *
 * Nota: los datos se consultan aquí con theoryQuizService; lo ideal según la
 * regla R4 sería hacerlo a través de un hook.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Lightbulb,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Award,
  Sparkles,
  Clock,
} from 'lucide-react'
import { theoryQuizService } from '../../services/theoryQuizService'
import type { TheoryApprovalStatus, QuizConfig } from '../../models/theoryQuiz'
import Button from '../../components/Button'

export default function StudentDashboardView() {
  const navigate = useNavigate()
  // Resultado del marco teórico y configuración del cuestionario (null mientras cargan).
  const [approval, setApproval] = useState<TheoryApprovalStatus | null>(null)
  const [config, setConfig] = useState<QuizConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Al abrir el panel se piden ambos datos a la vez.
  useEffect(() => {
    async function loadData() {
      try {
        // Promise.all espera las dos consultas en paralelo (más rápido que una tras otra).
        const [appr, conf] = await Promise.all([
          theoryQuizService.getApprovalStatus(),
          theoryQuizService.getConfig(),
        ])
        setApproval(appr)
        setConfig(conf)
      } catch (err) {
        console.error('Error al cargar progreso del estudiante:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Valores listos para mostrar. "?." evita errores si el dato aún es null,
  // y "??" pone un valor por defecto mientras tanto.
  const isApproved = approval?.isApproved ?? false
  const attemptsUsed = approval?.result?.attemptsUsed ?? 0
  const maxAttempts = config?.maxAttempts ?? 3
  const bestScore = approval?.result?.bestScore ?? 0
  const totalQuestions = approval?.result?.totalQuestions ?? 10

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ===== Encabezado institucional ===== */}
      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              Práctica Profesional Pedagógica
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-texto">
              Mi Progreso Reflexivo
            </h1>
            <p className="text-texto/70 text-sm md:text-base mt-1">
              Plataforma de reflexión sistemática orientada a la mejora continua y transformación docente.
            </p>
          </div>

          <div className="flex flex-wrap md:flex-col items-start md:items-end gap-1.5 text-xs text-texto/60 bg-bg p-3.5 rounded-xl border border-border">
            <span><strong>Profesor guía:</strong> Marcela Gómez</span>
            <span><strong>Asignatura:</strong> Práctica Profesional</span>
            <span><strong>Semestre:</strong> 2026-2</span>
          </div>
        </div>
      </div>

      {/* ===== Alerta destacada si el marco teórico está pendiente ===== */}
      {!loading && !isApproved && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-texto text-base">
                Paso obligatorio pendiente: Verificación del Marco Teórico
              </h3>
              <p className="text-texto/70 text-sm mt-0.5">
                Para acceder a los talleres de incidentes críticos (RF-03), debes primero demostrar tu dominio del marco teórico aprobando la evaluación diagnóstica (RF-04).
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight size={18} />}
            onClick={() => navigate('/estudiante/marco-teorico')}
            className="shrink-0 w-full sm:w-auto"
          >
            Iniciar evaluación
          </Button>
        </div>
      )}

      {/* ===== Resumen de métricas / KPI ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI Marco Teórico */}
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isApproved ? 'bg-accent-ia/10 text-accent-ia' : 'bg-primary/10 text-primary'}`}>
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-xs text-texto/60 font-medium">Marco Teórico</div>
            <div className="font-heading text-lg font-bold text-texto">
              {loading ? '…' : isApproved ? 'Aprobado ✓' : 'Pendiente'}
            </div>
            <div className="text-xs text-texto/60">
              {attemptsUsed > 0 ? `${attemptsUsed} de ${maxAttempts} intentos usados` : 'Sin intentos iniciados'}
            </div>
          </div>
        </div>

        {/* KPI Talleres */}
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isApproved ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400'}`}>
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="text-xs text-texto/60 font-medium">Talleres Prácticos</div>
            <div className="font-heading text-lg font-bold text-texto">
              {loading ? '…' : isApproved ? 'Habilitados (4)' : 'Bloqueados'}
            </div>
            <div className="text-xs text-texto/60">
              {isApproved ? 'Listos para iniciar' : 'Requiere marco teórico'}
            </div>
          </div>
        </div>

        {/* KPI Innovaciones */}
        <div className="bg-surface rounded-xl border border-border p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gray-100 text-gray-400">
            <Lightbulb size={24} />
          </div>
          <div>
            <div className="text-xs text-texto/60 font-medium">Innovaciones</div>
            <div className="font-heading text-lg font-bold text-texto">Fase final</div>
            <div className="text-xs text-texto/60">Post-talleres reflexivos</div>
          </div>
        </div>
      </div>

      {/* ===== Secuencia lineal de etapas ===== */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-texto">
          Ruta del Ciclo Reflexivo
        </h2>

        <div className="space-y-4">
          {/* Etapa 1: Marco Teórico */}
          <div className={`bg-surface rounded-xl border p-5 md:p-6 transition-all ${isApproved ? 'border-accent-ia/30 bg-accent-ia/[0.02]' : 'border-primary/30 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isApproved ? 'bg-accent-ia/10 text-accent-ia' : 'bg-primary/10 text-primary'}`}>
                  {isApproved ? <CheckCircle2 size={26} /> : <BookOpen size={24} />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-texto/50 uppercase tracking-wider">Etapa 1</span>
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-accent-ia/10 text-accent-ia px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 size={12} />
                        Aprobado ({bestScore}/{totalQuestions})
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                        Primer paso obligatorio
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-texto">
                    Verificación del Marco Teórico (REF-21 / RF-04)
                  </h3>
                  <p className="text-sm text-texto/70 max-w-2xl">
                    {isApproved
                      ? `Has demostrado dominio de los conceptos fundamentales sobre reflexión docente y Schön (${bestScore}/${totalQuestions} respuestas correctas). Los talleres prácticos han sido desbloqueados.`
                      : 'Evaluación diagnóstica aleatoria de 10 preguntas sobre marcos teóricos de la reflexión docente. Dispones de 15 minutos y hasta 3 intentos.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-texto/60 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} /> 15 minutos
                    </span>
                    <span>10 preguntas</span>
                    <span>Mínimo 70% para aprobar</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                <Button
                  variant={isApproved ? 'outline' : 'primary'}
                  size="md"
                  onClick={() => navigate('/estudiante/marco-teorico')}
                  icon={<ArrowRight size={16} />}
                >
                  {isApproved ? 'Ver resultados / Repasar' : 'Comenzar evaluación'}
                </Button>
              </div>
            </div>
          </div>

          {/* Etapa 2: Talleres de Incidentes Críticos */}
          <div className={`bg-surface rounded-xl border p-5 md:p-6 transition-all ${isApproved ? 'border-border' : 'border-border/60 opacity-80'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isApproved ? 'bg-secondary/10 text-secondary' : 'bg-gray-100 text-gray-400'}`}>
                  {isApproved ? <ClipboardList size={24} /> : <Lock size={22} />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-texto/50 uppercase tracking-wider">Etapa 2</span>
                    {isApproved ? (
                      <span className="text-xs font-semibold bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full">
                        Desbloqueado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                        <Lock size={11} /> Requiere Marco Teórico
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-texto">
                    Talleres de Incidentes Críticos (RF-03)
                  </h3>
                  <p className="text-sm text-texto/70 max-w-2xl">
                    Registro de situaciones significativas en aula a través del asistente de 4 pasos (Contexto, Hecho, Actores y Relevancia Pedagógica) con retroalimentación IA ("El Impulso").
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={!isApproved}
                  onClick={() => navigate('/estudiante/talleres')}
                  icon={isApproved ? <ArrowRight size={16} /> : <Lock size={16} />}
                >
                  {isApproved ? 'Ir a los talleres' : 'Bloqueado'}
                </Button>
              </div>
            </div>
          </div>

          {/* Etapa 3: Biblioteca de Innovaciones */}
          <div className="bg-surface rounded-xl border border-border/60 p-5 md:p-6 opacity-75">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                  <Award size={24} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-texto/50 uppercase tracking-wider">Etapa 3</span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                      Fase final
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-bold text-texto">
                    Propuesta de Innovación Pedagógica (RF-07)
                  </h3>
                  <p className="text-sm text-texto/70 max-w-2xl">
                    Diseño de una propuesta transformadora basada en los incidentes analizados durante la práctica, con opción a publicación en el repositorio docente.
                  </p>
                </div>
              </div>

              <div className="shrink-0 pt-2 sm:pt-0">
                <Button
                  variant="outline"
                  size="md"
                  disabled
                  icon={<Lock size={16} />}
                >
                  Próximamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
