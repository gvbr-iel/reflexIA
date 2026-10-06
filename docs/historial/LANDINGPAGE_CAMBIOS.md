# Cambios realizados: landing page de ReflexIA

## Objetivo

Construir una página descriptiva para presentar ReflexIA, el ciclo de reflexión
profesional docente y los perfiles a los que se dirige el proyecto.

## Cambios incluidos

- Se agregó una página de inicio adaptable a móviles, tabletas y escritorio,
  construida con React, TypeScript, Tailwind y los tokens visuales existentes.
- Se incorporaron secciones sobre el propósito del proyecto, las etapas del
  ciclo reflexivo, sus principios y los perfiles de estudiante y profesor guía.
- Se añadieron enlaces hacia las vistas existentes de estudiante (`/estudiante`)
  y docente (`/docente`). No se presenta un flujo de inicio de sesión, ya que
  todavía no está implementado.
- Se configuró la ruta `/` para mostrar la landing y el fallback de rutas
  desconocidas para regresar a ella.
- Se actualizó el mapa de rutas del [`README.md`](../../README.md).
- El contenido distingue el propósito del proyecto de las funciones de un
  prototipo que aún pueden estar en desarrollo o demostración.

## Archivos modificados

- [`src/views/landingpage/LandingPage.tsx`](../../src/views/landingpage/LandingPage.tsx)
- [`src/App.tsx`](../../src/App.tsx)
- [`README.md`](../../README.md)

## Validación

- Verificación TypeScript y compilación de producción con `npm run build`.
