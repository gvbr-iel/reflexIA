# Especificación de ReflexIA

Documentación formal del proyecto ReflexIA (Universidad Central de Chile, asignatura de Ingeniería de Software). Reúne la línea base de requisitos validada con la stakeholder y la deja trazable hacia el sistema implementado. Es la base sobre la que se elaboran los casos de uso.

| Campo | Valor |
|---|---|
| Versión del conjunto | 1.0 (borrador de trabajo) |
| Fecha | 22 de octubre de 2026 |
| Estado | En elaboración: los casos de uso aún no se redactan (ver [08](./08-plan-casos-de-uso.md)) |
| Equipo | Christian Salazar, Gabriel Jorquera, Maicol Aracena y Joaquín Michea |
| Stakeholder | Dra. Marcela Brevis (docente de la asignatura de práctica profesional) |

## Documentos

| N.º | Documento | Contenido |
|---|---|---|
| 01 | [Visión y alcance](./01-vision-y-alcance.md) | Problema, objetivos, alcance, exclusiones y evolución prevista. |
| 02 | [Glosario](./02-glosario.md) | Vocabulario común del dominio y del sistema. |
| 03 | [Actores y permisos](./03-actores-y-permisos.md) | Roles, sistemas externos y matriz de permisos. |
| 04 | [Requisitos](./04-requisitos.md) | Línea base de RF y RNF, con su estado en el código. |
| 05 | [Reglas de negocio](./05-reglas-de-negocio.md) | Reglas numeradas (RN-xx) que usarán los casos de uso. |
| 06 | [Decisiones, brechas y pendientes](./06-decisiones-brechas-pendientes.md) | Registro de decisiones, diferencias con el código y preguntas abiertas. |
| 07 | [Trazabilidad](./07-trazabilidad.md) | Necesidad → requisito → historia → pantalla → módulo. |
| 08 | [Plan de casos de uso](./08-plan-casos-de-uso.md) | Plantilla de ficha, convenciones y catálogo de casos (fichas sin redactar). |
| 09 | [Diagramas de casos de uso](./09-diagramas-casos-de-uso.md) | Siete diagramas Mermaid por módulo, con la tabla de cada uno. |

## Fuentes y orden de precedencia

Cuando dos fuentes se contradicen, se aplica este orden:

1. **Decisiones del equipo registradas en [06](./06-decisiones-brechas-pendientes.md)**, que consolidan lo acordado después de la validación.
2. **Laboratorio 5** (línea base v1.0, validada con la stakeholder). Es la fuente de las últimas decisiones de requisitos.
3. Laboratorios 2, 3 y 4 (necesidades, historias de usuario, prototipo y guion de validación).
4. `AI_GUIDELINES.md`, `README.md` y las guías de `docs/historias-usuario/`.

El **sistema de referencia es el implementado en este repositorio** (frontend con Firebase). Lo que el laboratorio describe con backend propio (servicio NER, tareas programadas, auditoría) se documenta como evolución prevista y se registra como brecha.

## Convenciones de identificadores

| Prefijo | Significado |
|---|---|
| `N-xx` | Necesidad del stakeholder |
| `RF-xx` / `RNF-xx` | Requisito funcional / no funcional de la línea base |
| `RF-Pxx` | Requisito propuesto, aún sin validar con la stakeholder |
| `RN-xx` | Regla de negocio |
| `DEC-xx` | Decisión registrada |
| `GAP-xx` | Brecha entre la línea base y el código |
| `PEND-xx` | Pregunta o definición pendiente |
| `HU-xx` | Historia de usuario del repositorio (guías en `docs/historias-usuario/`) |
| `CU-xx` | Caso de uso (por redactar) |

## Mantenimiento

- Cada cambio de requisito se anota primero en [06](./06-decisiones-brechas-pendientes.md) y después se refleja en 04, 05 y 07.
- Si una regla cambia, se actualiza también `AI_GUIDELINES.md` y la guía de la HU afectada (ver GAP-10).
