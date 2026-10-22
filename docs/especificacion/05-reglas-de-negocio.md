# 05. Reglas de negocio

Reglas que los casos de uso referenciarán por código. Cada regla indica su fuente y si el código vigente la cumple.

Estado: ✅ Cumple · 🟡 Cumple parcialmente · ❌ No implementada · ❔ Por verificar.

## Acceso y usuarios

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-01 | Solo pueden ingresar usuarios con correo `@ucen.cl` y estado activo en la whitelist. Cualquier otro acceso se deniega. | Lab 5 (RF-08, RNF-02) | ✅ |
| RN-02 | Existen tres roles: `student`, `teacher` y `admin`. Cada uno accede solo a su área, y el sistema redirige tras iniciar sesión. | Lab 5, HU-08 | ✅ |
| RN-03 | Un acceso se puede **revocar** (reversible) o el usuario se puede **eliminar definitivamente**. La eliminación exige una confirmación en dos pasos y se reserva a estudiantes que se retiran de la asignatura. | Lab 5 (RF-NEW-01) | 🟡 Solo revocación (GAP-03) |
| RN-04 | Cada alta, revocación o eliminación de la whitelist deja un registro de auditoría inmutable con administrador, acción, correo afectado, fecha e IP. | Lab 5 (HU-BE-01) | ❔ (GAP-08) |

## Marco teórico

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-05 | La evaluación diagnóstica presenta 10 preguntas aleatorias de un banco de 30, con temporizador. Se aprueba con **al menos 8 aciertos (80%)**. Al aprobar se desbloquea el Taller 1. | Lab 5 (RF-04), DEC-01 | 🟡 Hoy 7 de 10 (GAP-01) |
| RN-06 | Los intentos del cuestionario son **ilimitados**. La nota máxima baja por bloques: intentos 1 a 3 → 7,0; 4 a 6 → 5,0; 7 a 9 → 4,0. Esta escala aplica **solo al cuestionario**. | Lab 5, DEC-02 | ❌ Hoy máximo 3 intentos (GAP-02, GAP-09) |
| RN-07 | El contenido teórico se entrega como lista de referencias en formato APA con enlaces DOI, que el estudiante lee de forma autónoma antes del test. | Lab 5 (RF-NEW-03) | ❌ (GAP-04) |

## Talleres

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-08 | El desbloqueo es lineal: el Taller 1 exige aprobar el marco teórico, y cada taller exige cumplir la condición de avance del anterior (RN-14). | AI_GUIDELINES §6, HU-03 | ✅ |
| RN-09 | Hay cuatro talleres con los títulos oficiales. Cada uno muestra Objetivo, Actividad y Producto esperado. El relato tiene cuatro secciones: Contexto, Descripción del hecho, Actores e influencia y Relevancia pedagógica. El panel de referencias va a la derecha. | Lab 5 (RF-03) | ❔ (GAP-11) |
| RN-10 | **Guardar un borrador nunca descuenta intentos** de revisión. | HU-03, Lab 3 | ✅ |
| RN-11 | Cada solicitud de impulso a la IA descuenta 1 intento del taller. Al llegar a cero se bloquea la edición y la entrega se registra con su estado actual. El límite por taller es 3 por defecto y lo puede modificar el profesor guía (DEC-11). | HU-02, HU-06, DEC-11 | ✅ |
| RN-12 | La IA evalúa según la rúbrica del taller, responde en ≤ 10 s y **nunca redacta ni corrige** el texto del estudiante: solo señala criterios omitidos mediante orientaciones. | Lab 5 (RF-02) | 🟡 IA simulada (GAP-07) |
| RN-13 | Si el relato contiene nombres de personas, colegios o ubicaciones sin anonimizar, se resaltan, se muestra la norma y se deshabilita el envío a la IA hasta corregirlos. | Lab 5 (RF-05) | 🟡 (GAP-06) |
| RN-14 | Se avanza al taller siguiente al obtener el 100% de cumplimiento de la rúbrica (nota 7,0) o al agotar los intentos del taller. | Lab 5 (RF-06) | ❔ |
| RN-15 | Al vencer el plazo sin entrega, el taller se cierra con nota 1,0 (gris) y se abre el siguiente. | Lab 5 (RF-06) | ❌ (GAP-05) |

## Evaluación y visualización

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-16 | La IA es formativa. La **nota oficial** (1,0 a 7,0) la asigna el profesor guía al validar la reflexión. Solo existe como validada si está guardada en Firestore, y la propuesta original de la IA no se modifica. | Lab 5, HU-02 | ✅ |
| RN-17 | Colores de desempeño: gris para no entregado (1,0), rojo para reprobado (menor que 4,0), azul para 4,0 a 4,9 y verde esmeralda para 5,0 a 7,0. El rojo se usa solo con este sentido. | Lab 5 (RNF-04), AI_GUIDELINES §4 | ✅ |
| RN-18 | El repositorio muestra solo propuestas con nota ≥ 6,0, anonimizadas, para lectura de estudiantes y profesores. | Lab 5 (RF-07) | ✅ (ver PEND-03) |

## Privacidad y datos

| ID | Regla | Fuente | Estado |
|---|---|---|---|
| RN-19 | No se solicita ni almacena RUT. Al docente solo se le informan números y estados del avance, nunca el texto de los relatos. | AI_GUIDELINES §8, `CLAUDE.md` | ✅ |
| RN-20 | Los borradores, intentos y aprobaciones se guardan en el almacenamiento local particionado por UID; el resumen de progreso, las notas y la whitelist, en Firestore. | `CLAUDE.md` | ✅ |
