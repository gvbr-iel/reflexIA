# Guía de desarrollo — HU-01: Gestión de la Whitelist de Correos Autorizados

## Descripción general

Este módulo implementa la **gestión de la whitelist** (lista de correos institucionales autorizados) para el rol **Administrador** (coordinador o profesor guía con perfil administrativo), en la ruta `/admin/whitelist` (RF-01, RNF-02).

> **Historia de usuario.** Como Administrador, quiero gestionar de forma autónoma la lista de correos institucionales autorizados mediante cargas masivas, revisión de estado y revocación de accesos, para controlar de manera eficiente y segura qué usuarios tienen acceso al sistema.

El administrador puede:

- Ver un **resumen de 5 métricas** de accesos activos, revocados y distribución por perfil (estudiantes, profesores guía y administradores).
- **Buscar** correos por texto y **filtrar** por estado (activo/revocado) y perfil (`student`, `teacher`, `admin`).
- **Autorizar** un correo individual especificando su perfil.
- Hacer una **carga masiva** desde un archivo CSV/TXT o pegando una lista, con **vista previa** en tiempo real antes de confirmar.
- **Revocar** un acceso de forma inmediata y **restablecerlo** cuando sea necesario.

Criterios de aceptación y dónde se cumplen:

| Criterio | Dónde |
|---|---|
| La autenticación se restringe a correos con dominio `@ucen.cl` | `utils/institutionalEmail.ts` (`validateInstitutionalEmail`), usado al autorizar, en la carga masiva y en `whitelistService.checkAccess` |
| El correo debe estar registrado previamente en la whitelist | `whitelistService.checkAccess` y reglas de Firestore (`firestore.rules`) |
| El acceso se parametriza por perfiles institucionales | `models/whitelist.ts` (`WHITELIST_ROLES = ['student', 'teacher', 'admin']`) y `RoleSelector` |
| El administrador puede hacer cargas masivas y revocar accesos de inmediato | `UploadModal` + `useBulkUpload` + `whitelistService.importEntries`; `RevokeAccessModal` + `whitelistService.revokeAccess` |
| Persistencia real y segura | `services/whitelistService.ts` conectado directamente a la colección `whitelist` de **Cloud Firestore** |

---

### Ubicación en el código

```text
src/
├── models/
│   └── whitelist.ts                 # Tipos, perfiles ('student' | 'teacher' | 'admin'), estados y métricas
├── services/
│   ├── firebase.ts                  # Inicialización y configuración pública de Firebase
│   └── whitelistService.ts          # Integración directa con Cloud Firestore + listeners reactivos
├── utils/
│   └── institutionalEmail.ts        # Normaliza y valida correos @ucen.cl (compartido con RF-08)
├── components/
│   └── Modal.tsx                    # Diálogos modales globales (renderizados en portal sobre <body>)
├── layouts/
│   └── AdminLayout.tsx              # Cabecera con usuario activo y menú lateral de navegación
└── views/
    └── admin-whitelist/
        ├── WhiteListView.tsx                # Vista principal del panel
        ├── hooks/
        │   ├── useWhitelist.ts              # Consulta, filtros reactivos, resumen, altas y revocaciones
        │   └── useBulkUpload.ts             # Lectura de archivo/texto y vista previa de carga masiva
        └── components/
            ├── WhitelistStats.tsx           # 5 tarjetas de resumen con indicadores de carga
            ├── FilterBar.tsx                # Búsqueda textual y selectores de estado y perfil
            ├── WhitelistTable.tsx           # Tabla responsiva (tarjetas en móvil) con acciones
            ├── ActionNotice.tsx             # Alerta visual flotante de confirmación de acción
            ├── AddEmailModal.tsx            # Formulario modal de alta individual
            ├── UploadModal.tsx              # Modal de carga masiva con bloqueo preventivo ante errores
            ├── RevokeAccessModal.tsx        # Confirmación de revocación
            ├── RoleSelector.tsx             # Selector de perfil con iconos semánticos
            └── fieldStyles.ts               # Clases visuales compartidas
```

---

## Funcionalidades

### Resumen de métricas

Cinco tarjetas en la parte superior (adaptables desde 2 columnas en móvil hasta 5 columnas en escritorio `xl:grid-cols-5`):

| Tarjeta | Icono | Qué cuenta |
|---|---|---|
| Accesos activos | `CheckCircle2` | Total de correos con estado activo sobre el total registrado |
| Estudiantes | `GraduationCap` | Estudiantes con acceso **activo** |
| Profesores guía | `Presentation` | Profesores guía con acceso **activo** |
| Administradores | `ShieldCheck` | Administradores con acceso **activo** |
| Accesos revocados | `UserX` | Correos con acceso revocado (pueden reactivarse) |

### Búsqueda y filtros

- **Buscar correo:** Búsqueda en tiempo real por coincidencia parcial, insensible a mayúsculas.
- **Estado:** Todos, Activos o Revocados.
- **Perfil:** Todos, Estudiantes, Profesores guía o Administradores.
- Contador dinámico: Muestra cuántos correos coinciden con los criterios aplicados y botón para **Limpiar filtros**.

### Tabla y gestión de accesos

Columnas: **Correo**, **Perfil**, **Estado**, **Fecha de alta** y **Acciones**.
- En escritorio se renderiza como tabla de alta densidad; en móvil cambia automáticamente a vista de tarjetas accesibles.
- Cada rol cuenta con su distintivo visual e icono institucional (`ShieldCheck` para Admin, `Presentation` para Docente, `GraduationCap` para Estudiante).
- **Revocación:** Solicita confirmación modal. El cambio se persiste de inmediato en Firestore y, gracias al listener `watchAccess`, la sesión activa del usuario revocado se cierra en el acto.
- **Restablecimiento:** Acción en un clic que vuelve el estado a activo.

### Autorización individual y Carga masiva

- **Alta individual:** Valida formato institucional `@ucen.cl`. Si el correo ya existía como revocado, lo reactiva con el perfil seleccionado.
- **Carga masiva (CSV/TXT o texto copiado):**
  1. Selección de perfil de destino.
  2. Carga de archivo o pegado directo con opción de descargar la plantilla oficial (`plantilla-whitelist.csv`).
  3. Vista previa exhaustiva línea por línea clasificando cada entrada (`new`, `reactivate`, `existing`, `duplicate`, `invalid-format`, `invalid-domain`).
  4. **Bloqueo preventivo:** Si existe una sola línea con error de formato o dominio externo, el botón de importación se desactiva y se detalla el listado de líneas erróneas para que el administrador las corrija.

---

## Arquitectura de Datos y Cloud Firestore

A diferencia de versiones preliminares basadas en almacenamiento local, la whitelist está integrada con **Cloud Firestore** en la colección `whitelist`.

### Estructura del documento (`whitelist/{email}`)

```json
{
  "email": "usuario@ucen.cl",
  "role": "student",
  "status": "active",
  "addedAt": "2026-10-05T12:00:00.000Z",
  "revokedAt": null
}
```

- **ID del documento:** Correo electrónico en minúsculas y sin espacios.
- **Seguridad en Firestore (`firestore.rules`):**
  - Solo los usuarios administradores (o con claim `admin: true` o con correo `admin@ucen.cl`) tienen permisos de escritura y lectura de la colección completa.
  - Los estudiantes y profesores normales solo tienen permiso para leer su propio documento (`whitelist/{su_correo}`) para validar su acceso.

---

## Integración con HU-08 (Inicio de Sesión)

La whitelist constituye la fuente de verdad de la autorización de acceso para la aplicación:
1. El usuario ingresa sus credenciales en `/iniciar-sesion`.
2. Firebase Authentication valida usuario y contraseña.
3. El servicio consulta `whitelistService.checkAccess(email)`:
   - Si no figura en Firestore → Acceso denegado (`not-registered`).
   - Si figura con `status: "revoked"` → Acceso denegado (`revoked`).
   - Si figura con `status: "active"` → Acceso permitido; se extrae su `role` y se redirige a `/estudiante`, `/docente` o `/admin`.
4. Mediante `whitelistService.watchAccess`, cualquier cambio de estado en la base de datos se refleja de inmediato en el cliente.
