# Doctemia MC - Plataforma Educativa Médica 🩺📚

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)

**Doctemia MC** es un Sistema de Gestión de Aprendizaje (LMS) moderno y completo diseñado para la educación médica. La plataforma ofrece una experiencia dual para administradores y estudiantes, permitiendo la gestión integral de cursos, bancos de preguntas, clases en vivo y seguimiento del progreso del estudiante.

---

## 🚀 Características Principales

### 👨‍⚕️ Portal del Estudiante (`/app`)
Una interfaz intuitiva donde los estudiantes pueden acceder a su material educativo:
*   **Cursos Suscritos**: Acceso a cursos modulares con seguimiento de progreso.
*   **Cursos de Pago Único**: Sección dedicada a cursos adquiridos individualmente.
*   **Banco de Preguntas & Exámenes**: Sistema robusto para realizar simulacros y tests de práctica (`examen-test`).
*   **Clases en Vivo**: Acceso directo a sesiones de streaming educativo.
*   **Perfil de Usuario**: Gestión de información personal y configuración.

### 🛠️ Panel Administrativo (`/admin`)
Herramientas potentes para la gestión del contenido y usuarios:
*   **Gestión de Usuarios**: Crear, editar y administrar permisos y suscripciones de usuarios.
*   **Banco de Preguntas**: Editor completo para crear y organizar preguntas para los exámenes.
*   **Gestión de Cursos**: 
    *   Creación y edición de cursos de suscripción.
    *   Gestión de cursos de "Pago Único".
*   **Clases en Vivo**: Programación y gestión de sesiones en vivo.
*   **Solicitudes**: Administración de solicitudes de acceso y pagos.
*   **Gestión QR**: Herramientas para control mediante códigos QR.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
*   **Estilos**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Backend / Database**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Storage, Admin SDK)
*   **Autenticación**: Firebase Auth + Context API personalizado
*   **Utilidades**: 
    *   `react-player` para reproducción de video.
    *   `lucide-react` y `react-icons` para iconografía.
    *   `qrcode.react` para generación de códigos QR.
    *   `dayjs` para manipulación de fechas.

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura moderna basada en **Next.js App Router**:

```bash
src/
├── app/
│   ├── admin/           # Rutas del Panel Administrativo
│   │   ├── bank-preguntas/
│   │   ├── courses/
│   │   ├── users/
│   │   └── ...
│   ├── api/             # API Routes (Backend serverless)
│   ├── app/             # Rutas del Portal de Estudiante (Protected)
│   │   ├── courses/
│   │   ├── examen-test/
│   │   └── ...
│   ├── login/           # Página de inicio de sesión
│   └── layout.js        # Layout raíz (Providers: Auth, Theme)
├── components/          # Componentes reutilizables (UI, Layouts)
├── context/             # React Contexts (AuthContext, ThemeContext)
├── hooks/               # Custom Hooks (useAuth, useCourseAccess, etc.)
├── lib/                 # Configuraciones (Firebase, DB utils)
└── styles/              # Archivos CSS globales y módulos
```

---

## ⚡ Guía de Instalación

Sigue estos pasos para levantar el proyecto en tu entorno local:

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema-med.git
cd sistema-med
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto y configura tus credenciales de Firebase. Necesitarás tanto las claves públicas (Client SDK) como las privadas (Admin SDK).

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id

# Configuración de Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@admin.com

# Firebase Admin SDK (Service Account)
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=tu_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> **Nota:** Asegúrate de que la `FIREBASE_PRIVATE_KEY` esté correctamente formateada con saltos de línea si la copias directamente.

### 4. Ejecutar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor, sigue estos pasos:

1.  Haz un Fork del proyecto.
2.  Crea tu rama de funcionalidad (`git checkout -b feature/AmazingFeature`).
3.  Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4.  Push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request.

---

## 📄 Licencia

Este proyecto es propiedad privada y está destinado para uso interno o comercial según lo estipulado por los propietarios de **Doctemia MC**.