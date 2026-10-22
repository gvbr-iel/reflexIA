# 09. Diagramas de casos de uso

Los casos de uso de ReflexIA se agrupan en **siete diagramas por módulo**, para que cada uno sea legible y tenga un propósito claro. Cada diagrama va seguido de la tabla de sus casos. La ficha detallada de cada caso se redacta después (ver [08](./08-plan-casos-de-uso.md)).

## Cómo leer los diagramas

Mermaid no tiene notación nativa de casos de uso, así que se dibujan con diagramas de flujo siguiendo la convención UML:

| Elemento | Representación |
|---|---|
| Actor humano | Rectángulo azul |
| Sistema externo o proceso automático | Rectángulo gris punteado |
| Caso de uso | Óvalo con su ID y nombre |
| Límite del sistema | Recuadro "ReflexIA" |
| Asociación actor–caso | Línea continua |
| `«include»` | Línea punteada desde el caso base hacia el caso que siempre incluye |
| `«extend»` | Línea punteada desde el caso que extiende hacia el caso base |

## Índice

| Diagrama | Módulo | Casos |
|---|---|---|
| [D1](#d1-acceso-y-sesión) | Acceso y sesión | CU-01, CU-02 |
| [D2](#d2-administración-de-la-whitelist) | Administración de la whitelist | CU-03 a CU-06 |
| [D3](#d3-marco-teórico) | Marco teórico | CU-07, CU-08 |
| [D4](#d4-talleres-y-reflexión-del-estudiante) | Talleres y reflexión del estudiante | CU-10 a CU-13 |
| [D5](#d5-seguimiento-del-avance) | Seguimiento del avance | CU-09, CU-17 |
| [D6](#d6-gestión-docente) | Gestión docente | CU-14 a CU-16 |
| [D7](#d7-biblioteca-de-innovaciones) | Biblioteca de innovaciones | CU-18, CU-19 |

---

## D1. Acceso y sesión

Puerta de entrada común a los tres roles. Aplica la regla de acceso por whitelist (RN-01, RN-02).

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  usu["Usuario<br/>(Estudiante, Profesor guía<br/>o Administrador)"]:::actor
  fb["Firebase Authentication<br/>y Cloud Firestore"]:::ext

  subgraph SIS["ReflexIA: Acceso y sesión"]
    CU01(["CU-01<br/>Iniciar sesión"]):::uc
    CU02(["CU-02<br/>Cerrar sesión"]):::uc
  end

  usu --- CU01
  usu --- CU02
  CU01 --- fb

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas |
|---|---|---|---|
| CU-01 Iniciar sesión | Estudiante, Profesor guía, Administrador; Firebase | RF-08 | RN-01, RN-02 |
| CU-02 Cerrar sesión | Estudiante, Profesor guía, Administrador | RF-08 | RN-02 |

---

## D2. Administración de la whitelist

Gestión del acceso a cargo del administrador.

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  adm["Administrador"]:::actor
  fs["Cloud Firestore"]:::ext

  subgraph SIS["ReflexIA: Administración de la whitelist"]
    CU03(["CU-03<br/>Registrar un correo<br/>en la whitelist"]):::uc
    CU04(["CU-04<br/>Cargar la whitelist<br/>de forma masiva"]):::uc
    CU05(["CU-05<br/>Revocar o restablecer<br/>un acceso"]):::uc
    CU06(["CU-06<br/>Eliminar definitivamente<br/>a un usuario"]):::uc
  end

  adm --- CU03
  adm --- CU04
  adm --- CU05
  adm --- CU06
  CU03 --- fs
  CU04 --- fs
  CU05 --- fs
  CU06 --- fs

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-03 Registrar un correo en la whitelist | Administrador | RF-01 | RN-01, RN-02 | |
| CU-04 Cargar la whitelist de forma masiva | Administrador | RF-01 | RN-01, RN-02 | Archivo CSV/Excel con vista previa. PEND-05 sobre la frecuencia de carga. |
| CU-05 Revocar o restablecer un acceso | Administrador | RF-01 | RN-03 | Acción reversible. |
| CU-06 Eliminar definitivamente a un usuario | Administrador | RF-01 | RN-03, RN-04 | Doble confirmación. No implementado (GAP-03). |

---

## D3. Marco teórico

Preparación conceptual del estudiante. Su aprobación desbloquea el Taller 1 (RN-08).

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  est["Estudiante"]:::actor
  fs["Cloud Firestore<br/>(resumen de progreso)"]:::ext

  subgraph SIS["ReflexIA: Marco teórico"]
    CU07(["CU-07<br/>Estudiar el marco teórico"]):::uc
    CU08(["CU-08<br/>Rendir la evaluación<br/>diagnóstica"]):::uc
  end

  est --- CU07
  est --- CU08
  CU08 --- fs

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-07 Estudiar el marco teórico | Estudiante | RF-04 | RN-07 | Referencias APA con DOI (GAP-04). |
| CU-08 Rendir la evaluación diagnóstica | Estudiante | RF-04 | RN-05, RN-06, RN-08 | Aprobación 8 de 10. Depende de PEND-01 y de GAP-01, GAP-02, GAP-09. |

---

## D4. Talleres y reflexión del estudiante

Núcleo del sistema: redacción del relato, resguardo de la privacidad y retroalimentación de la IA.

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  est["Estudiante"]:::actor
  ia["Sistema de IA<br/>El Impulso"]:::ext
  det["Servicio de detección<br/>de datos sensibles"]:::ext
  plan["Planificador de cierre<br/>de plazos (previsto)"]:::ext

  subgraph SIS["ReflexIA: Talleres y reflexión"]
    CU10(["CU-10<br/>Redactar el relato<br/>y guardar borrador"]):::uc
    CU11(["CU-11<br/>Anonimizar datos<br/>sensibles del relato"]):::uc
    CU12(["CU-12<br/>Solicitar un impulso<br/>a El Impulso"]):::uc
    CU13(["CU-13<br/>Cerrar un taller por<br/>intentos agotados<br/>o plazo vencido"]):::uc
  end

  est --- CU10
  est --- CU12
  est --- CU13
  CU12 -. "«include»" .-> CU11
  CU13 -. "«extend»" .-> CU12
  CU11 --- det
  CU12 --- ia
  CU13 --- plan

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-10 Redactar el relato y guardar borrador | Estudiante | RF-03 | RN-08, RN-09, RN-10 | Guardar un borrador no descuenta intentos. |
| CU-11 Anonimizar datos sensibles del relato | Estudiante; servicio de detección | RF-05 | RN-13, RN-19 | Siempre se ejecuta antes de pedir un impulso (`include` desde CU-12). GAP-06. |
| CU-12 Solicitar un impulso a "El Impulso" | Estudiante; Sistema de IA | RF-02 | RN-11, RN-12 | IA simulada (GAP-07). |
| CU-13 Cerrar un taller por intentos agotados o plazo vencido | Estudiante; Planificador | RF-06 | RN-11, RN-14, RN-15 | Extiende CU-12 cuando se agotan los intentos. Cierre por plazo no implementado (GAP-05). Depende de PEND-06 y PEND-07. |

---

## D5. Seguimiento del avance

Consulta del progreso: el estudiante ve el suyo y el profesor guía ve el de su curso.

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  est["Estudiante"]:::actor
  doc["Profesor guía"]:::actor
  fs["Cloud Firestore<br/>(progress, profiles, evaluations)"]:::ext

  subgraph SIS["ReflexIA: Seguimiento del avance"]
    CU09(["CU-09<br/>Consultar el progreso<br/>en el panel"]):::uc
    CU17(["CU-17<br/>Seguir el avance de<br/>los estudiantes"]):::uc
  end

  est --- CU09
  doc --- CU17
  CU09 --- fs
  CU17 --- fs

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-09 Consultar el progreso en el panel | Estudiante | RF-P01 | RN-17 | Pendiente confirmar RNF-04 (máximo 2 clics) con el panel nuevo. |
| CU-17 Seguir el avance de los estudiantes | Profesor guía | RF-P01 | RN-16, RN-17, RN-19 | Solo números y estados, nunca el texto de los relatos. |

---

## D6. Gestión docente

Revisión de la retroalimentación, nota oficial y configuración del curso.

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  doc["Profesor guía"]:::actor
  fs["Cloud Firestore<br/>(evaluations, estructura de talleres)"]:::ext

  subgraph SIS["ReflexIA: Gestión docente"]
    CU14(["CU-14<br/>Revisar y validar una<br/>reflexión con nota oficial"]):::uc
    CU15(["CU-15<br/>Configurar plazos<br/>e intentos"]):::uc
    CU16(["CU-16<br/>Configurar la estructura<br/>de un taller"]):::uc
  end

  doc --- CU14
  doc --- CU15
  doc --- CU16
  CU14 --- fs
  CU16 --- fs

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef ext fill:#F7FAFC,stroke:#9CA3AF,color:#1F2937,stroke-dasharray:4 3;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-14 Revisar y validar una reflexión con nota oficial | Profesor guía | RF-02 | RN-12, RN-16 | La propuesta original de la IA no se modifica. |
| CU-15 Configurar plazos e intentos | Profesor guía | RF-06 | RN-11, RN-15 | Intentos: 3 por defecto (DEC-11). Depende de PEND-06. |
| CU-16 Configurar la estructura de un taller | Profesor guía | RF-P02 | RN-09 | Acuerdo del equipo, sin validar con la stakeholder (PEND-10). |

---

## D7. Biblioteca de innovaciones

Repositorio de propuestas destacadas (nota ≥ 6,0).

```mermaid
%%{init: {"theme":"neutral","flowchart":{"curve":"linear"}}}%%
flowchart LR
  est["Estudiante"]:::actor
  doc["Profesor guía"]:::actor

  subgraph SIS["ReflexIA: Biblioteca de innovaciones"]
    CU18(["CU-18<br/>Revisar, anonimizar y<br/>publicar una innovación"]):::uc
    CU19(["CU-19<br/>Consultar la biblioteca<br/>de innovaciones"]):::uc
  end

  doc --- CU18
  doc --- CU19
  est --- CU19

  style SIS fill:none,stroke:#1E5AA8,stroke-width:2px
  classDef actor fill:#1E5AA8,stroke:#1E5AA8,color:#ffffff;
  classDef uc fill:#ffffff,stroke:#0F8FA8,color:#1F2937;
```

| Caso | Actores | Requisito | Reglas | Notas |
|---|---|---|---|---|
| CU-18 Revisar, anonimizar y publicar una innovación | Profesor guía | RF-07 | RN-18, RN-19 | Depende de PEND-03 (publicación automática o con revisión). |
| CU-19 Consultar la biblioteca de innovaciones | Estudiante, Profesor guía | RF-07 | RN-18 | Solo lectura. |

---

## Cobertura

Los 19 casos del catálogo aparecen en exactamente un diagrama. Cada requisito en alcance (RF-01 a RF-08, RF-P01 y RF-P02) está cubierto por al menos un caso.
