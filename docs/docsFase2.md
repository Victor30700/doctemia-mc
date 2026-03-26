# Documentación Técnica - Fase 2: Motor Lógico y Experiencia del Estudiante

Esta fase se centró en la implementación de la inteligencia de aprendizaje (Algoritmo SM-2), la persistencia del progreso del usuario y la creación de una interfaz de estudio de alto nivel con animaciones 3D.

## 1. Motor de Repetición Espaciada (SM-2 Modificado)
**Ruta:** `src/lib/spacedRepetition.js`

Se implementó una versión optimizada del algoritmo SuperMemo-2 para calcular los intervalos de repaso basados en la memoria humana.

### Lógica de Calificación:
*   **1 (Repetir):** Reinicia el intervalo a 0 días y baja el factor de facilidad.
*   **2 (Difícil):** Establece un intervalo de 1 día y reduce ligeramente la facilidad.
*   **3 (Bien):** Aumenta el intervalo multiplicándolo por el factor de facilidad actual.
*   **4 (Fácil):** Aumenta el intervalo agresivamente (factor * 1.3) e incrementa la facilidad.

---

## 2. Servicios de Persistencia y Filtrado Inteligente
**Ruta:** `src/lib/flashcardServices.js`

Se desarrollaron servicios para conectar el motor lógico con Firebase Firestore:

*   **`saveFlashcardProgress`:** Almacena el progreso individual en `users/{userId}/flashcards_progress/{cardId}`. Guarda el factor de facilidad, intervalo, repeticiones y la fecha exacta de la próxima revisión.
*   **`getDueFlashcards`:** Realiza un "Join" lógico entre las tarjetas globales de un subtema y el progreso del usuario. Solo retorna tarjetas que:
    1.  Son nuevas para el usuario.
    2.  Su fecha de `nextReview` es igual o anterior a hoy.

---

## 3. Portal de Selección de Estudio (Dashboard)
**Ruta:** `src/app/app/flashcards/page.jsx`

Se diseñó un centro de mando para el estudiante con las siguientes características:
*   **Navegación Jerárquica:** Selección fluida de Especialidad -> Subtema (Identificador).
*   **Buscador en Tiempo Real:** Filtrado instantáneo de áreas médicas.
*   **Interfaz Premium:** Uso de tarjetas con profundidad, sombras dinámicas y estados activos para una navegación intuitiva.

---

## 4. Reproductor de Flashcards 3D (Modo Estudio)
**Ruta:** `src/app/app/flashcards/estudio/page.jsx`

Es el núcleo de la experiencia de aprendizaje del estudiante.

### Características Principales:
*   **Animación Flip 3D:** Implementación de perspectiva real (2000px) y rotación de 180° con ocultamiento de cara posterior (`backface-hidden`).
*   **Botonera SM-2:** Cuatro niveles de calificación con feedback visual inmediato.
*   **Atajos de Teclado:** 
    *   `ESPACIO`: Voltear la tarjeta.
    *   `1, 2, 3, 4`: Calificar el nivel de dificultad.
*   **Barra de Progreso:** Visualización dinámica del avance de la sesión con gradientes de color.
*   **Control de Sesión:** Pantallas de "¡Todo al día!" y "Sesión Completada" con resúmenes visuales (Trofeos).

---

## 5. Optimizaciones y Correcciones de Arquitectura

Durante el desarrollo se aplicaron correcciones críticas para la estabilidad del sistema:
*   **Protección de Rutas:** Integración del contexto de autenticación (`useAuth`) para vincular el progreso a la cuenta del alumno.
*   **Manejo de Suspense:** Uso de `<Suspense>` para el manejo seguro de parámetros de URL (`useSearchParams`) evitando errores de hidratación en Next.js.
*   **Unificación de Layout:** Eliminación de envoltorios redundantes de `NavbarUser`, delegando la navegación al layout principal de la aplicación para evitar colisiones de interactividad.
*   **Corrección de Importaciones:** Centralización del consumo de hooks desde `@/context/AuthContext` debido a archivos de hooks vacíos en otras rutas.

---

## Estructura de Datos de Progreso (Firestore)

### Subcolección: `users/{userId}/flashcards_progress`
```json
{
  "easiness": 2.5,
  "interval": 6,
  "repetitions": 3,
  "nextReview": "timestamp",
  "lastUpdated": "timestamp"
}
```
