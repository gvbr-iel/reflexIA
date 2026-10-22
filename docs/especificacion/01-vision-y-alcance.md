# 01. Visión y alcance

## 1. Contexto y problema

En la formación docente, los estudiantes en práctica profesional enfrentan **incidentes críticos** que interrumpen su planificación pedagógica. La evaluación docente nacional (Ley 20.903) mide la reflexión sobre la práctica, y sus indicadores son históricamente los más descendidos. La reflexión no se enseña de forma estructurada y suele reducirse a opinión intuitiva sin sustento teórico.

Hoy el acompañamiento y la evaluación son manuales: el profesor guía revisa carpetas y relatos uno por uno. Esto genera:

- sobrecarga docente en la revisión semanal;
- relatos superficiales, sin contraste con la literatura;
- riesgo de exponer nombres de menores, docentes y colegios.

## 2. Propuesta de solución

ReflexIA es una plataforma web independiente que guía el ciclo reflexivo del estudiante mediante talleres estructurados según la metodología R5 de Ángeles Domingo. Un asistente de IA entrega orientaciones sin redactar ni corregir el texto del alumno, y un filtro de confidencialidad impide procesar datos identificables. El profesor guía supervisa el avance, revisa la retroalimentación y asigna la nota oficial.

## 3. Objetivos

| ID | Objetivo |
|---|---|
| OBJ-1 | Estructurar la reflexión del estudiante sobre incidentes críticos con fundamento bibliográfico. |
| OBJ-2 | Reducir la carga de revisión manual del profesor guía mediante retroalimentación formativa automatizada. |
| OBJ-3 | Resguardar la privacidad de menores, docentes y centros escolares (Ley 21.719). |
| OBJ-4 | Regular el ritmo de trabajo con plazos e intentos, evitando procesos reflexivos infinitos. |
| OBJ-5 | Formar un repositorio de innovaciones destacadas como referencia entre pares. |

## 4. Alcance de la versión 1.0

### Incluido

| Módulo | Requisito |
|---|---|
| Autenticación y gestión de la whitelist (alta, carga masiva, revocación y eliminación definitiva) | RF-01, RF-08 |
| Evaluación diagnóstica del marco teórico (10 preguntas, aprobación con 8 de 10) | RF-04 |
| Asistente paso a paso de los 4 talleres | RF-03 |
| Retroalimentación orientadora de la IA ("El Impulso") | RF-02 |
| Filtro de confidencialidad y anonimización | RF-05 |
| Regulación de plazos e intentos | RF-06 |
| Repositorio de innovaciones (nota ≥ 6,0) | RF-07 |
| Panel de seguimiento docente y revisión de reflexiones | RF-02, RF-P01 |
| Diseño adaptable desde 360 px | RNF-03 |

### Excluido de la versión 1.0

| Elemento | Motivo |
|---|---|
| Integración con el LMS institucional (Canvas/Moodle) | La cliente pidió un sistema autónomo gestionado por whitelist. |
| Usuarios externos o de otras carreras | El alcance es la asignatura de práctica profesional de pedagogía. |
| Calificación sumativa automática por IA | La IA es formativa; la nota oficial la asigna el profesor guía. |
| Carga o transcripción de audio y video de clases | Restricciones de privacidad de menores (Ley 21.719). |

### Evolución prevista (post-1.0)

- Coevaluación y socialización entre pares.
- Escalabilidad del motor de IA a otras carreras e instituciones.
- Exportador de portafolio docente alineado con la Ley 20.903.
- Backend propio con servicio NER, tareas programadas y auditoría inmutable (ver GAP-06 a GAP-08 en [06](./06-decisiones-brechas-pendientes.md)).

## 5. Sistema de referencia

Esta especificación describe **el sistema tal como está implementado en el repositorio**: aplicación React + TypeScript con Firebase Authentication y Cloud Firestore, persistencia local por usuario para borradores e intentos, y una IA de impulsos simulada. Las diferencias con la línea base se listan como brechas en el documento 06.

## 6. Restricciones del proyecto

- Acceso solo con correo `@ucen.cl` presente en la whitelist.
- No se solicita ni almacena RUT.
- Sin video ni audio de salas de clases.
- La IA nunca redacta ni corrige el texto del estudiante.
- Interfaz en español, con paleta de tonos fríos y sin estética deportiva.
- Trabajo estudiantil estrictamente individual.
