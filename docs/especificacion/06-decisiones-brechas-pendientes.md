# 06. Decisiones, brechas y pendientes

Registro vivo de lo acordado, de lo que el código aún no cumple y de lo que falta definir.

## 1. Decisiones

| ID | Decisión | Fuente | Efecto |
|---|---|---|---|
| DEC-01 | El cuestionario del marco teórico se aprueba con **8 de 10** aciertos (80%). | Lab 5 (RF-04); confirmado por el equipo | Reemplaza el 100% de `AI_GUIDELINES.md` y el 7/10 provisional del código. RN-05. |
| DEC-02 | Los intentos del cuestionario son **ilimitados**; desde el intento 4 la nota máxima baja por bloques (4 a 6 → 5,0; 7 a 9 → 4,0). La escala **aplica solo al cuestionario**, no a los talleres. | Lab 5; aclarado por el equipo | RN-06. Los criterios de Lab 5 que aplican bloques a talleres (HU-FE-06 CA-06.1, HU-BE-06 CA-06.1, RF-06 "9 intentos") quedan sin efecto y se reemplazan por DEC-11 (3 intentos por taller). |
| DEC-03 | El dominio institucional es únicamente **`@ucen.cl`**. | Equipo | Se descartan `@central.cl` y `@ucentral.cl`. RN-01. |
| DEC-04 | El repositorio de innovaciones **queda dentro del alcance** de la versión 1.0 y ya está implementado. | Equipo | RF-07 es parte del MVP. Se corrige la contradicción del Lab 5. |
| DEC-05 | El panel de la IA se llama **"El Impulso"**. | Equipo | El texto "Orientaciones para profundizar la reflexión profesional" del Lab 5 queda como descripción funcional, no como nombre de la interfaz. |
| DEC-06 | Los casos de uso describen **el sistema implementado en el repositorio**. Las capacidades de backend del laboratorio se tratan como evolución prevista. | Equipo | Alcance de esta especificación. |
| DEC-07 | RF-NEW-01 (eliminación definitiva), RF-NEW-02 (nota escalonada) y RF-NEW-03 (referencias APA/DOI) son requisitos vigentes, aún no cubiertos por el código. | Equipo | Pasan a RF-01, RF-04 y RN-03, RN-06, RN-07. Brechas GAP-03, GAP-04, GAP-09. |
| DEC-08 | RNF-06 a RNF-08 se mantienen como están definidos en la revisión del Lab 5. | Equipo | Documento 04. Ver PEND-08. |
| DEC-09 | La estructura de talleres configurable (HU-09) es un **acuerdo del equipo**, posterior a la validación con la stakeholder. | Equipo | Se registra como RF-P02. |
| DEC-10 | El Laboratorio 5 prevalece sobre documentos anteriores y sobre `AI_GUIDELINES.md` cuando se contradicen. | Equipo | Orden de precedencia del README de esta carpeta. |
| DEC-11 | Cada taller tiene **3 intentos de revisión** por defecto y la profesora guía puede modificarlos (hoy, de 1 a 3). | Equipo (Christian), 22-oct-2026 | Cierra PEND-02. RN-11, RF-06. Desbloquea parcialmente CU-13 y CU-15. |
| DEC-12 | En los talleres la IA conoce la pauta y **sugiere** una nota; la nota final la pone el profesor guía. Para pasar al taller siguiente la nota debe ser **7,0**. Al agotar los intentos queda como nota la **más alta obtenida** (por ahora). | Equipo (Christian), 23-oct-2026 | Cierra PEND-07. RN-14, RN-16. Cuestionario: PEND-01 sigue abierto. |
| DEC-13 | El **plazo de cada taller lo configura el profesor guía** y el taller **se cierra solo** al vencer. | Equipo (Christian), 23-oct-2026 | Cierra PEND-06. RN-15, CU-13, CU-15. El cierre automático no está implementado (GAP-05). |
| DEC-14 | La publicación de una innovación la hace el **profesor guía**, y el sistema le muestra un **aviso para confirmar**. | Equipo (Christian), 23-oct-2026 | Cierra PEND-03. RN-18, CU-18. |

## 2. Brechas entre la línea base y el código

Estado revisado sobre `origin/main`.

| ID | Brecha | Requisito | Situación actual | Objetivo |
|---|---|---|---|---|
| GAP-01 | Umbral de aprobación del cuestionario | RF-04 | `passingScore: 7` | 8 de 10 |
| GAP-02 | Intentos del cuestionario | RF-04 | `maxAttempts: 3` | Ilimitados, con tope de nota por bloque |
| GAP-03 | Eliminación definitiva de usuarios | RF-01 | Solo revocación (`active`/`revoked`) | Eliminar con doble confirmación |
| GAP-04 | Referencias APA con DOI en el marco teórico | RF-04 | No existen | Lista de referencias con hipervínculos |
| GAP-05 | Cierre automático de plazos | RF-06 | Sin tarea programada ni nota 1,0 automática | Cierre, nota 1,0 y apertura del siguiente taller |
| GAP-06 | Servicio de anonimización | RF-05 | Detección en el cliente vía OpenRouter | Servicio NER con respuesta ≤ 2 s y rechazo 422 |
| GAP-07 | Motor de IA | RF-02 | `impulseGenerator` simulado, sin red | Modelo real con rúbrica del taller, salida estructurada y ≤ 10 s |
| GAP-08 | Infraestructura de backend | RNF-02, RNF-06, RNF-07 | Sin API propia, bitácora inmutable ni respaldos programados | Auditoría, disponibilidad y respaldos |
| GAP-09 | Nota escalonada del cuestionario | RF-04 | El cuestionario no calcula nota con tope | Nota con tope por bloque |
| GAP-10 | Documentación existente desactualizada | — | `AI_GUIDELINES.md` §11 y `HU04_GUIA.md` mantienen 100% / 3 intentos / "¿2 o 3?" | Alinear con DEC-01 y DEC-02 |
| GAP-11 | Estructura visible de talleres | RF-03 | Por verificar: títulos oficiales, bloques Objetivo/Actividad/Producto y panel a la derecha | Cumplir RN-09 |

## 3. Pendientes de definición

| ID | Pendiente | Impacto | A quién consultar |
|---|---|---|---|
| PEND-01 | Cómo se calcula la nota del cuestionario a partir de los aciertos y cuál es el tope desde el intento 10 en adelante. | RN-06, casos de uso del marco teórico | Equipo / stakeholder |
| ~~PEND-02~~ | ~~Número de intentos de revisión por taller.~~ **Resuelto por DEC-11**: 3 por defecto, modificables por la profesora guía. | RN-11, RN-14 | — |
| ~~PEND-03~~ | ~~Publicación en el repositorio: Lab 5 dice automática con nota ≥ 6,0; el código exige revisión, anonimización y publicación del docente. ¿Cuál rige?~~ **Resuelto por DEC-14**: la publica el profesor guía con aviso de confirmación. | RN-18, casos del repositorio | Stakeholder |
| PEND-04 | Lineamientos legales sobre dónde y cuánto tiempo se almacenan los relatos (Ley 21.719). Duda de Lab 2 sin respuesta. | RNF-02, RNF-07 | Stakeholder / Universidad |
| PEND-05 | Cómo se carga la whitelist cada semestre: archivo masivo manual o enrolamiento automático. | RF-01 | Stakeholder |
| ~~PEND-06~~ | ~~Plazo semanal: ¿día y hora fijos para todo el curso o configurables por taller y por docente (como hoy)?~~ **Resuelto por DEC-13**: lo configura el profesor guía y el taller se cierra solo. | RN-15 | Stakeholder |
| ~~PEND-07~~ | ~~Qué ocurre con el avance de un estudiante que agota los intentos de un taller sin cumplir la rúbrica: qué nota queda registrada y quién la define.~~ **Resuelto por DEC-12**: queda la nota más alta obtenida. | RN-14, RN-16 | Stakeholder |
| PEND-08 | Inclusión formal de RNF-06 a RNF-08 en la tabla consolidada de la línea base. | Documento 04 | Equipo |
| PEND-09 | Correspondencia entre las fases del método R5 y los pasos del asistente, incluida la instrucción de redacción de la fase "Comprende". | Glosario, RN-09 | Stakeholder |
| PEND-10 | Validar con la stakeholder RF-P01 (seguimiento docente) y RF-P02 (estructura de talleres) para incorporarlos a la línea base. | Documento 04 | Equipo / stakeholder |

## 4. Discrepancias menores de redacción detectadas

- Lab 3 y Lab 4 usan `@central.cl`; Lab 3 también `@ucentral.cl`. Resuelto por DEC-03.
- Lab 2 enumera 7 RF y Lab 5 agrega RF-08 (autenticación); la numeración vigente es la de Lab 5.
- La necesidad de monitoreo semanal (ID-09 del Lab 2) no tuvo RF propio; se formaliza como RF-P01.
