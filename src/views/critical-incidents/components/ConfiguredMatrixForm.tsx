import type { WorkshopStudentConfiguration } from '../../../models/workshopStructure';

interface ConfiguredMatrixFormProps {
  configuration: WorkshopStudentConfiguration;
  answers: Record<string, string>;
  onChange: (rowId: string, value: string) => void;
}

export default function ConfiguredMatrixForm({
  configuration,
  answers,
  onChange,
}: ConfiguredMatrixFormProps) {
  const rows = configuration.formSchema.matrixRows;

  if (rows.length === 0) {
    return (
      <p role="status" className="rounded-xl border border-border bg-surface p-5 text-texto/70">
        No hay filas de análisis configuradas para este taller. Contacta a tu docente.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[38rem] border-collapse text-left">
        <thead>
          <tr>
            <th scope="col" className="border-b border-border bg-bg p-3 font-medium text-texto">
              Dimensión de análisis
            </th>
            <th scope="col" className="border-b border-border bg-bg p-3 font-medium text-texto">
              Tu reflexión
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const answerId = `matrix-${index}`;
            const inputId = `matrix-answer-${index}`;
            return (
              <tr key={answerId}>
                <th scope="row" className="w-1/3 border-b border-border p-3 align-top font-medium text-texto">
                  {row}
                </th>
                <td className="border-b border-border p-3">
                  <label className="sr-only" htmlFor={inputId}>
                    Respuesta: {row}
                  </label>
                  <textarea
                    id={inputId}
                    rows={4}
                    value={answers[answerId] ?? ''}
                    onChange={(event) => onChange(answerId, event.target.value)}
                    placeholder="Escribe tu reflexión sin incluir nombres reales."
                    className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-base leading-relaxed text-texto focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
