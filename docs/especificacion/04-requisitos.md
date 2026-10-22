# 04. Requisitos

Línea base de requisitos de la versión 1.0, tomada del Laboratorio 5 y ajustada con las decisiones del equipo ([06](./06-decisiones-brechas-pendientes.md)).

**Estados de implementación** (según `origin/main`): ✅ Cubierto · 🟡 Parcial · ❌ No implementado · ❔ Por verificar.

## 1. Requisitos funcionales

### RF-01. Gestión de la whitelist y control de bajas
| | |
|---|---|
| **Actor** | Administrador |
| **Prioridad** | Alta |
| **Necesidad** | N-01 |
| **Descripción** | El sistema deberá permitir al administrador gestionar los correos autorizados mediante altas individuales, carga masiva CSV/Excel, búsqueda por texto, revocación de acceso y eliminación definitiva de usuarios con ventana de doble confirmación, para casos de retiro de la asignatura. |
| **Estado** | 🟡 Alta individual, carga masiva, búsqueda, filtros y revocación están implementadas. Falta la eliminación definitiva con doble confirmación (GAP-03). |
| **Reglas** | RN-01, RN-02, RN-03 |

### RF-02. Retroalimentación orientadora por IA alineada a la rúbrica
| | |
|---|---|
| **Actor** | Estudiante, Profesor guía, Sistema de IA |
| **Prioridad** | Alta |
| **Necesidad** | N-02 |
| **Descripción** | El sistema deberá analizar el relato según la rúbrica del taller y entregar, en un tiempo menor o igual a 10 segundos por intento, orientaciones para profundizar la reflexión profesional ("El Impulso") sobre los criterios omitidos, sin redactar ni corregir el texto. El profesor guía revisa la propuesta de la IA antes de validarla y registra la nota oficial. |
| **Estado** | 🟡 Panel "El Impulso", contador de intentos y panel docente de validación implementados. Los impulsos son una simulación local; no hay modelo real ni rúbrica inyectada (GAP-07). |
| **Reglas** | RN-10, RN-11, RN-12, RN-16 |

### RF-03. Asistente de redacción estandarizado (Step Wizard)
| | |
|---|---|
| **Actor** | Estudiante |
| **Prioridad** | Alta |
| **Necesidad** | N-03 |
| **Descripción** | El sistema deberá estructurar los cuatro talleres (Identificación del incidente, Del aula a la transformación profesional, Confrontación teórica, Transformación e innovación) mostrando Objetivo, Actividad y Producto. Incluirá un formulario guiado por pasos con las cuatro secciones del relato, guardado de borradores y un panel lateral derecho de referencias bibliográficas. |
| **Estado** | 🟡 Asistente por pasos, borradores y panel de referencias implementados; la estructura de talleres es configurable por el docente (RF-P02). Por verificar: títulos oficiales, bloques Objetivo/Actividad/Producto y ubicación del panel a la derecha (GAP-11). |
| **Reglas** | RN-08, RN-09, RN-10 |

### RF-04. Evaluación diagnóstica del marco teórico
| | |
|---|---|
| **Actor** | Estudiante |
| **Prioridad** | Alta |
| **Necesidad** | N-04 |
| **Descripción** | El sistema deberá presentar un cuestionario de 10 preguntas aleatorias de un banco de 30, con temporizador, y exigir al menos 8 respuestas correctas (80%) para desbloquear el Taller 1. Los intentos son ilimitados; a partir del cuarto intento la nota máxima baja por bloques (1 a 3: 7,0; 4 a 6: 5,0; 7 a 9: 4,0). El contenido teórico se entrega como lista de referencias en formato APA con enlaces DOI. |
| **Estado** | 🟡 Cuestionario, temporizador, banco y bloqueo de talleres implementados con aprobación 7/10 y máximo 3 intentos. Faltan el umbral 8/10, los intentos ilimitados, la nota escalonada y las referencias APA/DOI (GAP-01, GAP-02, GAP-04, GAP-09). |
| **Reglas** | RN-05, RN-06, RN-07, RN-08 |

### RF-05. Filtro ético y resguardo de privacidad
| | |
|---|---|
| **Actor** | Estudiante, Sistema |
| **Prioridad** | Alta |
| **Necesidad** | N-05 |
| **Descripción** | El sistema deberá detectar nombres propios de personas, colegios y ubicaciones en el relato, resaltarlos en el editor y bloquear el envío a la IA hasta que se anonimicen, en un tiempo menor o igual a 2 segundos. |
| **Estado** | 🟡 Detección en el frontend mediante OpenRouter con resaltado visual. No existe servicio NER propio ni rechazo HTTP 422 (GAP-06). |
| **Reglas** | RN-13, RN-19 |

### RF-06. Regulación del ritmo, intentos y avance entre talleres
| | |
|---|---|
| **Actor** | Profesor guía, Estudiante |
| **Prioridad** | Media |
| **Necesidad** | N-06 |
| **Descripción** | El sistema deberá permitir al profesor guía definir plazos e intentos de revisión por actividad, y mostrar al estudiante el contador de intentos y el plazo de cierre. El avance al taller siguiente exige obtener el 100% de cumplimiento de la rúbrica (nota 7,0) o agotar los intentos del taller. Al vencer el plazo sin entrega, el taller queda con nota 1,0 y se abre el siguiente. |
| **Estado** | 🟡 Plazos, límite de intentos (1 a 3) y contadores implementados. No hay cierre automático con nota 1,0 ni apertura forzada (GAP-05). Intentos por taller: 3 por defecto, modificables por el profesor guía (DEC-11). |
| **Reglas** | RN-10, RN-11, RN-14, RN-15 |

### RF-07. Espacio de consulta de innovaciones
| | |
|---|---|
| **Actor** | Estudiante, Profesor guía |
| **Prioridad** | Media |
| **Necesidad** | N-07 |
| **Descripción** | El sistema deberá ofrecer una biblioteca de consulta con las propuestas de innovación con nota igual o superior a 6,0, anonimizadas, con búsqueda libre y filtros por categoría y detalle de lectura. |
| **Estado** | ✅ Implementado, con revisión, anonimización y publicación a cargo del docente. Ver PEND-03 sobre publicación automática. |
| **Reglas** | RN-18 |

### RF-08. Autenticación institucional segura
| | |
|---|---|
| **Actor** | Todos los roles |
| **Prioridad** | Alta |
| **Necesidad** | N-01 |
| **Descripción** | El sistema deberá restringir el inicio de sesión a correos `@ucen.cl` con estado activo en la whitelist y redirigir a cada usuario a su área según el rol. |
| **Estado** | ✅ Implementado con Firebase Authentication y verificación en Firestore. |
| **Reglas** | RN-01, RN-02 |

## 2. Requisitos propuestos (sin validar con la stakeholder)

| ID | Requisito | Origen | Estado |
|---|---|---|---|
| **RF-P01** | **Seguimiento docente.** El profesor guía podrá ver el avance semanal de sus estudiantes (marco teórico y talleres), con filtros por situación y notas, sin acceder al texto de los relatos. | Necesidad ID-09 del Lab 2, que no llegó a la lista de RF. | ✅ Implementado en `/docente`. Falta formalizar. |
| **RF-P02** | **Estructura de talleres configurable.** El profesor guía podrá editar la estructura de los talleres (texto o relato, preguntas de alternativas y respuestas abiertas, importación CSV) y verla en el asistente del estudiante. | Acuerdo del equipo (HU-09), posterior a la validación. | 🟡 Integración parcial. Falta validar con la stakeholder. |

## 3. Requisitos no funcionales

| ID | Atributo | Requisito verificable | Verificación | Estado |
|---|---|---|---|---|
| RNF-01 | Privacidad | El servicio de detección analizará el 100% del texto antes de guardarlo y bloqueará el procesamiento hasta que los términos marcados se anonimicen; respuesta en ≤ 2 s. | Pruebas con nombres ficticios y reales. | 🟡 |
| RNF-02 | Seguridad y acceso | Se validará en menos de 2 s que el correo sea `@ucen.cl` y esté activo en la whitelist; se denegará el acceso a cualquier otro. | Intentos con correos externos y no registrados. | ✅ Acceso; ❌ bitácora de auditoría |
| RNF-03 | Compatibilidad | La interfaz será responsive, sin desborde horizontal, desde 360 px hasta 1920 px, con puntaje móvil Lighthouse superior a 90. | Emulación de dispositivos y auditoría Lighthouse. | ❔ |
| RNF-04 | Usabilidad | Cualquier taller o el marco teórico habilitado se alcanza en máximo 2 clics desde el panel principal, con colores de desempeño normados. | Prueba de navegación con usuarios. | ❔ |
| RNF-05 | Rendimiento | La IA entregará sus orientaciones en ≤ 10 s por intento en condiciones normales. | Medición de latencia de extremo a extremo. | 🟡 (IA simulada) |
| RNF-06 | Disponibilidad | Disponibilidad del 99% durante el periodo lectivo, incluida la ejecución del cierre semanal. | Monitoreo de infraestructura. | ❔ |
| RNF-07 | Respaldo | Respaldos diarios de relatos, notas e historial, con pérdida máxima de datos inferior a 24 horas. | Prueba de restauración. | ❔ |
| RNF-08 | Mantenibilidad | Arquitectura modular por características (`views/`, `hooks/`, `components/`) sin dependencias circulares y con TypeScript estricto. | Revisión de código y `npm run lint`. | ✅ |

RNF-06 a RNF-08 se definieron en la revisión del Laboratorio 5 pero no figuran en su tabla consolidada. Se mantienen aquí como parte de la línea base (PEND-08).
