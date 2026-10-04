# HU-08: Inicio de sesión institucional con Firebase

## Historia de usuario

**Como** estudiante de Práctica Profesional,  
**quiero** iniciar sesión de forma segura con mi correo institucional y
contraseña,  
**para** acceder individualmente a mis talleres y resguardar la privacidad de
mis datos personales, sin usar identificadores sensibles como el RUT.

## Criterios de aceptación

1. El formulario solicita correo institucional `@ucen.cl` y contraseña.
2. Firebase Authentication valida las credenciales. Cloud Firestore verifica
   que el correo tenga una entrada de whitelist activa y el rol `student`.
3. No se solicita ni almacena RUT.
4. El inicio de sesión exitoso lleva al panel `/estudiante`; las rutas
   `/estudiante/*` están protegidas por sesión y autorización.
5. Los errores de credenciales y whitelist se presentan con un mensaje genérico
   para no revelar si una cuenta está registrada. Los errores de conexión o
   configuración informan que no se pudo validar el acceso.

## Recorrido de autenticación

1. El estudiante abre `/iniciar-sesion` y envía su correo y contraseña a
   Firebase Authentication.
2. La aplicación valida el dominio institucional y consulta en Firestore el
   documento de la whitelist identificado por el correo normalizado.
3. Solo continúa si el documento existe, tiene `status: "active"` y
   `role: "student"`. Si el registro no autoriza el acceso, se cierra la sesión.
4. `AuthContext` mantiene el estado de sesión. `RequireStudent` protege las
   rutas del estudiante y redirige a `/iniciar-sesion` cuando no hay una sesión
   autorizada.
5. La autorización se observa en tiempo real. Al revocar el acceso en Firestore,
   la aplicación cierra la sesión del estudiante.
6. El botón **Salir** cierra la sesión de Firebase.

Las rutas de administración y docente no forman parte del flujo de autenticación
estudiantil de esta historia. La whitelist Firestore exige el custom claim
`admin: true` para leer la lista o administrarla. No se implementó un login
administrativo ni la asignación de ese claim desde la aplicación. Hasta definir
ese flujo, una persona administradora debe gestionar la whitelist desde Firebase
Console o una herramienta interna confiable.

## Arquitectura y archivos

- `src/services/firebase.ts`: inicialización del cliente Firebase desde
  variables de entorno.
- `src/services/authService.ts`: inicio/cierre de sesión y traducción de
  credenciales o autorización a errores de dominio.
- `src/services/whitelistService.ts`: altas, importación, listado, revocación y
  verificación en Cloud Firestore.
- `src/context/AuthContext.tsx` y `src/hooks/useAuth.ts`: estado de sesión para
  la aplicación.
- `src/components/RequireStudent.tsx`: guardia para las rutas de estudiante.
- `src/views/auth/LoginView.tsx`: formulario accesible de correo y contraseña.
- `src/utils/institutionalEmail.ts`: validación compartida del dominio
  institucional.
- `src/utils/userStorage.ts`: separa las claves locales de talleres por UID.
- `firestore.rules`: reglas de acceso y validación de documentos de whitelist.

La whitelist ya no usa `localStorage`. En cambio, los borradores, intentos y
resultados de talleres siguen siendo un mock local. Sus claves se particionan
por UID para que distintas cuentas en un mismo navegador no compartan esos
datos. El contenido de las reflexiones no se sincroniza con Firestore en esta
historia; el almacenamiento local no equivale a cifrado ni a respaldo remoto.

## Configuración de Firebase

1. Crea o selecciona un proyecto en Firebase Console y registra una aplicación
   web.
2. En **Authentication → Sign-in method**, habilita **Email/Password**.
3. Crea la base de datos de Cloud Firestore.
4. Copia `.env.example` a `.env` y completa estas variables con los valores de
   configuración de la aplicación web:

   ```dotenv
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```

   Son valores de configuración del cliente, no claves privadas. No agregues
   secretos de cuentas de servicio ni credenciales de Firebase Admin SDK al
   frontend o a variables `VITE_*`. Reinicia Vite después de modificar `.env`.
5. Publica el contenido de [`firestore.rules`](./firestore.rules) desde
   **Firestore Database → Rules**, o despliega las reglas con Firebase CLI
   después de seleccionar el proyecto:

   ```bash
   firebase deploy --only firestore:rules
   ```

Las reglas permiten que un estudiante autenticado consulte solo su propio
documento de whitelist. Solo una cuenta cuyo token incluya el custom claim
`admin: true` puede listar o administrar otros documentos. El claim debe
asignarse mediante Firebase Admin SDK desde un entorno confiable, nunca desde el
navegador.

Sin la configuración de Firebase, la aplicación falla cerrada: el inicio de
sesión no está disponible y las rutas protegidas no muestran el contenido.

## Alta y autorización de estudiantes

No hay registro público en la aplicación. Para habilitar a un estudiante:

1. Crea su cuenta en **Authentication → Users** con su correo `@ucen.cl` y
   define o comunica su contraseña mediante un canal seguro.
2. En Firestore, crea un documento en la colección `whitelist`. El ID debe ser
   el correo normalizado (minúsculas y sin espacios), por ejemplo
   `estudiante@ucen.cl`.
3. Usa los campos siguientes:

   ```json
   {
     "email": "estudiante@ucen.cl",
     "role": "student",
     "status": "active",
     "addedAt": "2026-10-04T12:00:00.000Z",
     "revokedAt": null
   }
   ```

Para revocar acceso, cambia `status` a `"revoked"`. El estudiante no puede
modificar su propio documento; el cambio es detectado por la sesión activa y se
le solicita iniciar sesión nuevamente. No se debe agregar RUT ni otro
identificador personal a este documento.

## Verificación local

```bash
npm install
npm run dev
npm run build
```

El build comprueba TypeScript y genera la aplicación; no demuestra autenticación
real. Para probar el flujo hacen falta un proyecto Firebase, las variables
configuradas, las reglas publicadas, una cuenta Authentication y su documento
activo en la whitelist. En pantallas estrechas, el formulario debe permanecer
utilizable desde 360 px. Sin configuración se comprobó que el acceso deniegue
las rutas protegidas.
