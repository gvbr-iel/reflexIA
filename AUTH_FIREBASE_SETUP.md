# Configuración de autenticación Firebase

El acceso de estudiantes utiliza Firebase Authentication (correo y contraseña)
y Cloud Firestore (whitelist). No hay registro público ni se solicitan o guardan
RUT u otros identificadores sensibles.

## 1. Configurar Firebase

1. Crea o selecciona un proyecto en Firebase Console y registra una aplicación
   web.
2. En **Authentication → Sign-in method**, habilita **Email/Password**.
3. Crea la base de datos de Cloud Firestore.
4. Copia `.env.example` a `.env` y completa las seis variables
   `VITE_FIREBASE_*` con la configuración de la aplicación web. Son valores de
   identificación del cliente, no claves privadas. No publiques secretos de
   cuentas de servicio ni los incluyas en variables `VITE_*`.
5. Reinicia el servidor de desarrollo después de editar `.env`.

Sin configuración Firebase, la aplicación no permite iniciar sesión. La
landing page y el build continúan disponibles.

## 2. Publicar las reglas de Firestore

Publica el contenido de [`firestore.rules`](./firestore.rules) en **Firestore
Database → Rules**. También puedes desplegarlo con Firebase CLI, una vez
seleccionado el proyecto:

```bash
firebase deploy --only firestore:rules
```

Las reglas permiten a una persona autenticada consultar únicamente el documento
de su propio correo. Solo usuarios con el custom claim `admin: true` pueden
listar, crear, actualizar o eliminar entradas. No abras la lectura o escritura
de esta colección a usuarios sin autenticar.

El claim administrativo debe asignarse desde un entorno confiable con Firebase
Admin SDK; nunca se debe asignar desde el navegador. La vista `/admin/whitelist`
necesita ese claim para administrar la colección. Esta entrega no incluye una
pantalla de inicio de sesión ni asignación de claims para administradores; hasta
que se implemente ese flujo, administra la whitelist desde Firebase Console o
desde una herramienta interna confiable.

## 3. Crear el usuario y autorizarlo

El alta de cuentas y contraseñas se realiza desde Firebase Console o desde un
proceso de administración confiable. Para cada estudiante:

1. Crea su cuenta en **Authentication → Users** con el correo `@ucen.cl` y
   establece su contraseña mediante un canal seguro.
2. En Firestore, crea un documento en la colección `whitelist`. El ID del
   documento debe ser el correo institucional normalizado (minúsculas y sin
   espacios), por ejemplo `estudiante@ucen.cl`.
3. Usa esta estructura:

```json
{
  "email": "estudiante@ucen.cl",
  "role": "student",
  "status": "active",
  "addedAt": "2026-10-04T12:00:00.000Z",
  "revokedAt": null
}
```

El dominio se valida en el formulario y el correo debe existir como usuario de
Firebase Authentication y como entrada activa en Firestore. Aunque una cuenta
Firebase sea válida, la app deniega el acceso si falta la autorización, está
revocada o su rol no es `student`. Los fallos de credenciales y autorización se
muestran con un mensaje genérico.

Para revocar el acceso, cambia `status` a `revoked` en Firestore. Las reglas
permiten que el estudiante consulte su propio registro, pero no que lo cambie;
el siguiente control de acceso lo devolverá a la pantalla de inicio de sesión.

## 4. Datos de talleres y alcance de privacidad

El estado de autenticación y la lista de autorización se verifican con Firebase.
Los borradores, intentos y resultados de los talleres continúan siendo un mock
local de `localStorage`; sus claves se separan por UID de Firebase para evitar
que cuentas distintas en el mismo navegador compartan esos datos. No se sube el
contenido de las reflexiones a Firestore mediante este cambio. El almacenamiento
local del navegador no equivale a almacenamiento cifrado ni a una solución de
respaldo; cualquier persistencia remota futura requiere definir controles de
acceso y retención para esos textos.

## 5. Validación local

```bash
npm install
npm run dev
npm run build
```

El build valida TypeScript y genera la aplicación, pero la autenticación real
requiere un proyecto Firebase configurado, usuarios creados, documentos de
whitelist y reglas publicadas.
