/**
 * @module views/theory-verification/hooks/useTheoryQuiz
 *
 * Hook principal del módulo HU-04: Verificación del Marco Teórico.
 *
 * Encapsula toda la lógica y el estado del cuestionario (R5):
 * - Fases del flujo (intro → quiz → resultado)
 * - Selección y navegación de preguntas
 * - Temporizador regresivo con auto-envío al expirar
 * - Registro de respuestas y cálculo de puntaje
 * - Gestión de intentos: 9 en 3 bloques con nota máxima 7,0, 5,0 y 4,0 (CU-08)
 * - Un solo punto de envío para el botón y el fin del tiempo (T5 del Lab 9)
 * - Estados de carga, error y vacío (R9)
 *
 * Los componentes consumen este hook sin mezclar lógica con JSX.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import type {
  QuizQuestion,
  QuizConfig,
  TheoryApprovalStatus,
  QuizAttempt,
  SubmitAttemptPayload,
} from '../../../models/theoryQuiz';
import type { PerformanceStatus } from '../../../models/teacherDashboard';
import { DEFAULT_QUIZ_CONFIG } from '../../../models/theoryQuiz';
import {
  theoryQuizService,
  TheoryQuizSubmitError,
} from '../../../services/theoryQuizService';
import { getQuizStatus } from '../../../utils/theoryQuizGrading';
import { getPerformanceStatus } from '../../../utils/performanceStatus';

// ─────────────────────────────────────────────
// Tipos del hook
// ─────────────────────────────────────────────

/** Fases del flujo de la vista. */
export type QuizPhase = 'loading' | 'intro' | 'quiz' | 'result';

/** Mapa de respuestas seleccionadas: questionId → selectedOptionId. */
export type AnswerMap = Record<string, string>;

/** Estado completo expuesto por el hook. */
export interface UseTheoryQuizState {
  /** Fase actual del flujo. */
  phase: QuizPhase;
  /** Preguntas del intento actual. */
  questions: QuizQuestion[];
  /** Índice de la pregunta actual (0-based). */
  currentIndex: number;
  /** Mapa de respuestas seleccionadas. */
  answers: AnswerMap;
  /** Segundos restantes del temporizador. */
  timeRemaining: number;
  /** Configuración vigente del cuestionario. */
  config: QuizConfig;
  /** Estado de aprobación del estudiante. */
  approval: TheoryApprovalStatus;
  /** Último intento completado (para mostrar en ScoreCard). */
  lastAttempt: QuizAttempt | null;
  /** Historial de todos los intentos. */
  attemptHistory: QuizAttempt[];
  /** Número del intento actual (1-based). */
  currentAttemptNumber: number;
  /** Si hay una operación en curso (carga inicial, envío). */
  isLoading: boolean;
  /** Mensaje de error (null si no hay error). */
  error: string | null;
  /** Si el temporizador está activo. */
  isTimerRunning: boolean;
  /** Bloque del próximo intento: 1 (intentos 1 a 3), 2 (4 a 6) o 3 (7 a 9). */
  currentBlock: number;
  /** Nota máxima del próximo intento (7,0, 5,0 o 4,0); null si ya no puede rendir. */
  currentMaxGrade: number | null;
  /** true si el próximo intento empieza un bloque con nota máxima menor. */
  startsLowerBlock: boolean;
  /** Si usó los 9 intentos sin aprobar: solo el profesor guía lo habilita. */
  isBlocked: boolean;
  /** Mejor nota obtenida (null si no ha rendido). */
  bestGrade: number | null;
  /** Notas máximas de cada bloque, para explicar las reglas en la intro. */
  gradeCaps: number[];
  /** Desempeño de una nota según la rueda (AI_GUIDELINES §4), para su color. */
  getGradePerformance: (grade: number) => PerformanceStatus;
}

/** Acciones expuestas por el hook. */
export interface UseTheoryQuizActions {
  /** Inicia un nuevo intento (carga preguntas y arranca el timer). */
  startQuiz: () => Promise<void>;
  /** Selecciona una opción para la pregunta actual. */
  selectAnswer: (questionId: string, optionId: string) => void;
  /** Avanza a la siguiente pregunta. */
  goToNext: () => void;
  /** Retrocede a la pregunta anterior. */
  goToPrevious: () => void;
  /** Salta a una pregunta específica por índice. */
  goToQuestion: (index: number) => void;
  /** Envía las respuestas del intento actual. */
  submitQuiz: () => Promise<void>;
  /** Vuelve a la pantalla de introducción (para reintentar). */
  resetToIntro: () => void;
}

/** Retorno completo del hook. */
export type UseTheoryQuizReturn = UseTheoryQuizState & UseTheoryQuizActions;

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useTheoryQuiz(): UseTheoryQuizReturn {
  // ── Estado del flujo ──────────────────────
  const [phase, setPhase] = useState<QuizPhase>('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Configuración y aprobación ────────────
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_QUIZ_CONFIG);
  const [approval, setApproval] = useState<TheoryApprovalStatus>({
    isApproved: false,
    result: null,
    approvedAt: null,
  });
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([]);

  // ── Estado del intento actual ─────────────
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

  // ── Temporizador ──────────────────────────
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Referencia mutable a `answers` para acceder en el callback del timer
  // sin re-crear el intervalo cada vez que cambian las respuestas.
  const answersRef = useRef<AnswerMap>({});
  answersRef.current = answers;

  // Referencia mutable a `questions` para el auto-envío del timer.
  const questionsRef = useRef<QuizQuestion[]>([]);
  questionsRef.current = questions;

  // Evita el doble envío si el botón y el fin del tiempo coinciden (T5).
  const isSubmittingRef = useRef(false);

  // Número de intento actual derivado del historial.
  const currentAttemptNumber = attemptHistory.length + 1;

  // Estado del cuestionario según las reglas de la T2 (sin recalcular a mano).
  const quizStatus = useMemo(
    () => getQuizStatus(attemptHistory, config),
    [attemptHistory, config],
  );
  const attemptsPerBlock = config.attemptsPerBlock;
  const currentBlock = Math.min(
    config.gradeCaps.length,
    Math.ceil(currentAttemptNumber / attemptsPerBlock),
  );
  const currentMaxGrade = quizStatus.nextGradeCap;
  const startsLowerBlock =
    quizStatus.nextAttemptNumber !== null &&
    quizStatus.nextAttemptNumber > 1 &&
    (quizStatus.nextAttemptNumber - 1) % attemptsPerBlock === 0;
  // Un estado guardado puede marcar bloqueo aunque el historial local no lo muestre.
  const isBlocked = quizStatus.isBlocked || approval.result?.isBlocked === true;

  // ── Limpieza del timer al desmontar ───────
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ── Carga inicial ─────────────────────────
  // Al abrir la pantalla se piden a la vez: aprobación, historial de intentos y configuración.
  useEffect(() => {
    /** Decide la fase inicial: resultado (si ya aprobó) o introducción. */
    async function loadInitialState() {
      try {
        setIsLoading(true);
        setError(null);

        const [approvalStatus, history, quizConfig] = await Promise.all([
          theoryQuizService.getApprovalStatus(),
          theoryQuizService.getAttemptHistory(),
          theoryQuizService.getConfig(),
        ]);

        setApproval(approvalStatus);
        setAttemptHistory(history);
        setConfig(quizConfig);

        // Si ya aprobó, mostrar resultado directamente
        if (approvalStatus.isApproved && history.length > 0) {
          const bestAttempt = history.reduce((best, current) =>
            current.score > best.score ? current : best,
          );
          setLastAttempt(bestAttempt);
          setPhase('result');
        } else {
          setPhase('intro');
        }
      } catch {
        setError(
          'No se pudo cargar el estado de la evaluación. ' +
          'Verifica tu conexión e intenta nuevamente.',
        );
        setPhase('intro');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialState();
  }, []);

  // ── Lógica del temporizador ───────────────
  /** Detiene el temporizador (al enviar, al volver a la intro o al agotarse el tiempo). */
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  /**
   * Único punto de envío del intento (T5). Lo usan el botón "Finalizar"
   * (timedOut = false) y el fin del tiempo (timedOut = true). Lee las
   * respuestas desde las referencias para tener siempre los valores más
   * recientes, también cuando lo llama el temporizador.
   */
  const sendAttempt = useCallback(async (timedOut: boolean) => {
    // Si el botón y el fin del tiempo coinciden, el segundo envío se ignora.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    stopTimer();
    setIsLoading(true);
    setError(null);

    try {
      const payload: SubmitAttemptPayload = {
        answers: questionsRef.current.map((q) => ({
          questionId: q.id,
          selectedOptionId: answersRef.current[q.id] ?? '',
        })),
        attemptNumber: currentAttemptNumber,
        durationSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        // El servicio fija el estado timed-out antes de guardar (D-01).
        timedOut,
      };

      const { attempt, approval: newApproval } =
        await theoryQuizService.submitAttempt(payload);

      setLastAttempt(attempt);
      setApproval(newApproval);
      setAttemptHistory((prev) => [...prev, attempt]);
      setPhase('result');
    } catch (err) {
      if (err instanceof TheoryQuizSubmitError) {
        // T3: la evaluación ya está aprobada o bloqueada. Se recarga el estado
        // real y se vuelve a la intro, que muestra el mensaje y el aviso.
        setApproval(await theoryQuizService.getApprovalStatus());
        // Si quedó bloqueada, la intro ya muestra el aviso de bloqueo.
        setError(err.reason === 'blocked' ? null : err.message);
        setPhase('intro');
      } else {
        setError(
          timedOut
            ? 'El tiempo se agotó y no se pudieron enviar las respuestas. Intenta nuevamente.'
            : 'No se pudieron enviar las respuestas. Verifica tu conexión e intenta nuevamente.',
        );
      }
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [currentAttemptNumber, stopTimer]);

  /** Se ejecuta cuando el tiempo llega a cero: envía lo respondido hasta ese momento. */
  const handleTimeUp = useCallback(() => sendAttempt(true), [sendAttempt]);

  /**
   * Inicia la cuenta regresiva: cada 1 segundo (setInterval) resta 1 a
   * timeRemaining. Al llegar a 0 llama a handleTimeUp.
   */
  const startTimer = useCallback((durationSeconds: number) => {
    // Limpiar timer previo si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimeRemaining(durationSeconds);
    startTimeRef.current = Date.now();
    setIsTimerRunning(true);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Se ejecuta handleTimeUp fuera del setState para evitar
          // actualizaciones de estado dentro de setState.
          setTimeout(() => handleTimeUp(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleTimeUp]);

  // ── Acciones públicas ─────────────────────

  /** Pide 10 preguntas aleatorias, reinicia las respuestas y arranca el temporizador. */
  const startQuiz = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { questions: newQuestions, config: newConfig } =
        await theoryQuizService.fetchQuestions();

      setQuestions(newQuestions);
      setConfig(newConfig);
      setCurrentIndex(0);
      setAnswers({});
      setLastAttempt(null);
      setPhase('quiz');

      startTimer(newConfig.timeLimitSeconds);
    } catch {
      setError(
        'No se pudieron cargar las preguntas de la evaluación. ' +
        'Verifica tu conexión e intenta nuevamente.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [startTimer]);

  /** Guarda la opción elegida para una pregunta (reemplaza la anterior si existía). */
  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }, []);

  /** Avanza a la siguiente pregunta (no pasa de la última). */
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) =>
      prev < questions.length - 1 ? prev + 1 : prev,
    );
  }, [questions.length]);

  /** Vuelve a la pregunta anterior (no baja de la primera). */
  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  /** Salta directamente a una pregunta por su posición (desde los números de navegación). */
  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
      }
    },
    [questions.length],
  );

  /** Envía las respuestas al pulsar "Finalizar evaluación". */
  const submitQuiz = useCallback(() => sendAttempt(false), [sendAttempt]);

  /** Vuelve a la pantalla de introducción (por ejemplo, para un nuevo intento). */
  const resetToIntro = useCallback(() => {
    stopTimer();
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setLastAttempt(null);
    setError(null);
    setPhase('intro');
  }, [stopTimer]);

  // ── Retorno ───────────────────────────────

  return {
    // Estado
    phase,
    questions,
    currentIndex,
    answers,
    timeRemaining,
    config,
    approval,
    lastAttempt,
    attemptHistory,
    currentAttemptNumber,
    isLoading,
    error,
    isTimerRunning,
    currentBlock,
    currentMaxGrade,
    startsLowerBlock,
    isBlocked,
    bestGrade: quizStatus.bestGrade,
    gradeCaps: config.gradeCaps,
    getGradePerformance: getPerformanceStatus,

    // Acciones
    startQuiz,
    selectAnswer,
    goToNext,
    goToPrevious,
    goToQuestion,
    submitQuiz,
    resetToIntro,
  };
}
