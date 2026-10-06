/**
 * @module models
 *
 * Punto de reexportación de algunos modelos compartidos, para poder
 * importarlos desde una sola ruta (`../models`).
 *
 * Los demás modelos (whitelist, workPacing, reflection, teacherDashboard)
 * se importan directamente desde su propio archivo.
 */
export * from './theoryQuiz';
export * from './criticalIncident';
export * from './sensitiveData';
