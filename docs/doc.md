# Documentación de Correcciones y Mejoras Técnicas

Este documento detalla las modificaciones realizadas para resolver los errores 500 en el entorno de producción (Vercel) y mejorar la estabilidad de la conexión con la base de datos Firebase.

## 1. Problema Identificado
Se reportaron errores `500 (Internal Server Error)` en las rutas `/api/login` y `/api/users` al estar desplegado en Vercel. Esto impedía el inicio de sesión y la visualización de usuarios en el sistema.

### Causas principales:
- **SDK Incompatible**: Se utilizaba la sintaxis antigua de `firebase-admin`, que presentaba problemas de inicialización en entornos ESM (Next.js 15).
- **Conflicto de Rutas**: Existía un archivo `src/app/api/login.js` que colisionaba con el directorio `src/app/api/login/route.js`, causando ambigüedad en el enrutamiento de Next.js.
- **Gestión de Claves Privadas**: La clave privada de Firebase en las variables de entorno de Vercel a menudo requiere un tratamiento específico para los saltos de línea (`\n`).
- **Falta de Validación**: Las rutas API intentaban usar la base de datos sin verificar si la inicialización de Firebase Admin había sido exitosa.

---

## 2. Cambios Realizados

### A. Modernización de `src/lib/firebase-admin.js`
Se refactorizó completamente la inicialización de Firebase Admin:
- **SDK Modular**: Migración a `firebase-admin/app`, `firebase-admin/auth` y `firebase-admin/firestore`.
- **Detección de Entorno**: El código ahora prioriza las variables de entorno (Vercel) y mantiene un fallback seguro para el archivo `serviceAccountKey.json` en desarrollo local.
- **Tratamiento de Clave Privada**: Se implementó una limpieza robusta para la `FIREBASE_PRIVATE_KEY`:
  ```javascript
  privateKey: privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '')
  ```
  Esto corrige el error común donde las comillas o los caracteres de escape rompen la clave.

### B. Limpieza de Rutas API
- **Eliminación de `src/app/api/login.js`**: Se eliminó este archivo para seguir estrictamente la convención de `route.js` del App Router de Next.js y evitar el error de "Duplicate API route".

### G. Corrección del Error de Logout
Tras la actualización a Next.js 16, se detectó un error al cerrar sesión (`Failed to logout`).
- **Causa**: En las versiones más recientes de Next.js, la función `cookies()` de `next/headers` es asíncrona y debe ser esperada (`await`).
- **Solución**: Se actualizó `/api/logout/route.js` para usar `await cookies()`, permitiendo que las cookies de sesión se eliminen correctamente sin colapsar el servidor.

### H. Robustez en la Creación de Usuarios
Se corrigió un error recurrente donde el sistema reportaba que un correo electrónico ya estaba en uso, a pesar de no figurar en la base de datos (Firestore).
- **Causa**: "Usuarios fantasma" creados en Firebase Authentication pero con fallos previos en la escritura de Firestore.
- **Solución en API (`/api/create-user`)**:
    *   **Manejo de Duplicados**: Si el usuario ya existe en Auth, el sistema ahora lo recupera (`getUserByEmail`) y procede a completar su registro en Firestore en lugar de lanzar un error 500.
    *   **Normalización**: Se implementó la limpieza automática de espacios y conversión a minúsculas para los correos electrónicos.
- **Mejoras en Frontend (`admin/users/create` y `register`)**:
    *   **Limpieza de Datos**: Se añadió `.trim()` al campo de correo antes de enviarlo.
    *   **Validación de Contraseña**: Se incluyó una verificación de longitud mínima (6 caracteres) para cumplir con los requisitos de Firebase y evitar errores silenciosos del servidor.

---

## 3. Instrucciones de Configuración en Vercel

Para que estos cambios funcionen correctamente, es obligatorio configurar las siguientes variables en el panel de Vercel (**Settings > Environment Variables**):

| Variable | Descripción |
| :--- | :--- |
| `FIREBASE_PROJECT_ID` | ID de tu proyecto en Firebase. |
| `FIREBASE_CLIENT_EMAIL` | Email de la cuenta de servicio (service account). |
| `FIREBASE_PRIVATE_KEY` | La clave privada completa, incluyendo los encabezados de BEGIN/END. |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Email definido para el rol de administrador. |

> **Nota sobre la Clave Privada**: Al pegar la clave en Vercel, no es necesario añadir comillas manuales; el código se encarga de procesar los saltos de línea.

---

## 4. Validación
- Se ejecutó `npm run lint` para asegurar la integridad sintáctica del proyecto.
- Se verificó que el Middleware no bloquee las nuevas validaciones de las rutas API.
- Se mantuvo la compatibilidad con el sistema de temas (Dark Mode) y las alertas de SweetAlert2 en el frontend.
