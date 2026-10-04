# Guía de desarrollo — HU-01: Gestión de la Whitelist de Correos Autorizados

## Descripción general

Este módulo implementa la **gestión de la whitelist** (lista de correos institucionales autorizados) para el rol **Administrador** (profesor guía o coordinador), en la ruta `/admin/whitelist` (RF-01, RNF-02).

> **Historia de usuario.** Como Administrador, quiero gestionar de forma autónoma la lista de correos institucionales autorizados mediante cargas masivas, revisión de estado y revocación de accesos, para controlar de manera eficiente y segura qué usuarios tienen acceso al sistema.

El administrador puede:

- Ver un **resumen** de accesos activos, revocados y por perfil.
- **Buscar** correos y **filtrar** por estado y perfil.
- **Autorizar** un correo individual.
- Hacer una **carga masiva** desde un archivo CSV/TXT o pegando una lista, con **vista previa** antes de importar.
- **Revocar** un acceso de forma inmediata y **restablecerlo** después.

Criterios de aceptación y dónde se cumplen:

| Criterio | Dónde |
|---|---|
| La autenticación se restringe a correos con dominio `@ucen.cl` | `utils/institutionalEmail.ts` (`validateInstitutionalEmail`), usado al autorizar, en la carga masiva y en `whitelistService.checkAccess` |
| El correo debe estar registrado previamente en la whitelist | `whitelistService.checkAccess` (responde `not-registered` o `revoked`) |
| El acceso se limita a estudiantes y profesores de práctica profesional | `models/whitelist.ts` (`WHITELIST_ROLES = ['student', 'teacher']`) y `RoleSelector` |
| El administrador puede hacer cargas masivas y revocar accesos de inmediato | `UploadModal` + `useBulkUpload` + `whitelistService.importEntries`; `RevokeAccessModal` + `whitelistService.revokeAccess` |

> **Alcance:** el proyecto es **solo frontend**. La "base de datos" de la whitelist es un mock en `localStorage`, y el inicio de sesión (RF-08) no está implementado. La verificación de acceso (`checkAccess`) queda lista para que el login la use, y el servicio queda listo para conectar un backend sin cambiar sus firmas.

### Ubicación en el código

```text
src/
├── models/
│   └── whitelist.ts                 # Tipos, perfiles, estados y constantes (dominio @ucen.cl)
├── services/
│   └── whitelistService.ts          # Mock con localStorage (firmas estables) + checkAccess
├── utils/
│   └── institutionalEmail.ts        # Normaliza y valida correos @ucen.cl (compartido con RF-08)
├── components/
│   └── Modal.tsx                    # Global: ahora se renderiza en un portal sobre <body>
├── layouts/
│   └── AdminLayout.tsx              # Header de 56 px y panel lateral fijo al hacer scroll
└── views/
    └── admin-whitelist/
        ├── WhiteListView.tsx                # Vista principal: compone todo
        ├── hooks/
        │   ├── useWhitelist.ts              # Lista, filtros, resumen, acciones y avisos
        │   └── useBulkUpload.ts             # Lectura de archivo/texto y vista previa de la carga
        └── components/
            ├── WhitelistStats.tsx           # Tarjetas de resumen
            ├── FilterBar.tsx                # Búsqueda y filtros
            ├── WhitelistTable.tsx           # Tabla (tarjetas en móvil) con revocar/restablecer
            ├── ActionNotice.tsx             # Aviso del resultado de una acción
            ├── AddEmailModal.tsx            # Autorizar un correo
            ├── UploadModal.tsx              # Carga masiva con vista previa y bloqueo por errores
            ├── RevokeAccessModal.tsx        # Confirmación de revocación
            ├── RoleSelector.tsx             # Selector de perfil (estudiante / profesor guía)
            └── fieldStyles.ts               # Clases compartidas de los campos de formulario
```

---

## Funcionalidades

### Resumen

Cuatro tarjetas en la parte superior (2 columnas en móvil, 4 desde `xl`):

| Tarjeta | Qué cuenta |
|---|---|
| Accesos activos | Correos con estado activo, sobre el total registrado |
| Estudiantes | Estudiantes con acceso **activo** |
| Profesores guía | Profesores con acceso **activo** |
| Accesos revocados | Correos revocados (se pueden restablecer) |

Bajo el encabezado, un recuadro recuerda la regla de acceso: solo ingresan estudiantes y profesores guía con un correo `@ucen.cl` activo en la lista.

### Búsqueda y filtros

- **Buscar correo:** busca el texto dentro del correo, sin distinguir mayúsculas.
- **Estado:** Todos, Activos o Revocados.
- **Perfil:** Todos, Estudiantes o Profesores guía.
- Muestra cuántos correos coinciden ("3 de 16 correos coinciden con los filtros") y un botón **Limpiar filtros**.

### Tabla de correos

Columnas: **Correo**, **Perfil**, **Estado**, **Fecha de alta** y **Acciones**. Ordenada de la alta más reciente a la más antigua. En escritorio es una tabla; en móvil, cada correo se muestra como tarjeta (comportamiento del componente global `Table`).

- Un correo revocado muestra la etiqueta "Revocado" y, debajo, "desde <fecha>".
- **Revocar** pide confirmación; **Restablecer** actúa directo.
- Mientras una acción está en curso, el botón de esa fila muestra un indicador de carga.

### Autorizar un correo

Botón **Autorizar correo**. Se escribe el correo y se elige el perfil. Errores posibles, con un mensaje que explica cómo corregirlo:

| Caso | Resultado |
|---|---|
| Campo vacío | "Escribe el correo institucional que quieres autorizar." |
| Formato inválido | Se rechaza (`invalid-format`) |
| Dominio distinto de `@ucen.cl` | Se rechaza (`invalid-domain`) |
| Correo ya activo | Se rechaza (`already-active`) |
| Correo revocado | **Se reactiva** con el perfil elegido |

### Carga masiva

Botón **Carga masiva**. El modal tiene tres pasos:

1. **Perfil:** todos los correos de una carga reciben el mismo perfil (estudiante o profesor guía).
2. **Correos:** subir un archivo `.csv` o `.txt` (máximo 1 MB) o pegar la lista. Incluye **Descargar plantilla CSV** (`plantilla-whitelist.csv`).
3. **Vista previa:** se actualiza al instante y muestra qué pasará con cada línea.

Formatos aceptados:

- Un correo por línea, o separados por coma, punto y coma o tabulación.
- En un CSV con varias columnas se toman solo las celdas que contienen `@`.
- Una primera fila sin correos (por ejemplo `correo`) se trata como encabezado y se ignora.
- Excel (`.xlsx`) no se lee: el mensaje pide guardarlo como CSV.

Estado de cada línea en la vista previa:

| Estado | Significado | ¿Bloquea la carga? |
|---|---|---|
| Se agregará | Correo nuevo y válido | No |
| Se reactivará | Estaba revocado; vuelve a activo con el perfil elegido | No |
| Ya está activo | Ya tiene acceso; se omite | No |
| Repetido en la lista | Aparece más de una vez en la misma carga; se omite | No |
| Formato no válido | No es un correo | **Sí** |
| No es @ucen.cl | Correo de otro dominio | **Sí** |

**Bloqueo por errores:** si al presionar **Importar** hay líneas con formato inválido o de otro dominio, **no se importa ningún correo**. Aparece un aviso destacado (y recibe el foco) que lista cada valor con su número de línea e indica cómo corregirlo. El aviso desaparece solo cuando los errores se corrigen, y entonces ya se puede importar. Así ningún correo inválido pasa desapercibido.

Los correos ya activos o repetidos no son errores: se omiten automáticamente.

### Revocar y restablecer

- **Revocar** abre una confirmación: el correo deja de poder ingresar **desde ese momento**. No se borra: queda como "Revocado" con su fecha.
- **Restablecer** lo vuelve a activar.

### Avisos y estados

- Tras cada acción aparece un aviso sobre la lista (por ejemplo "Carga masiva completada: 5 correos agregados, 1 reactivado"). Se oculta solo a los 6 segundos o con la ✕.
- **Carga:** tarjetas y tabla muestran bloques animados (skeleton) en vez de números en cero.
- **Error:** mensaje con botón **Reintentar**.
- **Vacío:** mensaje distinto si no hay correos o si los filtros no encuentran resultados.

---

## Conceptos clave del código

### 1. Arquitectura por capas

El módulo sigue el patrón del proyecto (ver `CLAUDE.md`):

```text
models/whitelist.ts          → tipos y constantes
services/whitelistService.ts → datos (hoy localStorage, mañana API)
views/.../hooks/             → toda la lógica y el estado
views/.../components/        → solo presentación
WhiteListView.tsx            → compone hooks y componentes
```

Las vistas y componentes **nunca** llaman al servicio: solo los hooks (regla R4). Así, al conectar el backend se cambia el servicio y nada más.

### 2. Servicio mock con firmas estables

`whitelistService` expone métodos `async` que hoy leen y escriben `localStorage`, pero tienen la forma que tendrá la API real. Cada uno lleva un `TODO` con el endpoint previsto:

| Método | Qué hace | Endpoint previsto |
|---|---|---|
| `fetchEntries()` | Lista todos los correos (más recientes primero) | `GET /api/whitelist` |
| `addEntry({ email, role })` | Autoriza un correo o reactiva uno revocado | `POST /api/whitelist` |
| `importEntries({ emails, role })` | Carga masiva; devuelve `{ added, reactivated, skipped }` | `POST /api/whitelist/bulk` |
| `revokeAccess(id)` | Revoca de inmediato | `PATCH /api/whitelist/:id` |
| `restoreAccess(id)` | Restablece el acceso | `PATCH /api/whitelist/:id` |
| `checkAccess(email)` | ¿Puede ingresar? Para el login (RF-08) | `POST /api/auth/check-access` |

`checkAccess` responde `{ allowed: true, role }` o `{ allowed: false, reason }`, con `reason` = `invalid-domain`, `not-registered` o `revoked`.

### 3. Persistencia en `localStorage`

- Clave: **`reflexia_whitelist`**.
- La primera vez (o si el JSON está dañado) se carga una **semilla de 16 correos ficticios** (4 profesores y 12 estudiantes, 3 de ellos revocados). No corresponden a personas reales, por la regla de anonimización.
- Los datos viven **en el navegador de cada persona**: no se comparten entre usuarios ni computadores.
- Para volver a los datos iniciales: en las herramientas de desarrollo, **Application → Local Storage** y borrar `reflexia_whitelist`, o ejecutar en la consola `localStorage.removeItem('reflexia_whitelist')` y recargar.

El servicio agrega una **latencia simulada** de 400 ms (800 ms en la carga masiva) para que se vean los estados de carga, como ocurrirá con la red real.

### 4. Validación de correos institucionales

`utils/institutionalEmail.ts` concentra la regla de RNF-02 en un solo lugar:

- `normalizeEmail`: quita espacios y pasa a minúsculas (`" A@UCEN.CL "` → `"a@ucen.cl"`).
- `validateInstitutionalEmail`: devuelve `valid`, `invalid-format` o `invalid-domain`. El dominio se compara con `endsWith('@ucen.cl')`, así que subdominios como `@sub.ucen.cl` se rechazan.

Está en `utils/` (y no dentro del feature) porque el login (RF-08) debe usar exactamente la misma regla. El dominio está en una sola constante: `INSTITUTIONAL_DOMAIN` en `models/whitelist.ts`.

### 5. Errores tipados y mensajes para el usuario

El servicio no devuelve textos de interfaz: lanza `WhitelistError` con un **código** (`invalid-format`, `invalid-domain`, `already-active`, `not-found`). El hook `useWhitelist` traduce cada código a un mensaje que explica qué pasó y cómo corregirlo (regla 10 de AI_GUIDELINES §9). Al cambiar a una API, el servicio solo tiene que seguir entregando esos códigos.

Las acciones del hook devuelven un `ActionResult` (`{ ok: true }` o `{ ok: false, message }`), así los modales saben si cerrarse o mostrar el error.

### 6. Hooks y estado

**`useWhitelist`**

- Guarda la lista completa y deriva todo lo demás con `useMemo`: la lista filtrada y el resumen no se guardan aparte, se calculan, así nunca quedan desincronizados.
- **Descarta respuestas atrasadas** con `latestRequestRef`: si se dispara una carga nueva antes de que termine la anterior, la vieja se ignora (convención del proyecto; también evita problemas con `StrictMode`, que ejecuta los efectos dos veces en desarrollo).
- Tras una acción, actualiza la fila afectada con la respuesta del servicio, **sin volver a mostrar la carga** de toda la tabla.
- `pendingIds` (un `Set`) indica qué filas tienen una acción en curso, para mostrar el indicador solo en ese botón.

**`useBulkUpload`**

- `extractCandidates` separa el texto en valores con su número de línea (reglas de formato descritas arriba).
- `buildPreview` clasifica cada valor comparándolo con la whitelist actual y con los anteriores del mismo archivo.
- Expone `emailsToImport` (nuevos y por reactivar) y `rejectedRows` (formato o dominio inválido), que es lo que usa `UploadModal` para bloquear la importación.

### 7. Detalles de componentes

- **`WhitelistEntry` es un `type`, no una `interface`:** el componente global `Table` exige `Record<string, unknown>`, y en TypeScript solo los `type` cumplen esa condición implícitamente.
- **`Modal` usa un portal** (`createPortal` a `<body>`): antes, al ponerlo dentro de un contenedor con `space-y-*`, heredaba un margen de 24 px y dejaba una franja superior sin oscurecer. Ahora no le afectan los estilos del contenedor. Se usa igual que antes (también lo usa `DraftManager` de HU-03).
- **Panel lateral fijo:** el header mide 56 px (`h-14`) y el panel usa `md:sticky top-14`, así no se corta al hacer scroll en listas largas. Se aplicó a los tres layouts.

### 8. Colores y accesibilidad

- **Sin rojo ni naranjo** (AI_GUIDELINES §4): los errores y advertencias se marcan con ícono, borde, texto y negrita en el azul institucional. Revocar usa el botón normal, no la variante `danger`.
- El estado **Activo/Revocado** se distingue por texto y por forma (punto lleno o vacío), no solo por color.
- Los campos usan texto de **16 px** para evitar el zoom automático en iOS (AI_GUIDELINES §5).
- Avisos con `aria-live`, errores con `role="alert"`, etiquetas en todos los campos y foco visible con teclado.
- Diseño **móvil primero**, probado desde 360 px; las distribuciones de varias columnas usan `xl` por el menú lateral de 240 px.

---

## Registro de cambios por etapa

### Etapa 1 — Modelo de datos (`ea0fd7e`)

`models/whitelist.ts`: perfiles (`student`, `teacher`), estados (`active`, `revoked`), `WhitelistEntry`, tipos de la carga masiva y de `checkAccess`, y la constante `INSTITUTIONAL_DOMAIN`.

### Etapa 2 — Validación de correos (`f560b87`)

`utils/institutionalEmail.ts`: normalización y validación de formato y dominio.

### Etapa 3 — Servicio mock (`4762330`)

`services/whitelistService.ts`, con semilla de 16 correos, latencia simulada, `WhitelistError` y `checkAccess`. Se renombró `whitelist.service.ts` a `whitelistService.ts` para seguir la convención del proyecto.

### Etapa 4 — Hook de la lista (`ada6192`)

`useWhitelist`: carga, filtros, resumen, altas, carga masiva, revocación, restablecimiento y avisos.

### Etapa 5 — Hook de la carga masiva (`037f9e7`)

`useBulkUpload`: lectura de CSV/TXT o texto pegado, vista previa y plantilla CSV.

### Etapa 6 — Tabla, filtros y resumen (`32e5c77`)

`WhitelistStats`, `FilterBar`, `WhitelistTable`, `ActionNotice` y `fieldStyles`.

### Etapa 7 — Modales (`0bbc3bb`)

`RoleSelector`, `AddEmailModal`, `UploadModal` y `RevokeAccessModal`.

### Etapa 8 — Vista principal (`ff4adc8`)

`WhiteListView` compone todo dentro de `AdminLayout`.

### Etapa 9 — Bloqueo de la carga masiva (`b1de391`)

Si hay correos que no son `@ucen.cl` o con formato inválido, al presionar **Importar** no se carga nada y se muestra un aviso con cada valor y su línea, hasta que se corrijan.

### Etapa 10 — Modal en portal (`c42d5a2`)

`components/Modal.tsx` se renderiza sobre `<body>` para cubrir toda la pantalla.

### Etapa 11 — Panel lateral (`a27d1dd`, PR #7)

El panel del administrador queda fijo al hacer scroll. En el PR #7 se extendió a los layouts de estudiante y docente, y se fijó el header en 56 px para eliminar una franja de 4 px entre el header y el panel.

---

## Cómo probar

1. `npm run dev` y abrir `/admin/whitelist`.
2. Revisar el resumen (13 activos de 16 con la semilla) y probar la búsqueda y los filtros.
3. **Autorizar correo:** probar con `alguien@gmail.com` (se rechaza) y con un correo `@ucen.cl` nuevo (se agrega al inicio de la tabla).
4. **Carga masiva → Pegar correos**, con:
   ```text
   nuevo1@ucen.cl
   alguien@gmail.com
   estudiante.practica01@ucen.cl
   ```
   La vista previa debe mostrar 1 nuevo, 1 ya registrado y 1 con error. Al presionar **Importar** no se carga nada y aparece el aviso. Borrar la línea de `@gmail.com` e importar de nuevo: ahora sí se carga.
5. **Descargar plantilla CSV**, subirla y comprobar que la fila `correo` se ignora como encabezado.
6. **Revocar** un correo: debe pasar a "Revocado" con fecha. Luego **Restablecer**.
7. Probar en móvil (360 px): tarjetas en vez de tabla, filtros y resumen en dos columnas.
8. Bajar hasta el final de la lista en escritorio: el panel lateral debe seguir visible.
9. `npx tsc --noEmit` para la verificación de tipos (no hay tests).

Para empezar de cero, borrar la clave `reflexia_whitelist` (ver Conceptos clave § 3).

---

## Cómo conectar el backend

1. En `whitelistService.ts`, reemplazar el cuerpo de cada método por la llamada Axios de su `TODO`, sin cambiar las firmas.
2. Eliminar la semilla (`SEED`), `readEntries`/`writeEntries` y la latencia simulada.
3. Mantener los códigos de `WhitelistError` en las respuestas de error, para que `useWhitelist` siga mostrando los mismos mensajes.

**Importante para la seguridad:** hoy toda la lógica corre en el navegador y cualquiera puede modificar `localStorage`. En el sistema real, el **backend** debe guardar la lista y hacer cumplir las reglas (dominio, duplicados, revocación y `checkAccess`). La validación del frontend se mantiene solo para avisar rápido al usuario.

---

## Discrepancias y pendientes del módulo

| Tema | Detalle | Referencia |
|---|---|---|
| Inicio de sesión | RF-08 no está implementado. Cuando se haga, debe usar `whitelistService.checkAccess(email)` y `utils/institutionalEmail.ts` en vez de reimplementar las reglas. | RF-08, RNF-02 |
| Dominio del correo | El equipo confirmó `@ucen.cl`; AI_GUIDELINES §11 todavía lo marca como duda frente a `@central.cl`. Si cambiara, basta con editar `INSTITUTIONAL_DOMAIN`. | `AI_GUIDELINES.md` §11 |
| Trazabilidad | RF-01 menciona trazabilidad, pero no se registra quién autorizó o revocó cada correo; solo las fechas. Requiere backend. | README, RF-01 |
| Perfil por carga | Cada carga masiva usa un solo perfil; para mezclar estudiantes y profesores se hacen dos cargas. | Decisión de diseño |
| Excel | Solo se aceptan `.csv` y `.txt`. Leer `.xlsx` requeriría una librería adicional. | Decisión de diseño |
| Eliminar correos | No existe borrado definitivo: revocar conserva el registro y permite restablecerlo. | Decisión de diseño |
| Paginación | La tabla muestra todos los correos; alcanza para el tamaño de una asignatura. Con backend podría paginarse. | Con backend |
| `Dropzone` en rojo | El componente global muestra sus errores (archivo de más de 1 MB) con `text-perf-fail`, lo que contradice AI_GUIDELINES §4. No se modificó por ser compartido. | Acordar con el equipo |
| Componente `Input` | No existe un campo de texto global: se usaron campos nativos con las clases de `fieldStyles.ts`. Si el equipo crea uno en `components/`, conviene migrarlos. | AI_GUIDELINES §9, regla 1 |
| Backend | No existe; el servicio usa `localStorage` y cada método tiene su `TODO` de Axios. | Coordinación con backend |
