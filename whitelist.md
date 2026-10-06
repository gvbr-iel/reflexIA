# Whitelist inicial de ReflexIA

Esta guía define los registros base para habilitar un usuario por rol en una
instalación de demostración. **No crea cuentas en Firebase ni representa
usuarios ya provisionados.** Los correos son los ejemplos usados por
`HU08_GUIA.md`; antes de utilizarlos, el equipo debe confirmar que son cuentas
institucionales controladas y autorizadas. En producción, reemplázalos por los
correos reales aprobados.

## Usuarios base

| Usuario de referencia | Correo de ejemplo | Rol Firestore | Acceso |
|---|---|---|---|
| Estudiante | `alumno@ucen.cl` | `student` | `/estudiante` |
| Profesor guía | `docente@ucen.cl` | `teacher` | `/docente` |
| Administrador | `admin@ucen.cl` | `admin` | `/admin/whitelist` |

Los tres correos cumplen el dominio `@ucen.cl` exigido por RNF-02. `admin@ucen.cl`
es además la identidad administrativa reconocida explícitamente por
`firestore.rules`; crea y verifica esta cuenta primero.

## Credenciales

Las contraseñas **no se generan ni se guardan en este archivo, Firestore, el
código fuente ni Git**. Para cada correo que el equipo haya confirmado:

1. Crea el usuario en **Firebase Console → Authentication → Users → Add user**.
2. Asigna una contraseña única y aleatoria de acuerdo con la política vigente
   del proyecto Firebase; no reutilices contraseñas personales o institucionales.
3. Entrega la contraseña al titular por un canal seguro y solicita que la cambie
   cuando corresponda.

La cuenta de Firebase Authentication y el documento activo de la whitelist son
ambos necesarios para iniciar sesión. Añadir un correo a la whitelist no crea
sus credenciales de Authentication.

## Registros de Cloud Firestore

En **Firestore Database → colección `whitelist`**, crea un documento por cada
cuenta. Usa el correo normalizado en minúsculas como ID y estos campos:

```json
{
  "email": "alumno@ucen.cl",
  "role": "student",
  "status": "active",
  "addedAt": "2026-10-06T13:38:00.000Z",
  "revokedAt": null
}
```

Repite el documento para los otros dos usuarios, sustituyendo `email` y `role`
por los valores de la tabla. `addedAt` debe ser una fecha de alta actual en
formato ISO 8601; el valor del ejemplo no debe reutilizarse como fecha real de
provisión.

Los campos y roles deben respetar el contrato de
[`src/models/whitelist.ts`](./src/models/whitelist.ts) y las validaciones de
[`firestore.rules`](./firestore.rules). No agregues contraseñas ni otros datos
personales a los documentos.

## Comprobación desde la vista de administración

1. Inicia sesión con `admin@ucen.cl` después de crear su cuenta de Authentication
   y su documento activo de whitelist.
2. Abre `/admin/whitelist`. La vista debe mostrar los registros y sus roles.
3. Comprueba que cada correo use `@ucen.cl`, esté `active` y tenga el rol
   esperado. La revocación debe impedir el siguiente acceso del usuario.
4. Crea cuentas adicionales desde **Autorizar correo** o importa correos desde
   **Carga masiva**. Esta última asigna un solo rol por importación; realiza una
   carga separada para cada rol.

La vista no debe mostrar credenciales. Las contraseñas se administran en Firebase
Authentication y se comunican fuera del repositorio.
