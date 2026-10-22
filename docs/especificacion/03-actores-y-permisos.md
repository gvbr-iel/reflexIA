# 03. Actores y permisos

## 1. Actores humanos

| Actor | Rol en el sistema (`role`) | Descripción | Objetivo principal |
|---|---|---|---|
| **Estudiante en práctica** | `student` | Estudiante de pedagogía que cursa su práctica profesional en un establecimiento educacional. Trabaja de forma individual. | Desarrollar su capacidad de reflexión crítica sobre incidentes de aula y proponer una innovación. |
| **Profesor guía** | `teacher` | Docente responsable de la asignatura. Orienta y evalúa el proceso formativo. | Monitorear el avance, validar la retroalimentación de la IA, asignar la nota oficial y definir plazos e intentos. |
| **Administrador** | `admin` | Coordinador (puede ser el profesor guía) que controla el acceso. | Mantener la whitelist de correos autorizados sin depender del equipo técnico. |

## 2. Actores no humanos

| Actor | Descripción | Responsabilidad |
|---|---|---|
| **Sistema de IA ("El Impulso")** | Componente que analiza el relato según la rúbrica del taller. Hoy es una simulación local (`impulseGenerator`); la integración con un modelo real es evolución prevista. | Generar orientaciones sin redactar ni corregir el texto. |
| **Servicio de detección de datos sensibles** | Detección de nombres de personas, colegios y lugares mediante OpenRouter, con rotación de modelos gratuitos. | Bloquear el envío mientras haya datos sin anonimizar. |
| **Firebase Authentication** | Proveedor de identidad. | Autenticar al usuario con correo y contraseña. |
| **Cloud Firestore** | Base de datos documental. | Guardar la whitelist, el progreso, los perfiles, las evaluaciones y la estructura de talleres. |
| **Planificador de cierre de plazos** | Proceso que cierra el taller vencido, asigna 1,0 y abre el siguiente. Previsto en la línea base; no implementado (GAP-05). | Cumplir la regla RN-15. |

No existen usuarios externos en la versión 1.0.

## 3. Matriz de permisos por módulo

Leyenda: **C** consulta · **E** escribe/ejecuta · **A** administra · — sin acceso.

| Módulo | Ruta | Estudiante | Profesor guía | Administrador |
|---|---|---|---|---|
| Inicio de sesión | `/iniciar-sesion` | E | E | E |
| Gestión de la whitelist | `/admin/whitelist` | — | — | A |
| Panel de progreso del estudiante | `/estudiante` | C | — | — |
| Marco teórico y cuestionario | `/estudiante/marco-teorico` | E | — | — |
| Repositorio de talleres | `/estudiante/talleres` | C | — | — |
| Asistente de incidentes críticos y "El Impulso" | `/estudiante/talleres/:workshopId` | E | — | — |
| Biblioteca de innovaciones (estudiante) | `/estudiante/innovaciones` | C | — | — |
| Panel de seguimiento docente | `/docente` | — | C | — |
| Revisión y validación de reflexiones | `/docente/reflexiones` | — | A | — |
| Plazos e intentos | `/docente/plazos` | — | A | — |
| Estructura de talleres | `/docente/estructura-talleres` | — | A | — |
| Biblioteca de innovaciones (docente) | `/docente/innovaciones` | — | A (revisa, anonimiza y publica) | — |

Notas:

- La guarda de rutas (`RequireStudent`/`RequireAuth`) redirige según el rol tras iniciar sesión.
- Las notas oficiales solo las escribe el profesor guía (reglas de `firestore.rules`).
- El profesor guía no ve el texto de los relatos reales en el panel de seguimiento: solo números y estados (RN-19).
