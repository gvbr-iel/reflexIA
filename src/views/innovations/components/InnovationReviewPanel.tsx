import { CheckCircle2, Eye, ShieldCheck } from 'lucide-react';

import Button from '../../../components/Button';
import { WORKSHOP_TITLES } from '../models/innovation';
import { useInnovationReview } from '../hooks/useInnovationReview';

const fieldClassName =
  'mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-base text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function InnovationReviewPanel() {
  const review = useInnovationReview();

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-1 shrink-0 text-accent-ia" size={22} aria-hidden="true" />
        <div>
          <h2 className="font-heading text-xl font-semibold text-texto">
            Revisar trabajos para la biblioteca
          </h2>
          <p className="mt-1 text-base leading-relaxed text-texto/70">
            Solo aparecen aquí entregas reales con nota oficial igual o superior a 6,0.
            Revisa y anonimiza el contenido antes de publicarlo.
          </p>
        </div>
      </div>

      {review.notice && (
        <p role="status" className="rounded-lg border border-accent-ia/30 bg-accent-ia/5 p-3 text-sm text-texto">
          {review.notice}
        </p>
      )}
      {review.error && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-texto">{review.error}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void review.retry()}>
            Reintentar
          </Button>
        </div>
      )}

      {review.isLoading ? (
        <div role="status" className="animate-pulse space-y-3">
          <div className="h-11 rounded-lg bg-border/50" />
          <div className="h-32 rounded-lg bg-border/50" />
        </div>
      ) : review.submissions.length === 0 ? (
        <div className="rounded-xl border border-border bg-bg p-5 text-base leading-relaxed text-texto/70">
          Aún no hay trabajos enviados por estudiantes. Las entregas aparecerán aquí para que puedas
          asignarles su nota oficial y, si alcanzan 6,0 o más, revisar su posible publicación.
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label htmlFor="innovation-submission" className="block text-base font-medium text-texto">
              Entrega pendiente
            </label>
            <select
              id="innovation-submission"
              value={review.selectedSubmissionId}
              onChange={(event) => review.selectSubmission(event.target.value)}
              className={fieldClassName}
            >
              <option value="">Selecciona un trabajo</option>
              {review.submissions.map((submission) => (
                <option key={submission.id} value={submission.id}>
                {WORKSHOP_TITLES[submission.workshopId]} ·{' '}
                {submission.grade === null
                  ? submission.gradeConflict
                    ? `nota previa ${submission.conflictingGrade?.toFixed(1).replace('.', ',')} (no vinculada)`
                    : 'sin nota oficial'
                  : `nota ${submission.grade.toFixed(1).replace('.', ',')}`} ·{' '}
                {submission.studentEmail} · {new Date(submission.submittedAt).toLocaleDateString('es-CL')}
              </option>
              ))}
            </select>
          </div>

          {review.selectedSubmission && (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/5 p-3 text-sm text-primary">
                <Eye size={17} aria-hidden="true" />
                <span>
                  Vista privada para revisión docente · {WORKSHOP_TITLES[review.selectedSubmission.workshopId]} ·{' '}
                  {review.selectedSubmission.grade === null
                    ? 'pendiente de evaluación'
                    : `nota oficial ${review.selectedSubmission.grade.toFixed(1).replace('.', ',')}`}
                </span>
              </div>

              {review.selectedSubmission.gradeConflict && (
                <p role="alert" className="rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-texto/75">
                  Ya existe una nota oficial para este estudiante y taller, pero proviene de otra
                  evaluación y no está vinculada a este envío. No se reutilizará ni sobrescribirá esa
                  nota; resuelve la evaluación existente antes de continuar.
                </p>
              )}

              {review.selectedSubmission.grade === null && !review.selectedSubmission.gradeConflict && (
                <div className="space-y-3 rounded-lg border border-border bg-bg p-4">
                  <label htmlFor="innovation-official-grade" className="block text-base font-medium text-texto">
                    Nota oficial del taller (escala de 1,0 a 7,0)
                    <input
                      id="innovation-official-grade"
                      type="number"
                      min="1"
                      max="7"
                      step="0.1"
                      value={review.gradeInput}
                      onChange={(event) => review.setGradeInput(event.target.value)}
                      className={fieldClassName}
                    />
                  </label>
                  <Button
                    type="button"
                    isLoading={review.isSavingGrade}
                    onClick={() => void review.saveGrade()}
                  >
                    Guardar nota oficial
                  </Button>
                </div>
              )}

              {review.selectedSubmission.grade !== null && review.selectedSubmission.grade < 6 && (
                <p className="rounded-lg border border-border bg-bg p-4 text-sm leading-relaxed text-texto/75">
                  La nota oficial es inferior a 6,0. El trabajo no puede publicarse como innovación.
                  Las notas oficiales existentes no se reemplazan desde esta pantalla.
                </p>
              )}

              {review.selectedSubmission.grade !== null && review.selectedSubmission.grade >= 6 && (
                <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-base font-medium text-texto">
                  Título anónimo
                  <input
                    value={review.title}
                    onChange={(event) => review.setTitle(event.target.value)}
                    maxLength={120}
                    className={fieldClassName}
                    placeholder="Ej.: Secuencia de participación gradual"
                  />
                </label>
                <label className="text-base font-medium text-texto">
                  Tipo de producto
                  <input
                    value={review.productType}
                    onChange={(event) => review.setProductType(event.target.value)}
                    maxLength={100}
                    className={fieldClassName}
                    placeholder="Ej.: propuesta de intervención pedagógica"
                  />
                </label>
              </div>

              <label className="block text-base font-medium text-texto">
                Resumen anonimizado
                <textarea
                  value={review.summary}
                  onChange={(event) => review.setSummary(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  className={fieldClassName}
                  placeholder="Describe brevemente la estrategia, sin identificar personas ni establecimientos."
                />
              </label>
              <label className="block text-base font-medium text-texto">
                Producto anonimizado
                <textarea
                  value={review.work}
                  onChange={(event) => review.setWork(event.target.value)}
                  maxLength={20000}
                  rows={12}
                  className={fieldClassName}
                  aria-describedby="innovation-anonymization-help"
                />
                <span id="innovation-anonymization-help" className="mt-1 block text-sm font-normal text-texto/65">
                  Edita el contenido y elimina nombres, colegios, cursos exactos y cualquier otro dato identificable.
                </span>
              </label>

              <fieldset>
                <legend className="text-base font-medium text-texto">Etiquetas del estilo de innovación</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {review.tagSuggestions.map((tag) => (
                    <Button key={tag} type="button" size="sm" variant="outline" onClick={() => review.addTag(tag)}>
                      {tag}
                    </Button>
                  ))}
                </div>
                <label htmlFor="innovation-tags" className="mt-3 block text-sm font-medium text-texto">
                  Etiquetas separadas por coma
                </label>
                <input
                  id="innovation-tags"
                  value={review.tagText}
                  onChange={(event) => review.setTagText(event.target.value)}
                  className={fieldClassName}
                  placeholder="Ej.: evaluación formativa, inclusión"
                />
              </fieldset>

              <label className="flex items-start gap-3 rounded-lg border border-border bg-bg p-3 text-sm leading-relaxed text-texto">
                <input
                  type="checkbox"
                  checked={review.privacyReviewed}
                  onChange={(event) => review.setPrivacyReviewed(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  Confirmo que revisé el trabajo editado y que la versión que se publicará no identifica
                  al estudiante ni contiene datos personales o sensibles.
                </span>
              </label>
              <Button
                type="button"
                icon={<CheckCircle2 size={18} />}
                isLoading={review.isPublishing}
                disabled={!review.privacyReviewed}
                onClick={() => void review.publish()}
              >
                Publicar trabajo anonimizado
              </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
