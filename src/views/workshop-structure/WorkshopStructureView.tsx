import { useState } from 'react';
import { Eye, RotateCcw, Save } from 'lucide-react';

import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {
  WORKSHOP_IDS,
  type WorkshopId,
} from '../../models/workshopStructure';
import FormSchemaEditor from './components/FormSchemaEditor';
import SectionSettings from './components/SectionSettings';
import WorkshopStructurePreview from './components/WorkshopStructurePreview';
import { useWorkshopStructure } from './hooks/useWorkshopStructure';

const WORKSHOP_LABELS: Record<WorkshopId, string> = {
  'workshop-1': 'Taller 1',
  'workshop-2': 'Taller 2',
  'workshop-3': 'Taller 3',
  'workshop-4': 'Taller 4',
};

export default function WorkshopStructureView() {
  const [workshopId, setWorkshopId] = useState<WorkshopId>(WORKSHOP_IDS[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const structure = useWorkshopStructure(workshopId);
  const isBusy = structure.isLoading || structure.isSaving || structure.isResetting;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold text-texto md:text-3xl">
          Estructura de talleres
        </h1>
        <p className="max-w-3xl text-texto/70">
          Personaliza por separado las secciones, el orden y el formato de entrada de cada taller.
          La configuración se guarda de forma independiente para cada taller y puede revisarse en
          la vista previa antes de guardar.
        </p>
      </header>

      <nav aria-label="Seleccionar taller" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {WORKSHOP_IDS.map((id) => (
          <Button
            key={id}
            variant={workshopId === id ? 'primary' : 'outline'}
            fullWidth
            aria-pressed={workshopId === id}
            onClick={() => setWorkshopId(id)}
          >
            {WORKSHOP_LABELS[id]}
          </Button>
        ))}
      </nav>

      {structure.notice && (
        <p role="status" className="rounded-lg border border-secondary/30 bg-secondary/5 p-4 text-texto">
          {structure.notice}
        </p>
      )}

      {structure.error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-texto">{structure.error}</p>
          <Button variant="outline" onClick={() => void structure.load()}>
            Reintentar
          </Button>
        </div>
      )}

      {structure.isLoading || !structure.draft ? (
        <div role="status" aria-busy="true" aria-label="Cargando configuración del taller" className="space-y-4">
          <div className="h-28 animate-pulse rounded-xl bg-border/50" />
          <div className="h-64 animate-pulse rounded-xl bg-border/50" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-texto/70">
              Configuración individual de <strong>{WORKSHOP_LABELS[workshopId]}</strong>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye size={17} />}
                onClick={() => setIsPreviewOpen(true)}
              >
                Vista previa
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RotateCcw size={17} />}
                disabled={isBusy}
                onClick={() => setIsResetOpen(true)}
              >
                Restablecer plantilla
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <SectionSettings
              sections={structure.draft.sections}
              disabled={isBusy}
              onToggle={structure.setSectionEnabled}
              onMove={structure.moveSection}
            />
            <FormSchemaEditor
              evaluationType={structure.draft.evaluationType}
              formSchema={structure.draft.formSchema}
              disabled={isBusy}
              onEvaluationTypeChange={structure.setEvaluationType}
              onGuidingQuestionChange={structure.setGuidingQuestion}
              onAddGuidingQuestion={structure.addGuidingQuestion}
              onRemoveGuidingQuestion={structure.removeGuidingQuestion}
              onQuestionChange={structure.updateQuestion}
              onAddQuestion={structure.addQuestion}
              onAddOpenEndedQuestion={structure.addOpenEndedQuestion}
              onImportQuestions={structure.importQuestions}
              onRemoveQuestion={structure.removeQuestion}
            />
          </div>

          <div className="sticky bottom-3 z-10 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between">
            <p className="mb-3 text-sm text-texto/70 sm:mb-0">
              {structure.isDirty ? 'Hay cambios sin guardar.' : 'No hay cambios pendientes.'}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {structure.isDirty && (
                <Button variant="outline" disabled={isBusy} onClick={structure.discard}>
                  Descartar cambios
                </Button>
              )}
              <Button
                icon={<Save size={17} />}
                isLoading={structure.isSaving}
                disabled={!structure.isDirty || structure.isLoading || structure.isResetting}
                onClick={() => void structure.save()}
              >
                Guardar cambios
              </Button>
            </div>
          </div>
        </>
      )}

      {structure.draft && (
        <WorkshopStructurePreview
          isOpen={isPreviewOpen}
          workshopId={workshopId}
          configuration={structure.draft}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}

      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Restablecer plantilla"
        footer={
          <>
            <Button variant="outline" disabled={structure.isResetting} onClick={() => setIsResetOpen(false)}>
              Cancelar
            </Button>
            <Button
              isLoading={structure.isResetting}
              onClick={() => {
                void structure.resetDefaults().then(() => setIsResetOpen(false));
              }}
            >
              Restablecer
            </Button>
          </>
        }
      >
        <p className="text-texto/80">
          Se eliminará la configuración guardada de {WORKSHOP_LABELS[workshopId]} y se restaurará
          su plantilla predeterminada. Los otros talleres no cambiarán.
        </p>
      </Modal>
    </div>
  );
}
