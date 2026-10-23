# 07. Trazabilidad

Vincula cada necesidad con su requisito, historia, pantalla, módulo de código y reglas. La columna de casos de uso se completará al redactarlos.

## 1. Necesidad → requisito → implementación

| Necesidad | Descripción | RF / RNF | HU del repositorio | Ruta | Módulo | Reglas | Caso de uso |
|---|---|---|---|---|---|---|---|
| N-01 | Control de acceso exclusivo a usuarios autorizados | RF-01, RF-08, RNF-02 | HU-01, HU-08 | `/iniciar-sesion`, `/admin/whitelist` | `auth/`, `admin-whitelist/` | RN-01 a RN-04 | Por definir |
| N-02 | Retroalimentación formativa autónoma que alivie la carga docente | RF-02, RNF-05 | HU-02 | `/estudiante/talleres/:workshopId`, `/docente/reflexiones` | `critical-incidents/`, `reflections/` | RN-11, RN-12, RN-16 | Por definir |
| N-03 | Guiado paso a paso con fundamento bibliográfico | RF-03 | HU-03, HU-09 | `/estudiante/talleres/:workshopId`, `/docente/estructura-talleres` | `critical-incidents/`, `workshop-structure/` | RN-08 a RN-10 | Por definir |
| N-04 | Verificar el dominio del marco teórico antes de los talleres | RF-04 | HU-04 | `/estudiante/marco-teorico` | `theory-verification/` | RN-05 a RN-08 | Por definir |
| N-05 | Resguardar la privacidad de menores, docentes y colegios | RF-05, RNF-01 | HU-05 | Editor del taller | `critical-incidents/`, `openRouterService` | RN-13, RN-19 | Por definir |
| N-06 | Regular el ritmo de trabajo y los intentos | RF-06 | HU-06 | `/docente/plazos`, cabecera de taller | `work-pacing/` | RN-10, RN-11, RN-14, RN-15 | Por definir |
| N-07 | Biblioteca de innovaciones como referencia entre pares | RF-07 | HU-07 | `/estudiante/innovaciones`, `/docente/innovaciones` | `innovations/` | RN-18 | Por definir |
| ID-09 (Lab 2) | Monitoreo del progreso individual | RF-P01 | Panel docente | `/docente`, `/estudiante` | `teacher-dashboard/`, `student-dashboard/` | RN-16, RN-17, RN-19 | Por definir |
| ID-10 (Lab 2) | Entorno adaptable y neutral | RNF-03, RNF-04 | Transversal | Todas | Layouts | RN-17 | No aplica |

## 2. Equivalencia entre historias de los laboratorios y del repositorio

| RF | HU de laboratorio (front / back) | HU del repositorio |
|---|---|---|
| RF-01 | HU-FE-01 / HU-BE-01 | HU-01 |
| RF-02 | HU-FE-02 / HU-BE-02 | HU-02 |
| RF-03 | HU-FE-03 / HU-BE-03 | HU-03, HU-09 |
| RF-04 | HU-FE-04 / HU-BE-04 | HU-04 |
| RF-05 | HU-FE-05 / HU-BE-05 | HU-05 |
| RF-06 | HU-FE-06 / HU-BE-06 | HU-06 |
| RF-07 | HU-FE-07 / HU-BE-07 | HU-07 |
| RF-08 | (en HU-FE-01) | HU-08 |

Las historias de back-end de los laboratorios describen el sistema objetivo (API, NER, cron). En el repositorio esa lógica vive en los servicios del frontend y en Firestore (ver GAP-05 a GAP-08).

## 3. Cobertura por actor

| Actor | Requisitos que lo involucran |
|---|---|
| Estudiante | RF-02, RF-03, RF-04, RF-05, RF-06, RF-07, RF-08 |
| Profesor guía | RF-02, RF-03 (estructura), RF-06, RF-07, RF-P01, RF-P02 |
| Administrador | RF-01, RF-08 |
| OpenRouter (API de IA) | RF-02, RF-05 |

## 4. Fuentes por documento

| Documento | Aporta |
|---|---|
| Laboratorio 2 | Problemática, actores, necesidades, RF/RNF iniciales, alcance y MVP v1. |
| Laboratorio 3 | Historias de usuario, flujo principal y alternativos, un caso de uso, prototipo de baja fidelidad. |
| Laboratorio 4 | Hipótesis, guion de validación y escenarios de prueba. |
| Laboratorio 5 | Resultados de la validación, requisitos refinados, RNF objetivos, matriz v1.1, alcance y línea base v1.0. |
