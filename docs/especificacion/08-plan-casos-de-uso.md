# 08. Plan de casos de uso

Este documento define **cómo** se documentarán los casos de uso. El orden de trabajo es:

1. **Diagramas** por módulo, en [09](./09-diagramas-casos-de-uso.md). ✅ Hechos.
2. **Catálogo** resumen (sección 4 de este documento). ✅ Hecho.
3. **Una ficha por caso de uso**, con la plantilla de la sección 3. ⏳ Sin redactar: primero deben cerrarse los pendientes del documento [06](./06-decisiones-brechas-pendientes.md).

## 1. Condiciones previas para redactar las fichas

| Condición | Estado |
|---|---|
| Glosario y actores acordados | ✅ Documentos 02 y 03 |
| Reglas de negocio numeradas | ✅ Documento 05 |
| Línea base de requisitos con decisiones aplicadas | ✅ Documento 04 |
| Diagramas de casos de uso por módulo | ✅ Documento 09 |
| Pendientes que cambian flujos resueltos (PEND-01, 03, 06, 07) | ⏳ Abiertos |
| Revisión del equipo de esta especificación | ⏳ Pendiente |

## 2. Convenciones

- Identificador: `CU-xx`, con una ficha por caso en `docs/casos-de-uso/CU-xx-nombre.md`.
- Nivel: casos de uso de **objetivo de usuario** (un actor, una meta, una sesión).
- Alcance: el sistema implementado (DEC-06). Si un paso depende de una brecha, se anota el comportamiento objetivo y el actual.
- Las reglas de negocio aplicables se citan por código (RN-xx) en **Comentarios**.
- Un caso incluido (`«include»`) se indica en la secuencia como subpaso (por ejemplo, 5.1: "Se realiza el caso de uso CU-11").
- Los mensajes de la interfaz se citan tal como aparecen en pantalla.

## 3. Plantilla de ficha

Formato solicitado en la asignatura: encabezado, secuencia normal, postcondición, excepciones y comentarios.

| Campo | Contenido |
|---|---|
| **Identificador y nombre** | CU-xx. Verbo en infinitivo + objeto. |
| **Actores** | Principal y secundarios. |
| **Descripción** | Qué logra el actor y cuándo ocurre. |
| **Requisitos** | RF, RNF y HU relacionadas. |
| **Precondición** | Estado necesario antes de iniciar. |
| **Secuencia normal** | Tabla de dos columnas: **Paso** y **Acción**. Las acciones alternan lo que hace el actor y lo que responde el sistema. Los subpasos (n.1) indican casos incluidos. |
| **Postcondición** | Estado en que queda el sistema y datos persistidos. |
| **Excepciones** | Tabla con **Paso** y **Acción**: se indica el paso donde ocurre la excepción y sus respuestas (E.1, E.2…). |
| **Comentarios** | Reglas de negocio (RN-xx), brechas (GAP-xx) y pendientes (PEND-xx) que afectan al caso. |

Ejemplo de estructura:

| | |
|---|---|
| Postcondición | El estudiante queda… y el sistema ha registrado… |

| Excepciones | Paso | Acción |
|---|---|---|
| | 3 | Si la condición no se cumple, |
| | E.1 | El sistema informa la situación. |
| | E.2 | Se cancela el caso de uso. |

## 4. Catálogo de casos de uso

Agrupado por los diagramas del documento [09](./09-diagramas-casos-de-uso.md).

| Diagrama | ID | Caso de uso | Actor | RF |
|---|---|---|---|---|
| D1 | CU-01 | Iniciar sesión | Todos | RF-08 |
| D1 | CU-02 | Cerrar sesión | Todos | RF-08 |
| D2 | CU-03 | Registrar un correo en la whitelist | Administrador | RF-01 |
| D2 | CU-04 | Cargar la whitelist de forma masiva | Administrador | RF-01 |
| D2 | CU-05 | Revocar o restablecer un acceso | Administrador | RF-01 |
| D2 | CU-06 | Eliminar definitivamente a un usuario | Administrador | RF-01 |
| D3 | CU-07 | Estudiar el marco teórico | Estudiante | RF-04 |
| D3 | CU-08 | Rendir la evaluación diagnóstica | Estudiante | RF-04 |
| D5 | CU-09 | Consultar el progreso en el panel | Estudiante | RF-P01 |
| D4 | CU-10 | Redactar el relato de un taller y guardar borrador | Estudiante | RF-03 |
| D4 | CU-11 | Anonimizar datos sensibles del relato | Estudiante, servicio de detección | RF-05 |
| D4 | CU-12 | Solicitar un impulso a "El Impulso" | Estudiante, Sistema de IA | RF-02 |
| D4 | CU-13 | Cerrar un taller por intentos agotados o plazo vencido | Estudiante, Planificador | RF-06 |
| D6 | CU-14 | Revisar y validar una reflexión con nota oficial | Profesor guía | RF-02 |
| D6 | CU-15 | Configurar plazos e intentos | Profesor guía | RF-06 |
| D6 | CU-16 | Configurar la estructura de un taller | Profesor guía | RF-P02 |
| D5 | CU-17 | Seguir el avance de los estudiantes | Profesor guía | RF-P01 |
| D7 | CU-18 | Revisar, anonimizar y publicar una innovación | Profesor guía | RF-07 |
| D7 | CU-19 | Consultar la biblioteca de innovaciones | Estudiante, Profesor guía | RF-07 |

CU-13 depende de PEND-06 y PEND-07; CU-15, de PEND-06; CU-18, de PEND-03.

## 5. Precedente

El Laboratorio 3 contiene un caso de uso ya redactado, "Registro y análisis estructurado de incidente crítico con retroalimentación de IA". Es la base de CU-10, CU-11 y CU-12, que se separaron para que cada uno tenga un único objetivo.

## 6. Criterios de calidad

- Cada caso de los diagramas tiene su ficha, y cada ficha corresponde a un caso del diagrama.
- Cada requisito en alcance aparece en al menos un caso, y ninguna regla de negocio queda sin caso que la ejerza.
- La matriz del documento [07](./07-trazabilidad.md) se actualiza con el ID de cada caso.
