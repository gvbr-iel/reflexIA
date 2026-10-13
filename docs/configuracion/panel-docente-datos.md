# Datos a mano del panel docente

El nombre de cada estudiante se carga a mano en **Cloud Firestore**. Las notas
las guarda la app cuando el profesor valida una reflexión en
`/docente/reflexiones`, pero también se pueden cargar a mano (por ejemplo,
para un taller que no tiene reflexión de ejemplo). Esta guía indica dónde y
con qué campos.

El avance (marco teórico, intentos y borradores) **no se carga a mano**: la app
lo crea sola, en la colección `progress`, cuando el estudiante usa la
plataforma.

Antes de empezar, las reglas de `firestore.rules` deben estar publicadas
(Firestore Database → Reglas → Publicar). Cargar datos desde la consola no
pasa por esas reglas, pero la app sí las usa para leerlos.

## Cómo crear un documento

1. Entra a `console.firebase.google.com` y abre el proyecto **reflexia-a6203**.
2. Ve a **Firestore Database → Datos**.
3. Pulsa **Iniciar colección** (la primera vez) o abre la colección y pulsa **Agregar documento**.
4. En **ID del documento** escribe el correo del estudiante, en minúsculas y sin espacios.
5. Agrega los campos de las tablas de abajo, con el tipo indicado, y guarda.

El ID debe ser **exactamente el mismo correo** que tiene el estudiante en la
whitelist, porque con él se cruzan los datos.

## Colección `profiles` (nombre)

Un documento por estudiante. ID: el correo, por ejemplo `estudiante@ucen.cl`.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `email` | string | `estudiante@ucen.cl` (igual al ID) |
| `name` | string | `Camila Rojas Soto` |

Es el nombre del estudiante en práctica. No se escriben aquí los nombres de
personas de los relatos (AI_GUIDELINES §8).

## Colección `evaluations` (notas y resultados)

Un documento por estudiante. ID: el correo.

| Campo | Tipo | Ejemplo |
|---|---|---|
| `email` | string | `estudiante@ucen.cl` (igual al ID) |
| `updatedAt` | string | `2026-10-12T15:00:00.000Z` |
| `workshops` | map | ver abajo |

Dentro de `workshops` hay un **map** por cada taller evaluado. Los nombres
válidos son `workshop-1`, `workshop-2`, `workshop-3` y `workshop-4`. Un taller
que no aparece se considera sin evaluar.

Cada taller lleva siempre los tres campos:

| Campo | Tipo | Valores |
|---|---|---|
| `grade` | number | de `1` a `7` (usa `null` si aún no hay nota) |
| `outcome` | string | `approved` o `failed` (usa `null` si aún no se marca) |
| `evaluatedAt` | string | fecha ISO 8601, por ejemplo `2026-10-12T15:00:00.000Z` (o `null`) |

Ejemplo de un estudiante con el taller 1 aprobado y el taller 2 reprobado:

```json
{
  "email": "estudiante@ucen.cl",
  "updatedAt": "2026-10-12T15:00:00.000Z",
  "workshops": {
    "workshop-1": { "grade": 6.2, "outcome": "approved", "evaluatedAt": "2026-10-12T15:00:00.000Z" },
    "workshop-2": { "grade": 3.5, "outcome": "failed",   "evaluatedAt": "2026-10-12T15:00:00.000Z" }
  }
}
```

Para escribir `null` en la consola, elige el tipo **null** en el selector de
tipo del campo.

## Situación del estudiante

La situación (**Completado**, **En curso** o **Plazo vencido**) no se carga a
mano: el panel la calcula con las notas, los resultados y los plazos de los
talleres.

## Si cargas `evaluations` a mano

La app escribe en el mismo documento cuando el profesor valida una reflexión,
y las reglas revisan el documento completo. Si un documento cargado a mano
tiene un campo de más o mal escrito, esa validación será rechazada con el
aviso "No se pudo guardar la nota". Ante la duda, borra el documento y deja
que la app lo cree.

Validar una reflexión reemplaza la nota de ese taller, también si la habías
cargado a mano.
