# 🧠 Documentación Técnica: Módulo de Flashcards Premium — Fase 4
**Proyecto:** DOCTEMIA MC
**Versión:** 2.5 (Final Premium)
**Última actualización:** 26 de Marzo, 2026
**Estado:** ✅ Módulo 100% Finalizado y Estabilizado

---

## 📋 Índice

1. [Introducción](#1-introducción)
2. [Arquitectura de Datos y Persistencia (Firestore)](#2-arquitectura-de-datos-y-persistencia-firestore)
3. [Lógica de Negocio: Algoritmo SM-2 con Escala de 5 Puntos](#3-lógica-de-negocio-algoritmo-sm-2-con-escala-de-5-puntos)
4. [Gestión Administrativa de Flashcards](#4-gestión-administrativa-de-flashcards)
5. [Flujo de Experiencia del Estudiante](#5-flujo-de-experiencia-del-estudiante)
6. [Interfaz de Estudio: Active Recall Mental](#6-interfaz-de-estudio-active-recall-mental)
7. [Analytics: Radiografía de Tarjeta](#7-analytics-radiografía-de-tarjeta)
8. [Optimizaciones de UX y Flujo de Dominio](#8-optimizaciones-de-ux-y-flujo-de-dominio)
9. [Estética y Diseño Visual](#9-estética-y-diseño-visual)
10. [Estabilidad Técnica y Correcciones Críticas](#10-estabilidad-técnica-y-correcciones-críticas)
11. [Estándares de Calidad y Accesibilidad](#11-estándares-de-calidad-y-accesibilidad)
12. [Guía de Ayuda al Usuario](#12-guía-de-ayuda-al-usuario)

---

## 1. Introducción

Esta fase culmina con la transformación del módulo de Flashcards en una herramienta de **SaaS Educativo de Alto Rendimiento**. Se priorizaron tres pilares fundamentales:

- **Precisión Algorítmica:** Motor SM-2 refinado con escala de 5 puntos y emojis.
- **Active Recall Mental:** Modelo de estudio basado en recordar sin escribir, reduciendo fricción cognitiva.
- **Atomicidad de Datos:** Contadores Firestore con `increment()` para garantizar integridad en entornos concurrentes.

---

## 2. Arquitectura de Datos y Persistencia (Firestore)

### 2.1 Estado de Debilidad Activa (`flashcards_progress`)
Se implementa lógica de estado persistente para mapear debilidades reales de conocimiento:

- **Campo `esDebilidadActiva` (Boolean):**
  - `true` si la calificación es 1 (Olvido) o 2 (Difícil).
  - `false` si la calificación es 3, 4 o 5 (Normal → Perfecto).
- **Contadores Atómicos** vía `increment(1)`:
  - `totalVistas`: Contador global de interacciones.
  - `totalFallos`: Acumulado histórico de errores (Calidad < 3).
  - `totalAciertos`: Acumulado histórico de éxitos (Calidad ≥ 3).
- **Persistencia de ID:** Cada registro de progreso contiene el campo `cardId` para facilitar el rastreo y borrado en cascada.

### 2.2 Motor Analítico Atómico (`flashcardServices.js`)
La función `getFlashcardMetrics` filtra las debilidades basándose en el estado **actual** de la tarjeta (`esDebilidadActiva === true`), agrupándolas por subtema para indicar al usuario dónde enfocar sus esfuerzos de forma inmediata.

Retorna un objeto de metadatos completo por cada tarjeta crítica:
- Contadores: `totalVistas`, `totalAciertos`, `totalFallos`.
- Cronología: `lastUpdated` (último repaso) y `nextReview` (próxima revisión programada).
- Estado: Flag `isMastered`.

---

## 3. Lógica de Negocio: Algoritmo SM-2 con Escala de 5 Puntos

### 3.1 Escala de Calificación (Emojis)

El sistema fue migrado de una escala de 4 puntos a una **Escala de Likert de 5 puntos** con emojis, reduciendo la fricción cognitiva y mejorando la precisión del algoritmo.

| Calidad | Emoji | Nombre | Comportamiento del Algoritmo |
|:-------:|:-----:|:-------|:-----------------------------|
| **1** | 😭 | Olvido | Reinicio total (`interval=0`, `reps=0`), penalización fuerte (`-0.2 EF`). La tarjeta permanece en la sesión. |
| **2** | 😠 | Difícil | `interval=1` día, reinicio de racha, penalización leve (`-0.15 EF`). |
| **3** | 😐 | Normal | Factor de facilidad estable. El intervalo crece de forma estándar. |
| **4** | 🙂 | Fácil | Bonus de facilidad (`+0.1 EF`), intervalo incrementado en un 30% adicional. |
| **5** | 🤩 | Perfecto | Bonus de facilidad significativo (`+0.15 EF`), intervalo incrementado en un 50% adicional. |

### 3.2 Lógica de "Fallo Total" (Calidad 1 — Olvido)
Al calificar con 1, el flujo maximiza la **Recuperación Activa**:
1. El progreso se guarda en Firestore (registrando el fallo y marcando `esDebilidadActiva: true`).
2. La tarjeta se mantiene en la sesión actual.
3. Se vuelve a mostrar para que el estudiante realice el esfuerzo mental antes de avanzar.

### 3.3 Lógica de "Mastered" (Tarjetas Dominadas)
Las tarjetas salen del ciclo de repetición cuando se consideran dominadas:
- **Automático:** Calificación de 4 o 5 con racha de al menos 3 repeticiones exitosas.
- **Manual:** El usuario activa el botón "Ya domino esto" (ver sección 8).
- **Restauración:** Desde el Dashboard, el usuario puede devolver tarjetas al ciclo activo.

---

## 4. Gestión Administrativa de Flashcards
**Ubicación:** `src/app/admin/flashcards`

### 4.1 Panel de Control (Listado Global)
Visión centralizada de todas las tarjetas registradas:
- **Búsqueda Inteligente:** Filtrado dinámico por texto de pregunta, subtema, especialidad o tags.
- **Metadatos Visuales:** Tipo de tarjeta, especialidad y etiquetas de categorización.
- **Acciones Rápidas:** Botones de Editar/Eliminar con confirmaciones de seguridad (`SweetAlert2`).
- **Borrado Masivo Protegido (Nuevo):** 
    - **Modo Selección:** Permite marcar múltiples tarjetas simultáneamente mediante checkboxes.
    - **Protección por Contraseña:** Al intentar eliminar más de una tarjeta, el sistema exige la contraseña maestra de administrador (`1234567890`) para prevenir accidentes.
    - **Procesamiento Atómico:** Ejecuta el borrado en cascada para cada tarjeta seleccionada, limpiando progresos huérfanos en toda la base de datos.
- **Tabla Responsiva:** Scroll horizontal habilitado (`overflow-x-auto`) con ancho mínimo fijo (`min-w-[1000px]`) para garantizar siempre el acceso a las columnas de acción.

### 4.2 Registro de Nuevas Tarjetas (`/new`)
**Archivo:** `src/app/admin/flashcards/new/page.jsx`

- **Asignación Jerárquica:** Selección obligatoria de **Especialidad** y **Subtema** (cargado dinámicamente).
- **Tipos de Tarjeta Soportados:**
  - **Pregunta** *(predeterminado, reemplaza al antiguo "Pregunta-Respuesta")*: Formato estándar de anverso y reverso.
  - **Completar Espacios (Cloze Deletion):** Usa la sintaxis `[palabra]` para generar espacios visuales automáticamente.
  - **Caso Clínico Corto:** Optimizado para textos extensos de diagnóstico.
  - **Imagen:** Integración de material visual.
- **Integración con Google Drive:** `driveUtils.js` convierte automáticamente enlaces compartidos en URLs de visualización directa. Soporta también URLs web estándar (`http/https`) sin interferencia.
- **Previsualización en Tiempo Real:** Renderizado lateral con scroll vertical (`max-h-[300px] overflow-y-auto`) y `break-words`, alineado con el comportamiento del reproductor de estudio.
- **Categorización por Tags:** Etiquetas separadas por comas.

### 4.3 Edición y Mantenimiento (`/edit/[id]`)
Permite la actualización de cualquier campo manteniendo la integridad de relaciones con categorías y subtemas. Aplica las mismas reglas de previsualización que `/new`.

---

## 5. Flujo de Experiencia del Estudiante
**Ubicación:** `src/app/app/flashcards`

### 5.1 Dashboard de Selección y Métricas
- **Exploración por Especialidades:** Menú lateral para navegar entre áreas médicas.
- **Subtemas Activos:** Se despliegan solo aquellos con al menos 1 tarjeta registrada.
- **Indicadores de Progreso:**
  - **Cards Today:** Tarjetas pendientes de repaso para hoy.
  - **Learning Count:** Total de tarjetas en proceso (no dominadas).
  - **Performance Chart:** Dominio por especialidad basado en historial de aciertos/fallos.
  - **Critical Cards:** Acceso directo a las debilidades críticas (mayor tasa de error).
- **Gestión de Dominio:** Opción para restaurar tarjetas archivadas y reiniciar su ciclo de estudio.

### 5.2 La Sesión de Estudio (`/estudio`)
**Archivo:** `src/app/app/flashcards/estudio/page.jsx`

Tres modos de operación:
1. **Modo Estándar:** Repaso de tarjetas programadas por el algoritmo para hoy.
2. **Modo Intensivo:** Estudio de todas las tarjetas de un subtema, ignorando fechas de programación.
3. **Modo Refuerzo:** Sesión enfocada exclusivamente en tarjetas con `esDebilidadActiva: true`.

---

## 6. Interfaz de Estudio: Active Recall Mental

> **Nota de versión:** Esta sección documenta el modelo actual. El sistema anterior de inputs (textarea / inputs Cloze) fue deprecado y reemplazado por este modelo de recuerdo mental.

### 6.1 Principio de Diseño
El módulo se basa en **Recuperación Activa Mental**: el estudiante debe esforzarse por recordar la respuesta internamente antes de revelarla. No se requiere ni se permite escritura.

### 6.2 Comportamiento de la Tarjeta

**Anverso (Pregunta):**
- **Tarjeta estándar:** Muestra el texto de la pregunta.
- **Tarjeta Cloze:** Muestra la oración con los espacios en blanco representados por `<span>` subrayados (visual), sin inputs de texto.
- Las imágenes se posicionan siempre debajo del texto, restringidas a `max-h-48 md:max-h-64`.
- Se conserva el centrado vertical (`justify-center`) para preguntas cortas, con padding de seguridad (`py-20`) para evitar solapamiento con los identificadores de posición absoluta.

**Reverso (Respuesta):**
- **Tarjeta estándar:** Muestra la respuesta completa a ancho total.
- **Tarjeta Cloze:** Muestra la oración completa con las palabras clave resaltadas en **azul negrita**. Se eliminó la columna comparativa "Tu Respuesta".
- Contenedor con scroll independiente (`max-h-[300px] overflow-y-auto`) y `break-words` + `whitespace-pre-wrap` para textos extensos.

### 6.3 Control de Eventos (Event Bubbling)
Rediseño del flujo de eventos para evitar volteos accidentales:
- **`onClick={handleFlip}`** asignado exclusivamente al div de la **Cara Frontal**.
- **`e.stopPropagation()`** en el contenedor de texto del reverso, permitiendo hacer scroll o seleccionar texto sin voltear la tarjeta.
- **`pointer-events-none`** condicional: cuando la tarjeta está volteada, la cara frontal es invisible para eventos del mouse.
- **`z-20`** asignado a la cara trasera activa para garantizar su posición por encima de la frontal durante la rotación 3D.

### 6.4 Atajos de Teclado (Globales)
La lógica de detección fue simplificada al eliminar los inputs; todos los atajos funcionan de forma global y fluida:

| Tecla | Acción |
|:------|:-------|
| `ESPACIO` | Voltear la tarjeta |
| `ENTER` | Revelar respuesta |
| `→` Flecha derecha | Siguiente tarjeta |
| `←` Flecha izquierda | Tarjeta anterior |
| `1` `2` `3` `4` `5` | Calificar instantáneamente tras voltear |

### 6.5 Botonera de Calificación
Grid de 5 columnas con botones de colores vibrantes y emojis grandes. El estado local se actualiza inmediatamente tras calificar, garantizando que si una tarjeta se repite en la misma sesión, el algoritmo use los datos más recientes.

---

## 7. Analytics: Radiografía de Tarjeta

### 7.1 Componente `CardRadiographyModal`
**Archivo:** `src/app/app/flashcards/components/CardRadiographyModal.jsx`

Visualización estilo **Reporte Médico Premium** con:
- **Gráfico Circular de Éxito:** SVG dinámico que calcula `% de Dominio = (aciertos / vistas) * 100` en tiempo real.
- **Badge de Status Dinámico:** "PENDIENTE HOY" (rojo) o "EN PROGRAMACIÓN" (azul).
- **Grid de KPIs:** Tres bloques con iconos Lucide-React para Vistas, Aciertos y Fallos.
- **Lógica de Tiempo Humano:** `timeAgo` para fechas relativas ("Hace 2 horas") e `Intl.DateTimeFormat` para fechas absolutas.

### 7.2 Estructura y Responsividad del Modal
- **Estructura Flex-Col:** Cabecera separada del cuerpo del reporte.
- **Altura máxima (`90vh`):** Evita que el botón de cierre quede fuera del área visible.
- **Scroll Interno:** `overflow-y-auto` con `custom-scrollbar` estilizado en el cuerpo.
- **`break-words`** en el título de la pregunta para evitar desbordamientos horizontales.

---

## 8. Optimizaciones de UX y Flujo de Dominio

### 8.1 Confirmación de "Ya domino esto" con SweetAlert2
Flujo de validación mediante `Swal.fire`:
- **Explicación Educativa:** Informa que la tarjeta se archivará y puede recuperarse desde el botón "Restaurar" en el panel de especialidades.
- **Diseño Adaptativo:** El modal hereda variables de `ThemeContext` (`isDark`) para mantener consistencia estética en modo claro/oscuro.

### 8.2 Feedback y Transición Visual
- **Pausa de Confirmación:** `setTimeout` de 300ms tras el registro en Firestore, permitiendo que el usuario visualice el toast de éxito (🏆) antes de avanzar.
- **Recalculado de SM-2 al Archivar:** Usa la racha actual del usuario para asegurar datos de "dominio" precisos en futuras restauraciones.

---

## 9. Estética y Diseño Visual

### 9.1 Rediseño del Contenedor "Tarjetas Críticas"
**Archivo:** `src/app/app/flashcards/page.jsx`

- **Degradado Premium:** `from-[#1a2e4d] via-[#2E4A70] to-[#3b82f6]` en lugar del fondo blanco/naranja anterior.
- **Tipografía de Alto Contraste:** Título en blanco puro sobre fondo oscuro.
- **Botón "Ghost-Solid":** "Reforzar Debilidades" con fondo blanco y texto `#2E4A70`.
- **Sombreado Dinámico:** `shadow-blue-500/20` para profundidad.

### 9.2 Refactorización del Navbar (Sidebar)
- **Eliminación de Glitches:** Se suprimió la manipulación manual de estilos vía JavaScript (`e.target.style`) que causaba cuadros blancos al pasar el cursor.
- **Tailwind Puro:** Estados `hover` y `active` migrados a clases de Tailwind. Contraste del 100%: fondo `#014ba0` con texto blanco en el bloque de **Herramientas** y demás secciones.

### 9.3 Mejoras de Legibilidad (Modo Claro/Oscuro)
- **Contraste Forzado:** Clase `text-[#2E4A70]` en textos sobre fondos blancos para resolver el problema de "texto invisible" en modo claro.
- **`min-h-0` en Flex:** Permite que Flexbox calcule correctamente el desbordamiento y active el scroll en pantallas pequeñas.

### 9.4 Responsividad Móvil
- Controles de navegación inferiores rediseñados con `flex-1`, paddings y fuentes reducidos para adaptarse a pantallas pequeñas.

---

## 10. Estabilidad Técnica y Correcciones Críticas

### 10.1 Borrado en Cascada (`deleteFlashcardCompleta`)
**Archivo:** `src/lib/flashcardServices.js`

**Problema:** Eliminar una tarjeta generaba "Datos Huérfanos" en las subcolecciones de progreso.

**Solución:**
- **`writeBatch`:** Elimina la tarjeta principal y todos los registros de progreso en una sola operación atómica.
- **`collectionGroup` con filtro por `cardId`:** Localiza y purga el progreso de todos los estudiantes afectados.

### 10.2 Escudo de UI: Protección contra Datos Huérfanos
**Archivo:** `src/app/app/flashcards/page.jsx`

**Problema:** El Dashboard colapsaba al encontrar registros de progreso de tarjetas históricamente eliminadas.

**Solución:**
- **Filtrado Dinámico:** Durante la carga de métricas, se valida la existencia física de cada tarjeta crítica.
- **Auto-Limpieza de Vista:** Las tarjetas inexistentes se filtran de `metrics.criticalCards` automáticamente.

### 10.3 Renderizado Híbrido de Imágenes (Drive + Web Estándar)
**Archivos:** `src/lib/driveUtils.js`, `estudio/page.jsx`

**Problema:** El formateador de Google Drive interfería con URLs de imágenes web estándar.

**Solución:**
- **Detección de Dominio:** `driveUtils.js` discrimina estrictamente URLs de Google Drive antes de formatearlas.
- **Fallback Seguro:** `getDriveImageUrl` convierte URLs de Drive a miniatura (rendimiento) y retorna íntegras las URLs `http/https` estándar.
- **`<img>` en previsualizaciones:** Se usa `<img>` en lugar de `next/image` para permitir la carga desde cualquier dominio sin restricciones.

### 10.4 Actualización Atómica de Progreso
- **`setDoc` con `merge: true` + `increment`:** Elimina lecturas previas en Firestore, reduciendo costos de operación y latencia.

---

## 11. Estándares de Calidad y Accesibilidad

- ✅ **Accesibilidad:** Atajos de teclado globales (`ESPACIO`, `ENTER`, flechas, números `1-5`) sin dependencia de inputs activos.
- ✅ **Responsividad:** Layout adaptativo en todos los componentes, incluyendo modal de Radiografía y botonera de calificación.
- ✅ **Dark Mode:** Soporte nativo en todos los componentes interactivos mediante `ThemeContext`.
- ✅ **Rendimiento:** Actualizaciones atómicas en Firestore con `increment`, eliminando lecturas previas innecesarias.
- ✅ **Integridad de Datos:** Borrado en cascada atómico vía `writeBatch` + `collectionGroup`.
- ✅ **Consistencia Visual:** Tailwind puro en todos los estados de interacción, sin manipulación manual de estilos.

---

## 12. Guía de Ayuda al Usuario

### 12.1 El Ciclo de Estudio (Active Recall Mental)
El sistema utiliza **Recuperación Activa Mental**. No basta con leer; el cerebro debe esforzarse por recordar antes de ver la solución.

1. **Ver la Pregunta:** Se muestra el anverso. En tarjetas Cloze, los espacios aparecen como subrayados.
2. **Recordar mentalmente:** Intenta recuperar la respuesta sin ayuda.
3. **Revelar:** Pulsa la tarjeta, el botón central o la tecla `ESPACIO` / `ENTER`.
4. **Calificar:** Evalúa tu desempeño con la escala de emojis.

### 12.2 La Escala de Emojis

| Nivel | Emoji | Significado | Qué hace el sistema |
|:-----:|:-----:|:------------|:--------------------|
| **1** | 😭 | Olvido | No recordabas nada. La tarjeta **se queda en la sesión** y reinicia su dificultad. |
| **2** | 😠 | Difícil | Recordaste con mucho esfuerzo. Te la mostrará mañana. |
| **3** | 😐 | Normal | Recordaste bien tras unos segundos. El intervalo crecerá moderadamente. |
| **4** | 🙂 | Fácil | Recordaste rápido y sin dudar. El sistema amplía el tiempo de espera. |
| **5** | 🤩 | Perfecto | Respuesta instantánea. Se programa para mucho después. |

### 12.3 Tipos de Tarjetas
- **Pregunta:** Formato estándar. Ve la pregunta, recuerda la respuesta, revela y califica.
- **Completar Espacios (Cloze):** Identifica mentalmente las palabras que llenan los espacios subrayados. Al revelar, las palabras clave aparecen resaltadas en **azul negrita**.
- **Caso Clínico Corto:** Texto extenso de diagnóstico; usa el scroll vertical para leerlo completo.

### 12.4 Modos de Estudio
- **Estándar:** Solo las tarjetas que el algoritmo programó para hoy.
- **Intensivo:** Todo el mazo de un subtema, sin importar la fecha programada.
- **Refuerzo:** Solo tus debilidades activas (las que más te cuesta recordar).

### 12.5 Atajos de Teclado
| Tecla | Acción |
|:------|:-------|
| `ESPACIO` | Voltear la tarjeta |
| `ENTER` | Revelar respuesta |
| `→` | Siguiente tarjeta |
| `←` | Tarjeta anterior |
| `1` – `5` | Calificar instantáneamente |

> 💡 **Consejo:** La consistencia es clave. Revisa el Dashboard cada día para ver cuántas tarjetas tienes pendientes y evitar que el conocimiento se pierda en la curva del olvido.

---

