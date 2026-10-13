# Panel docente: seguimiento de estudiantes (`/docente`)

El panel principal del profesor guía muestra, por estudiante, su avance en el
marco teórico y en los talleres 1 a 4, con resumen, filtros por situación y
tabla (tarjetas en móvil). Lee datos reales de Cloud Firestore.

## De dónde salen los datos

Todo se cruza por el **correo institucional** del estudiante en minúsculas,
que es también el id de cada documento.

| Colección | Qué guarda | Quién escribe | Quién lee |
|---|---|---|---|
| `whitelist/{correo}` | Rol y estado de acceso | Admin | Admin; el docente solo lista `student` |
| `progress/{correo}` | Marco teórico (aprobado, intentos, mejor porcentaje) e intentos y borrador de cada taller. Nunca el texto de los relatos | El propio estudiante, desde la app | El estudiante y los docentes |
| `profiles/{correo}` | Nombre del estudiante | Admin (a mano, desde la consola) | El estudiante, docentes y admin |
| `evaluations/{correo}` | Nota y resultado de cada taller | Docentes (por ahora a mano) | El estudiante y los docentes |

Los campos de cada colección están en [`src/models/studentProgress.ts`](../../src/models/studentProgress.ts),
[`studentProfile.ts`](../../src/models/studentProfile.ts) y
[`studentEvaluation.ts`](../../src/models/studentEvaluation.ts). Cómo cargar
`profiles` y `evaluations` a mano: [`panel-docente-datos.md`](../configuracion/panel-docente-datos.md).

El rol no viene en la sesión de Firebase: las reglas lo leen del documento del
usuario en la `whitelist`, y exigen que esté `active`.

## Cómo llega el avance a Firestore

El borrador, los intentos y la aprobación siguen guardándose en el
`localStorage` del estudiante. `studentProgressService.sync()` lee ese estado,
arma el resumen y lo sube a `progress`.

- Lo llaman `theoryQuizService.submitAttempt` y, en `criticalIncidentService`,
  `saveDraft`, `clearDraft` y `requestImpulse`.
- `useProgressSync` lo llama una vez al abrir la sesión (`StudentLayout`), para
  subir el avance que el estudiante ya tenía.
- No vuelve a escribir si el resumen no cambió: el autoguardado cada 30 s no
  genera una escritura por guardado.
- Si falla (sin red, sin sesión), no interrumpe al estudiante: avisa en la
  consola y reintenta en el siguiente cambio.

## Cómo se calcula lo que se muestra

`teacherDashboardService.fetchDashboard` une los datos y `useTeacherDashboard`
calcula la situación.

- **Marco teórico:** aprobado si `progress` lo indica; reprobado si usó todos
  los intentos sin aprobar; si no, no entregado.
- **Talleres:** manda el `outcome` de `evaluations`. Aprobado con nota de 5.0 o
  más es sobresaliente; aprobado con menos, aprobado; reprobado, reprobado. Si
  solo hay nota, se usa la tabla de notas. Sin evaluación, no entregado.
- **Situación:** plazo vencido (alguna actividad sin entregar con plazo
  pasado), completado (las 5 actividades aprobadas) o en curso.
- Un estudiante sin `progress`, `profiles` o `evaluations` aparece igual, con
  sus actividades sin entregar y, sin perfil, como "Sin nombre registrado".
- Un campo mal escrito en un documento cargado a mano se ignora, no rompe el panel.

## Para que funcione

1. Publicar las reglas actuales de [`firestore.rules`](../../firestore.rules)
   en Firebase Console (Firestore Database → Reglas).
2. La cuenta docente debe estar en la whitelist con rol `teacher` y estado `active`.
3. Los estudiantes deben estar en la whitelist con rol `student`.

## Pendientes y limitaciones

| Tema | Detalle |
|---|---|
| Plazos e intentos máximos | El panel usa los valores fijos de los talleres, no la configuración de `/docente/plazos`. Depende de conectar HU-06 (ver [`HU06_GUIA.md`](./HU06_GUIA.md), "Modificaciones futuras"). Los plazos actuales (15, 22 y 29 de octubre, 5 de noviembre) hacen que nadie figure vencido antes del 16 de octubre |
| Notas y resultados | Se cargan a mano en `evaluations`. La pantalla de reflexiones debería marcar completado y poner la nota; cuando exista, hay que ajustar la colección, el modelo, la lectura del panel y las reglas |
| Límite aprobado / sobresaliente | `AI_GUIDELINES` §4 pone el 5.0 en ambos rangos. Se decidió provisoriamente que 5.0 es sobresaliente (`GRADE_THRESHOLDS.excellent`). Confirmar con la cliente. Tampoco hay estado definido para notas entre 3.9 y 4.0 |
| Nombre del estudiante | Vive en `profiles`, cargado a mano. Su lugar definitivo sería la gestión de la whitelist (HU-01) |
| Seguridad del "aprobado" | El cuestionario se corrige en el navegador, así que un estudiante con conocimientos técnicos podría falsear su aprobación. Resolverlo requiere corregir en un servidor (por ejemplo, Cloud Functions) |
| Varios navegadores | El avance se arma desde el `localStorage` de cada navegador: si el estudiante usa dos, gana el último que escribió |
| Claves duplicadas | `studentProgressService` repite las claves de almacenamiento de HU-03 y HU-04 para no crear un círculo de importaciones. Si cambian allá, hay que cambiarlas también aquí |
| Todos los docentes ven a todos | No hay secciones ni asignación de profesor guía |
| `StatCard` copiada | Está en tres features (whitelist, work-pacing, teacher-dashboard); moverla a `src/components/` (regla R2) cuando el equipo lo acuerde |
| Lectura completa | El panel lee las colecciones enteras; con muchos estudiantes habría que paginar o consultar por lotes |
