# 🧠 Documentación Técnica: Finalización Módulo de Flashcards Premium (Fase 4)
**Proyecto:** DOCTEMIA MC
**Versión:** 2.5 (Final Premium)
**Fecha de finalización:** 25 de Marzo, 2026

## 📝 1. Introducción
Esta fase ha culminado con la transformación del módulo de Flashcards en una herramienta de **SaaS Educativo de Alto Rendimiento**. Se han priorizado tres pilares: **Precisión Algorítmica**, **Interactividad de Recuperación Activa** y **Atomicidad de Datos**.

---

## 🏗️ 2. Arquitectura de Datos y Persistencia (Firestore)

### 2.1 Estado de Debilidad Activa (`flashcards_progress`)
Se ha implementado una lógica de estado persistente para mapear debilidades reales de conocimiento:
- **Campo `esDebilidadActiva` (Boolean):** 
  - `true` si la calificación es 1 (Repetir) o 2 (Difícil).
  - `false` si la calificación es 3 (Bien) o 4 (Fácil).
- **Contadores Atómicos:** Uso estricto de `increment(1)` para garantizar integridad en:
  - `totalVistas`: Contador global de interacciones.
  - `totalFallos`: Acumulado histórico de errores (Calidad < 3).
  - `totalAciertos`: Acumulado histórico de éxitos (Calidad >= 3).

### 2.2 Motor Analítico Atómico (`flashcardServices.js`)
La función `getFlashcardMetrics` ahora filtra las debilidades basándose en el estado **actual** de la tarjeta (`esDebilidadActiva === true`), agrupándolas por subtema para mostrar al usuario dónde necesita enfocar sus esfuerzos de manera inmediata.

---

## 🧮 3. Lógica de Negocio: Algoritmo SM-2 Optimizado

### 3.1 Penalización Agresiva y Mapeo
Se ha refinado el algoritmo en `spacedRepetition.js` para ser más riguroso con los fallos:
- **Calidad 1 (Repetir):** Se mapea internamente a `q=0` (estándar SM-2), aplicando la máxima penalización al *Easiness Factor* (-0.8 EF).
- **Calidad 2 (Difícil):** Se mapea a `q=3`, penalizando levemente el EF para asegurar que la tarjeta se mantenga en el ciclo de revisión frecuente.
- **Intervalos:**
  - Calidad 1: `interval = 0` (Revisión inmediata).
  - Calidad 2: `interval = 1` (Revisión mañana).

---

## 🛠️ 4. Refactorización UI/UX del Reproductor (Estudio)

### 4.1 Interacción Cloze Inline (Completar Espacios)
Se ha eliminado el textarea genérico por un sistema de **Inputs Dinámicos**:
- **Detección por Regex:** El sistema identifica patrones `[ ]` en el texto de la pregunta.
- **Inputs Proporcionales:** Se renderizan `<input>` estilizados cuyo ancho se adapta visualmente a la longitud de la palabra oculta.
- **Manejo de Estado Múltiple:** Se utiliza un objeto `clozeAnswers` para gestionar de forma independiente cada espacio completado por el usuario.

### 4.2 Lógica de "Fallo Total" (Botón Repetir)
Para maximizar la **Recuperación Activa**, al presionar "Repetir" (Calidad 1):
1. El progreso se guarda en Firestore (marcando el fallo).
2. La tarjeta se **voltea automáticamente al anverso** (`isFlipped: false`).
3. Se **limpian todos los inputs** (vacía `userAnswer` o `clozeAnswers`).
4. El sistema **permanece en la misma tarjeta**, obligando al usuario a realizar el esfuerzo mental de escribir la respuesta correcta antes de poder avanzar.

### 4.3 UI de Comparación Avanzada
En el reverso de las tarjetas Cloze:
- Se muestra el texto completo con las palabras clave resaltadas en **Azul Premium y Negrita**.
- Debajo de cada palabra, un badge indica la respuesta que el usuario escribió, con un código de colores (Verde/Rojo) basado en la exactitud de la comparación (case-insensitive).

---

## ✅ 5. Estándares de Calidad Cumplidos
- [x] **Accesibilidad:** Soporte total para la tecla `Enter` para revelar respuestas desde dentro de los inputs.
- [x] **Responsividad:** Ajuste fluido de los inputs inline en dispositivos móviles.
- [x] **Consistencia:** Soporte nativo para Dark Mode en todos los nuevos componentes interactivos.
- [x] **Rendimiento:** Reducción de lecturas previas en Firestore mediante actualizaciones atómicas (`setDoc` con `merge` + `increment`).

---
**Documentado por:** Gemini CLI Agent
**Estado:** Módulo Flashcards 100% Finalizado
**Entregable:** Código fuente refactorizado y verificado.

## 🚨 6. Correcciones Críticas de UI y Event Bubbling (Post-Producción)
Se han aplicado parches de emergencia para resolver conflictos de interacción en el reproductor de tarjetas 3D:

### 6.1 Control de Eventos (Event Bubbling)
Se rediseñó el flujo de eventos para evitar volteos accidentales de la tarjeta:
- **Mover `onClick={handleFlip}`:** Se eliminó del contenedor padre global y se asignó exclusivamente al div de la **Cara Frontal**.
- **Bloqueo en Cara Trasera:** Se implementó `e.stopPropagation()` en el contenedor principal de la cara trasera. 
- **Pointer Events Dinámicos:** Se añadió `pointer-events-none` condicional. Cuando la tarjeta está volteada, la cara frontal es invisible para los eventos del mouse, asegurando que cualquier interacción (clic o scroll) en el reverso sea procesada únicamente por los elementos de respuesta.

### 6.2 Optimización de Scroll Vertical y Visualización
Para manejar contenidos extensos registrados por los administradores:
- **Alineación Adaptativa:** Se cambió `justify-center` por `justify-start` en las cajas de respuesta. Esto asegura que el texto largo comience desde la parte superior del contenedor.
- **Contenedores de Scroll Independiente:** Cada caja de respuesta (Usuario y Correcta) cuenta ahora con su propio contenedor con `max-h-[300px]` y `overflow-y-auto`.
- **Prevalencia de Z-Index:** Se asignó `z-20` a la cara trasera activa para garantizar su posición física por encima de la frontal durante la rotación.
- **Corrección de Desbordamiento Horizontal:** Se aplicaron las clases `whitespace-pre-wrap` y `break-words` junto con `overflow-x-hidden` para forzar el salto de línea automático, eliminando el scroll horizontal y manteniendo la lectura estrictamente vertical.

### 6.3 Mejoras de Legibilidad (Modo Claro/Oscuro)
- **Contraste Forzado:** Se implementó la clase `text-[#2E4A70]` en las respuestas del usuario para asegurar legibilidad total sobre fondos blancos en el modo claro, resolviendo el problema de "texto invisible" reportado.
- **Flexbox Min-Height Fix:** Se añadió `min-h-0` al área scrolleable principal, permitiendo que Flexbox calcule correctamente el desbordamiento y active la barra de desplazamiento en dispositivos con pantallas pequeñas.

---
**Actualización:** 25 de Marzo, 2026 - 18:30 GMT
**Responsable:** Gemini CLI Agent (Mantenimiento de Estabilidad)

# 📊 9. Nueva Funcionalidad: Radiografía de Tarjeta (Analytics Individual)

Se ha implementado un sistema de **análisis granular por tarjeta** que permite al estudiante visualizar su rendimiento histórico exacto, transformando el Dashboard en un centro de comando de datos.

### 9.1 Motor de Datos Enriquecido
Se ha optimizado el servicio `getFlashcardMetrics` en `flashcardServices.js` para retornar un objeto de metadatos completo por cada tarjeta crítica:
- **Contadores Atómicos:** `totalVistas`, `totalAciertos`, `totalFallos`.
- **Cronología:** `lastUpdated` (Último repaso) y `nextReview` (Próxima revisión programada).
- **Estado de Dominio:** Flag `isMastered`.

### 9.2 Interfaz "CardRadiographyModal"
Ubicado en `src/app/app/flashcards/components/CardRadiographyModal.jsx`, este componente ofrece una visualización estilo **Reporte Médico Premium**:
- **Gráfico Circular de Éxito:** Un SVG dinámico que calcula en tiempo real el `% de Dominio` (`(aciertos / vistas) * 100`).
- **Badge de Status Dinámico:** Identifica visualmente si la tarjeta está "PENDIENTE HOY" (en rojo) o "EN PROGRAMACIÓN" (en azul).
- **Grid de KPIs:** Tres bloques destacados con iconos de `Lucide-React` para visualización rápida de Vistas, Aciertos y Fallos.
- **Lógica de Tiempo Humano:** Implementación de `timeAgo` para mostrar fechas relativas (ej. "Hace 2 horas") y `Intl.DateTimeFormat` para fechas absolutas detalladas.

---

# 🏆 10. Optimización del Flujo de Dominio (UX/UI)

Para evitar acciones accidentales y mejorar la retroalimentación cognitiva, se ha refactorizado el botón "Ya domino esto" en el reproductor de estudio.

### 10.1 Confirmación con SweetAlert2
Se ha integrado un flujo de validación mediante `Swal.fire` con las siguientes características:
- **Explicación Educativa:** El diálogo informa al usuario que la tarjeta se archivará y le indica explícitamente que puede recuperarla usando el botón **"Restaurar"** en el panel de especialidades.
- **Diseño Adaptativo:** El modal de confirmación hereda las variables de `ThemeContext` (isDark), ajustando su fondo y tipografía automáticamente para mantener la consistencia estética.

### 10.2 Feedback y Transición Visual
- **Pausa de Confirmación:** Se ha añadido un `setTimeout` de 300ms tras el registro en Firestore. Esto permite que el usuario visualice el `toast` de éxito (🏆) antes de que la tarjeta se limpie y pase a la siguiente.
- **Persistencia de Dominio:** El botón ahora utiliza la racha actual del usuario para recalcular el algoritmo SM-2 antes de archivar, asegurando que los datos de "dominio" sean precisos para futuras restauraciones.

---
**Documentado por:** Gemini CLI Agent
**Estado:** Fase 4 - Módulo Analytics y UX Finalizado.


Esta sección detalla el ciclo de vida completo de las tarjetas de estudio, desde su creación por el administrador hasta la interacción final del estudiante.

---

## 🛡️ 7. Gestión Administrativa de Flashcards (`src/app/admin/flashcards`)

El sistema administrativo permite una gestión granular y centralizada de todo el banco de preguntas, permitiendo a los docentes y administradores nutrir la base de conocimientos.

### 7.1 Panel de Control (Listado Global)
Ubicado en `src/app/admin/flashcards`, este panel ofrece una visión general de todas las tarjetas registradas:
- **Búsqueda Inteligente:** Filtrado dinámico por texto de la pregunta, identificador (subtema), especialidad o etiquetas (tags).
- **Metadatos Visuales:** Identificación rápida del tipo de tarjeta (QA, Cloze, etc.), especialidad asociada y etiquetas de categorización.
- **Acciones Rápidas:** Botones directos para editar o eliminar registros con confirmaciones de seguridad mediante `SweetAlert2`.

### 7.2 Registro de Nuevas Tarjetas (`/new`)
El formulario de creación (`src/app/admin/flashcards/new/page.jsx`) es el punto de entrada de los datos. Sus características incluyen:
- **Asignación Jerárquica:** Selección obligatoria de **Especialidad** (Categoría) y **Subtema** (Identificador de Estudio). Los subtemas se cargan dinámicamente según la especialidad elegida.
- **Tipos de Tarjeta Soportados:**
  - **Pregunta-Respuesta (QA):** Formato estándar de anverso y reverso.
  - **Completar Espacios (Cloze Deletion):** Utiliza la sintaxis `[palabra]` en el campo de pregunta para generar huecos interactivos automáticamente.
  - **Caso Clínico Corto:** Optimizado para textos extensos de diagnóstico.
  - **Imagen:** Permite la integración de material visual.
- **Integración con Google Drive:** Soporte para enlaces de imágenes de Drive, con un formateador automático (`driveUtils.js`) que convierte enlaces compartidos en URLs de visualización directa (`thumbnail`).
- **Previsualización en Tiempo Real:** Renderizado lateral de cómo se verá la tarjeta para el alumno, incluyendo la imagen y el formato de texto.
- **Categorización por Tags:** Sistema de etiquetas separadas por comas para facilitar la búsqueda y organización futura.

### 7.3 Edición y Mantenimiento (`/edit/[id]`)
Permite la actualización de cualquier campo de la tarjeta, manteniendo la integridad de las relaciones con las categorías y subtemas.

---

## 🎓 8. Flujo de Experiencia del Estudiante (`src/app/app/flashcards`)

El módulo para estudiantes está diseñado bajo principios de neurociencia cognitiva para maximizar la retención a largo plazo.

### 8.1 Dashboard de Selección y Métricas
Ubicado en `src/app/app/flashcards`, el estudiante inicia su jornada aquí:
- **Exploración por Especialidades:** Menú lateral para navegar entre las áreas médicas disponibles.
- **Identificadores de Estudio (Subtemas):** Al elegir una especialidad, se despliegan los subtemas activos (aquellos que tienen al menos 1 tarjeta registrada).
- **Indicadores de Progreso:**
  - **Cards Today:** Conteo de tarjetas pendientes de repaso para el día actual.
  - **Learning Count:** Total de tarjetas en proceso de aprendizaje (no dominadas).
  - **Performance Chart:** Visualización de dominio por especialidad basado en el historial de aciertos/fallos.
  - **Critical Cards:** Acceso directo a las "Debilidades Críticas" (aquellas con mayor tasa de error).
- **Gestión de Dominio:** Capacidad de restaurar tarjetas marcadas como "Dominadas" para permitir un re-estudio completo de un tema.

### 8.2 La Sesión de Estudio (`/estudio`)
La interfaz de estudio (`src/app/app/flashcards/estudio/page.jsx`) ofrece tres modos de operación:
1. **Modo Estándar:** Repaso de tarjetas programadas por el algoritmo para hoy.
2. **Modo Intensivo:** Estudio de todas las tarjetas de un subtema (ignora fechas de programación).
3. **Modo Refuerzo:** Sesión enfocada exclusivamente en tarjetas marcadas como debilidades activas.

#### Características de la Interacción:
- **Interactividad Cloze:** Los estudiantes deben escribir las palabras faltantes en los campos `...` antes de revelar la respuesta.
- **Validación Visual:** Al revelar, el sistema resalta en verde los aciertos y en rojo los errores tipográficos o de concepto.
- **Recuperación Activa:** Espacio para redactar la respuesta mental antes de ver la solución, fomentando el esfuerzo cognitivo.
- **Sistema de Calificación Emojis (SM-2):** El usuario califica su propio desempeño del 1 al 5. Esta entrada alimenta el algoritmo para calcular la próxima fecha de revisión.
- **Navegación Fluida:** Soporte para gestos táctiles, clics de mouse y atajos de teclado (Espacio, Flechas, Números).

### 8.3 Lógica de "Mastered" (Tarjetas Dominadas)
Para optimizar el tiempo del estudiante, las tarjetas salen del ciclo de repetición cuando se consideran "dominadas":
- **Automático:** Si una tarjeta recibe calificación de 4 o 5 y tiene una racha de al menos 3 repeticiones exitosas.
- **Manual:** El usuario puede usar el botón "Ya domino esto" para archivar la tarjeta permanentemente del ciclo de estudio regular.
- **Restauración:** Desde el Dashboard, el usuario puede devolver estas tarjetas al ciclo activo si desea refrescar conocimientos antiguos.

---
**Documentado por:** Gemini CLI Agent
**Estado:** Documentación de Gestión y Flujo 100% Integrada.

# 🧠 Documentación Técnica y Guía de Usuario: Fase 4 (Finalización Premium)
**Proyecto:** DOCTEMIA MC
**Versión:** 2.5 (Refactorización Escala 1-5 Emojis)
**Fecha:** 26 de Marzo, 2026

---

## 🛠️ 1. Cambios Técnicos Realizados

Se ha transformado el sistema de calificación de 4 puntos (iconos Lucide) a una **Escala de Likert de 5 puntos** basada en Emojis para reducir la fricción cognitiva y mejorar la precisión del algoritmo de repetición espaciada.

### 1.1 Actualización del Algoritmo SM-2 (`spacedRepetition.js`)
El motor de aprendizaje ahora procesa 5 niveles de calidad:
- **Calidad 1 (😭 Olvido):** Reinicio total del progreso (`interval=0`, `reps=0`) y penalización fuerte de facilidad (`-0.2 EF`).
- **Calidad 2 (😠 Difícil):** Intervalo de 1 día, reinicio de racha y penalización leve (`-0.15 EF`).
- **Calidad 3 (😐 Normal):** Mantiene el factor de facilidad. El intervalo crece de forma estándar.
- **Calidad 4 (🙂 Fácil):** Aumenta el factor de facilidad (`+0.1 EF`) e incrementa el intervalo en un 30% adicional.
- **Calidad 5 (🤩 Perfecto):** Aumenta el factor de facilidad significativamente (`+0.15 EF`) e incrementa el intervalo en un 50% adicional.

### 1.2 Refactorización de UI/UX (`estudio/page.jsx`)
- **Botonera Premium:** Se implementó un grid de 5 columnas con botones de colores vibrantes y emojis grandes.
- **Persistencia de Local State:** La interfaz ahora actualiza el estado local inmediatamente tras calificar, permitiendo que si una tarjeta se repite en la misma sesión, el algoritmo use los datos más recientes.

---

## 📖 2. Guía de Ayuda al Usuario: ¿Cómo estudiar con Flashcards?

Esta guía explica el funcionamiento del módulo de estudio para que el usuario maximice su retención de memoria.

### 2.1 El Ciclo de Estudio
El sistema utiliza **Recuperación Activa (Active Recall)**. No basta con leer; el cerebro debe esforzarse por recordar.
1. **Ver la Pregunta:** Se muestra el anverso de la tarjeta.
2. **Interactuar:** 
   - En tarjetas estándar: Escribe tu respuesta en el cuadro de texto para compararla mentalmente.
   - En tarjetas "Completar Espacios": Rellena los huecos `...` directamente en la oración.
3. **Revelar:** Pulsa la tarjeta, el botón central o la tecla `ESPACIO` / `ENTER` para ver la respuesta correcta.
4. **Calificar:** Aquí es donde ocurre la magia del algoritmo.

### 2.2 Significado de la Escala de Emojis (1 al 5)

| Nivel | Emoji | Significado | ¿Qué hace el sistema? |
| :--- | :---: | :--- | :--- |
| **1** | 😭 | **Olvido** | No recordabas nada. La tarjeta **se queda en la sesión** y se reinicia su dificultad. |
| **2** | 😠 | **Difícil** | Recordaste con mucho esfuerzo o cometiste errores leves. Te la mostrará mañana. |
| **3** | 😐 | **Normal** | Recordaste bien pero tras unos segundos de duda. El intervalo de tiempo crecerá moderadamente. |
| **4** | 🙂 | **Fácil** | Recordaste rápidamente y sin dudar. El sistema ampliará el tiempo de espera para el próximo repaso. |
| **5** | 🤩 | **Perfecto** | Respuesta instantánea. El sistema considera que dominas el concepto y la programará para mucho después. |

### 2.3 Tipos de Tarjetas Especiales
- **Completar Espacios (Cloze):** Identifica las palabras clave ocultas. Al revelar, el sistema comparará lo que escribiste con la respuesta correcta resaltando en **Verde** los aciertos y en **Rojo** los fallos.
- **Modo Intensivo:** Si no tienes tarjetas pendientes hoy, puedes usar el "Modo Estudio Intensivo" para repasar todo el mazo sin importar la fecha programada.

### 2.4 Atajos de Teclado (Para Expertos)
- `ESPACIO`: Voltear la tarjeta.
- `ENTER`: Revelar respuesta (si estás escribiendo en un cuadro de texto).
- `FLECHA DERECHA`: Siguiente tarjeta (si ya está calificada).
- `FLECHA IZQUIERDA`: Tarjeta anterior.
- Números `1`, `2`, `3`, `4`, `5`: Calificar la tarjeta instantáneamente después de voltearla.

---
**Nota:** Recuerda que la consistencia es clave. El sistema te avisará en el Dashboard cuántas tarjetas tienes pendientes para "Hoy" para evitar que el conocimiento se pierda en la curva del olvido.

# 🎨 11. Refactorización Estética Final y Control de Desbordamiento

Se han aplicado ajustes visuales de alto impacto para alinear el Dashboard con la identidad visual premium del proyecto y resolver problemas de visualización en pantallas pequeñas.

### 11.1 Rediseño del Contenedor de "Tarjetas Críticas"
Se ha transformado el contenedor de debilidades en `src/app/app/flashcards/page.jsx` para mejorar el contraste y la jerarquía visual:
- **Degradado Premium:** Sustitución del fondo blanco/naranja por un gradiente dinámico `from-[#1a2e4d] via-[#2E4A70] to-[#3b82f6]`.
- **Tipografía de Alto Contraste:** El título "Tus Tarjetas Críticas" ahora utiliza color blanco puro en modo claro, mejorando drásticamente la legibilidad sobre el fondo oscuro.
- **Botón de Acción "Ghost-Solid":** El botón "Reforzar Debilidades" se ha rediseñado con fondo blanco y texto en azul oscuro (`#2E4A70`), creando un punto de enfoque claro para el usuario.
- **Sombreado Dinámico:** Implementación de `shadow-blue-500/20` para dar profundidad al contenedor sobre el fondo general de la aplicación.

### 11.2 Optimización de Estructura en `CardRadiographyModal`
Para garantizar que la "Radiografía de Tarjeta" sea funcional incluso con preguntas médicas extensas o en dispositivos móviles:
- **Estructura Flex-Col:** El modal se ha reestructurado para separar la cabecera del cuerpo del reporte.
- **Control de Altura Máxima (`90vh`):** Se ha limitado la altura total del modal al 90% del viewport para evitar que el botón de cierre o el pie del modal queden fuera del área visible.
- **Scroll Interno Inteligente:** El cuerpo del modal cuenta ahora con `overflow-y-auto` y un `custom-scrollbar` estilizado, permitiendo navegar por las métricas y el historial sin romper el layout del banner superior.
- **Ajuste de Palabras (`break-words`):** Se aplicaron reglas de salto de línea forzado en el título de la pregunta para evitar desbordamientos horizontales.

---
**Actualización Final:** 26 de Marzo, 2026 - 20:45 GMT
**Responsable:** Gemini CLI Agent (Refactorización Estética)
