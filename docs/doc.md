# 🩺 Documentación Técnica: Sistema DOCTEMIA MC

## 1. Descripción General
**DOCTEMIA MC** es una plataforma avanzada de aprendizaje médico diseñada para la preparación de exámenes de grado y formación continua. El sistema utiliza un modelo de **acceso controlado por administración**, donde los usuarios solicitan inscripciones y el administrador gestiona los permisos de forma centralizada.

## 2. Stack Tecnológico
- **Framework:** Next.js (App Router) + React 19.
- **Estilos:** Tailwind CSS (v4) con soporte para temas dinámicos (Dark/Light).
- **Backend:** Firebase (Firestore como base de datos NoSQL y Firebase Auth para gestión de identidad).
- **Estado Global:** React Context API (`AuthContext` y `ThemeContext`).
- **Seguridad:** Middleware nativo de Next.js para control de acceso y componentes personalizados para protección de contenido multimedia.

---

## 3. Arquitectura del Sistema

### 🛡️ Middleware y Control de Acceso (`src/middleware.js`)
El sistema implementa una capa de seguridad a nivel de red que intercepta cada solicitud:
- **Validación de Sesión:** Verifica la existencia de la cookie `__session`.
- **Rutas Protegidas:** 
    - `/admin/**`: Solo accesible para usuarios con el rol `admin`.
    - `/app/**`: Solo accesible para usuarios autenticados.
- **Redirección Inteligente:** Si un usuario logueado intenta acceder a `/login`, el middleware lo redirige automáticamente a su panel correspondiente (`/admin` o `/app`) según su rol.

### 👨‍💼 Módulo Administrativo (`src/app/admin`)
El "Cerebro" del sistema, diseñado para la gestión integral:
- **Gestión de Solicitudes:** Centraliza las peticiones de los usuarios en dos categorías:
    1. **Inscripción a Cursos:** Al confirmar el pago, el curso se vincula permanentemente al perfil del usuario.
    2. **Acceso a Exámenes:** Habilita el módulo de tests interactivos para el estudiante.
- **Banco de Preguntas:** Interfaz para la creación de exámenes con lógica de validación y almacenamiento en Firestore.
- **Control de Usuarios:** CRUD completo de estudiantes, permitiendo activar o suspender cuentas instantáneamente.
- **Clases en Vivo:** Gestión de enlaces y horarios para sesiones sincrónicas.

### 🎓 Módulo de Usuario (`src/app/app`)
Una interfaz inmersiva y moderna centrada en el estudiante:
- **Dashboard Dinámico:** Presenta un entorno visual con video de fondo, clima local sincronizado (Open-Meteo API) y accesos rápidos.
- **Visualizador de Contenido:** Acceso a cursos adquiridos, exámenes de práctica y clases en vivo.
- **Flujo de Solicitud:** Los usuarios pueden explorar cursos y solicitar acceso, lo que dispara una notificación en el panel de administración.

---

## 4. Seguridad y Protección de Contenido (Core del Proyecto)

Uno de los pilares fundamentales de DOCTEMIA MC es la **protección de la propiedad intelectual**. Se ha implementado un componente crítico: `ProtectedVideoPlayer.jsx`.

### 🛡️ Mecanismos de Blindaje:
1. **Bloqueo de Inspección:**
    - Deshabilitación total del menú contextual (clic derecho).
    - Bloqueo de atajos de teclado de desarrollo: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`.
    - Bloqueo de visualización de código fuente: `Ctrl+U`.
2. **Prevención de Descargas y Copias:**
    - Bloqueo de comandos de guardado e impresión: `Ctrl+S`, `Ctrl+P`.
    - Deshabilitación de selección de texto y arrastre de elementos.
3. **Detección de Developer Tools:**
    - El sistema monitorea constantemente las dimensiones de la ventana. Si detecta que las herramientas de desarrollo se han abierto, el reproductor se bloquea y muestra una advertencia de seguridad.
4. **Ofuscación de Reproductor (Anti-YouTube Direct Access):**
    - Se utiliza una **capa invisible (overlay)** sobre el video. Esto impide que el usuario pueda hacer clic derecho sobre el reproductor de YouTube para obtener la URL del video o copiar el código de inserción.
    - Configuración estricta de la API de YouTube: `controls: 0`, `modestbranding: 1`, `disablekb: 1`, `rel: 0`.

---

## 5. Estructura de Datos (Firestore)
- **`users`**: Almacena el perfil, rol, estado y los registros de acceso (`cursosPagados`, `hasExamenTestAccess`).
- **`courses` / `Cursos_Pago_Unico`**: Contiene la metadata de las clases, videos y materiales.
- **`solicitudes` / `examenTest_solicitudes`**: Buffer temporal donde llegan las peticiones de los usuarios para ser procesadas por el admin.
- **`questionBank`**: Almacena las preguntas y respuestas para los simulacros de examen.
