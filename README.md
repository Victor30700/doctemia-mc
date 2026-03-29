# 🩺 Doctemia MC - Plataforma Educativa Médica Premium

![Next.js 15](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)
![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Algorithm](https://img.shields.io/badge/Algorithm-SM--2%20Spaced%20Repetition-blueviolet?style=for-the-badge)

**Doctemia MC** es un ecosistema de aprendizaje de alto rendimiento (LMS + SaaS) diseñado específicamente para la formación médica avanzada. Combina la flexibilidad de un LMS moderno con herramientas de neurociencia cognitiva para maximizar la retención de conocimientos a largo plazo.

---

## 🌟 Módulo Destacado: Flashcards Premium (Fase 4)

El corazón de la plataforma es su sistema de **Repetición Espaciada (Spaced Repetition)**, transformando el estudio pasivo en un entrenamiento activo de precisión quirúrgica.

*   **🧠 Algoritmo SM-2 Refinado**: Motor de cálculo dinámico con escala Likert de 5 puntos para programar revisiones óptimas.
*   **⚡ Active Recall Mental**: Interfaz diseñada para el recuerdo activo sin distracciones, eliminando la fricción de escritura.
*   **🧩 Tipos de Tarjetas Avanzadas**: Soporte para preguntas estándar, **Cloze Deletion** (completar espacios), casos clínicos complejos e integración de imágenes mediante Google Drive.
*   **📊 Radiografía de Tarjeta**: Analíticas individuales en tiempo real con % de dominio, historial de aciertos/fallos y cronología de estudio.

---

## 🚀 Características Principales

### 👨‍⚕️ Portal del Estudiante (`/app`)
*   **Dashboard Inteligente**: Visualización de métricas de progreso, tarjetas pendientes hoy y áreas críticas de estudio.
*   **Modos de Estudio Flexibles**:
    *   **Estándar**: Sigue el ritmo del algoritmo.
    *   **Intensivo**: Repaso total por subtemas.
    *   **Refuerzo**: Enfoque exclusivo en debilidades activas.
*   **Cursos & Simulacros**: Acceso a videoclases, material descargable y simulacros de examen cronometrados.
*   **Modo Oscuro Nativo**: Interfaz optimizada para largas sesiones de estudio nocturno.

### 🛠️ Panel Administrativo (`/admin`)
*   **Gestión Atómica de Contenido**: Control total sobre cursos, categorías y bancos de preguntas.
*   **Administración de Flashcards**: Editor enriquecido con previsualización en tiempo real y categorización por etiquetas.
*   **🛡️ Borrado Masivo Protegido**: Sistema de gestión múltiple con verificación de identidad para asegurar la integridad de la base de datos.
*   **Control de Suscripciones**: Gestión de accesos, pagos únicos y validación mediante códigos QR.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, Next.js 15 (App Router), Tailwind CSS 4 |
| **Backend** | Firebase Admin SDK, Node.js |
| **Base de Datos** | Firestore (NoSQL) con contadores atómicos `increment()` |
| **Autenticación** | Firebase Auth (RBAC - Role Based Access Control) |
| **Multimedia** | Google Drive API (driveUtils), React Player |
| **UX/UI** | Lucide React, SweetAlert2, Framer Motion |

---

## 📂 Estructura del Ecosistema

```bash
src/
├── app/
│   ├── admin/           # Gestión y Administración (Flashcards, Users, Courses)
│   ├── app/             # Experiencia del Estudiante (Dashboard, Estudio, Exámenes)
│   ├── api/             # Endpoints Serverless (Auth, Suscripciones, Deletes)
│   └── layout.js        # Root Layout (Providers: Context, Theme, Auth)
├── components/          # Librería de UI y Layouts dinámicos
├── context/             # Gestión de estados globales (Auth, Theme)
├── lib/                 # Lógica de negocio (SM-2, Firebase, Drive Utils)
└── scripts/             # Herramientas de mantenimiento y setup inicial
```

---

## ⚡ Guía de Despliegue Local

### 1. Requisitos Previos
*   Node.js 18.x o superior.
*   Cuenta de Firebase con proyecto configurado.

### 2. Instalación y Configuración
```bash
# Clonar y acceder
git clone https://github.com/tu-usuario/sistema-med.git && cd sistema-med

# Instalar dependencias
npm install

# Configurar variables (.env.local)
# Copiar el formato sugerido en la documentación interna
```

### 3. Ejecución
```bash
npm run dev
```

---

## 🤝 Contribución y Calidad

El proyecto sigue estándares rigurosos de accesibilidad y rendimiento:
*   ✅ **Atajos de Teclado**: Navegación completa por teclado en el módulo de estudio.
*   ✅ **Responsividad**: Diseño móvil-primero para estudio en cualquier dispositivo.
*   ✅ **Integridad**: Borrado en cascada atómico para evitar datos huérfanos.

---

## 📄 Licencia

Este software es de propiedad privada bajo la marca **Doctemia MC**. Todos los derechos reservados. 2026.
