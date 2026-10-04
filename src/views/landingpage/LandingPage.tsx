import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Eye,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const cycleSteps = [
  {
    number: '01',
    title: 'Comprende',
    description:
      'Revisa conceptos de reflexión profesional y fortalece tus bases antes de comenzar.',
    icon: <BookOpen size={22} aria-hidden="true" />,
  },
  {
    number: '02',
    title: 'Analiza',
    description:
      'Describe un incidente de tu práctica con una guía paso a paso y referencias teóricas.',
    icon: <Eye size={22} aria-hidden="true" />,
  },
  {
    number: '03',
    title: 'Reflexiona',
    description:
      'Examina el contexto, los actores y la relevancia pedagógica de lo ocurrido.',
    icon: <Sparkles size={22} aria-hidden="true" />,
  },
  {
    number: '04',
    title: 'Propón',
    description:
      'Transforma el análisis en una oportunidad de mejora e innovación pedagógica.',
    icon: <Lightbulb size={22} aria-hidden="true" />,
  },
]

const projectPrinciples = [
  {
    title: 'Reflexión con fundamento',
    description:
      'Un recorrido estructurado conecta la experiencia en el aula con marcos teóricos y preguntas que profundizan el análisis.',
    icon: <BookOpen size={22} aria-hidden="true" />,
  },
  {
    title: 'Acompañamiento que orienta',
    description:
      'La inteligencia artificial se concibe como apoyo formativo: entrega orientaciones para pensar, sin escribir la reflexión por ti.',
    icon: <Sparkles size={22} aria-hidden="true" />,
  },
  {
    title: 'Privacidad como prioridad',
    description:
      'El proyecto promueve la anonimización de personas y establecimientos para resguardar la confidencialidad de las experiencias.',
    icon: <ShieldCheck size={22} aria-hidden="true" />,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-bg text-texto">
      <header className="border-b border-border bg-surface">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
        >
          <Link
            to="/"
            aria-label="ReflexIA, página de inicio"
            className="rounded-md font-heading text-2xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Reflex<span className="text-accent-ia">IA</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <a
              href="#proyecto"
              className="hidden rounded-md px-2 py-2 text-base font-medium text-texto/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
            >
              El proyecto
            </a>
            <Link
              to="/iniciar-sesion"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:px-5"
            >
              Explorar plataforma
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-36 -z-10 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:py-28 lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-sm font-semibold text-primary">
                <UsersRound size={17} aria-hidden="true" />
                Práctica profesional docente
              </div>
              <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-texto sm:text-5xl lg:text-6xl">
                De la experiencia en el aula a una{' '}
                <span className="text-primary">reflexión que transforma.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-texto/75 sm:text-lg">
                ReflexIA es un proyecto de plataforma para acompañar a estudiantes
                de pedagogía en el análisis de incidentes críticos y la creación
                de propuestas de innovación, conectando la práctica con
                fundamentos pedagógicos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/iniciar-sesion"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Conocer el recorrido
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a
                  href="#proyecto"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Descubrir ReflexIA
                </a>
              </div>
              <p className="mt-4 text-sm text-texto/60">
                Prototipo en desarrollo · La experiencia disponible puede
                incluir funcionalidades de demostración.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div
                aria-hidden="true"
                className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-secondary/20 via-primary/5 to-accent-ia/15 blur-sm"
              />
              <div className="relative rounded-3xl border border-border bg-surface p-5 shadow-lg sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
                      Tu ciclo reflexivo
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold text-texto">
                      Aprender de la práctica
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-accent-ia/10 p-3 text-accent-ia">
                    <ClipboardList size={26} aria-hidden="true" />
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {cycleSteps.map((step, index) => (
                    <div
                      key={step.number}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-bg/70 p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {step.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-wider text-secondary">
                            {step.number}
                          </span>
                          <h3 className="font-heading text-base font-semibold text-texto">
                            {step.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-texto/65">
                          {step.description}
                        </p>
                      </div>
                      {index < cycleSteps.length - 1 && (
                        <CheckCircle2
                          size={18}
                          className="hidden shrink-0 text-accent-ia sm:block"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proyecto" className="scroll-mt-8 border-y border-border bg-surface py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-wider text-secondary">
                El proyecto
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-texto sm:text-4xl">
                Una guía para mirar la práctica con nuevos ojos
              </h2>
              <p className="mt-5 text-base leading-relaxed text-texto/70 sm:text-lg">
                ReflexIA organiza el trabajo reflexivo en etapas claras. Su
                propósito es apoyar el aprendizaje profesional y facilitar un
                diálogo más fundamentado sobre lo que ocurre en el aula.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {projectPrinciples.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-2xl border border-border bg-bg/60 p-6 sm:p-7"
                >
                  <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    {principle.icon}
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold text-texto">
                    {principle.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-texto/70">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-secondary">
                Comunidad educativa
              </p>
              <h2 className="mt-3 font-heading text-3xl font-bold text-texto sm:text-4xl">
                Un proceso compartido, con roles distintos
              </h2>
              <p className="mt-4 text-base leading-relaxed text-texto/70">
                La plataforma se proyecta para apoyar tanto el trabajo
                individual del estudiante como el acompañamiento y seguimiento
                del profesor guía.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="rounded-xl bg-secondary/10 p-3 text-primary w-fit">
                  <BookOpen size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-texto">
                  Para estudiantes
                </h3>
                <p className="mt-2 text-base leading-relaxed text-texto/70">
                  Un recorrido para revisar teoría, analizar experiencias,
                  guardar borradores y desarrollar ideas de mejora pedagógica.
                </p>
                <Link
                  to="/iniciar-sesion"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:text-accent-ia focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Ver vista de estudiante
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>

              <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="rounded-xl bg-accent-ia/10 p-3 text-accent-ia w-fit">
                  <UsersRound size={22} aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-texto">
                  Para profesores guía
                </h3>
                <p className="mt-2 text-base leading-relaxed text-texto/70">
                  Un espacio proyectado para acompañar avances, revisar
                  reflexiones y orientar el trabajo de práctica profesional.
                </p>
                <Link
                  to="/docente"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:text-accent-ia focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Ver vista docente
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-primary py-14 text-white sm:py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-heading text-2xl font-bold sm:text-3xl">
                Cada experiencia puede abrir una nueva posibilidad.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-white/80">
                Explora el prototipo y conoce cómo se organiza el ciclo de
                reflexión profesional.
              </p>
            </div>
            <Link
              to="/iniciar-sesion"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-surface px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Explorar el prototipo
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-texto/60 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="font-heading font-bold text-primary">
            Reflex<span className="text-accent-ia">IA</span>
          </span>
          <p>
            Proyecto de apoyo a la reflexión en la práctica profesional docente.
          </p>
        </div>
      </footer>
    </div>
  )
}
