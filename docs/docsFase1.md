# Documentación Técnica - Fase 1: Sistema de Flashcards y Gestión de Identificadores

Esta fase se centró en la creación de un sistema robusto para la gestión de tarjetas de estudio (flashcards), implementando una jerarquía organizada de Especialidades y Temas, junto con validaciones críticas de integridad de datos.

## 1. Gestión de Especialidades y Temas (Identificadores)
**Ruta:** `src/app/admin/Cursos_Pago_Unico/categoria/page.jsx`

Se implementó un módulo administrativo centralizado para organizar el conocimiento médico en dos niveles:

*   **Especialidades (Categorías):** Almacenadas en la colección `course_categories`. Actúan como el área médica general (ej: Cardiología, Pediatría).
*   **Temas (Subcategorías/Identificadores):** Almacenados como una **subcolección** llamada `subcategories` dentro de cada especialidad. 
    *   **Función Clave:** Estos temas actúan como el **Identificador de Estudio**. Cada tarjeta debe estar obligatoriamente vinculada a un tema para que el usuario final pueda realizar sesiones de estudio enfocadas.

### Características de la interfaz:
*   **Doble Columna:** Navegación rápida entre especialidades y gestión inmediata de sus temas.
*   **Acciones Rápidas:** Creación y edición "inline" para evitar recargas de página.
*   **Alertas de SweetAlert2:** Feedback visual en cada acción (Guardar, Editar, Eliminar).
*   **Seguridad de Borrado:** Advertencia crítica al eliminar especialidades, informando sobre la eliminación en cascada de sus subtemas.

---

## 2. Registro y Edición de Tarjetas de Estudio
**Rutas:** 
*   `src/app/admin/flashcards/new/page.jsx`
*   `src/app/admin/flashcards/edit/[id]/page.jsx`

Se rediseñó el flujo de registro para adoptar la nueva jerarquía de identificadores:

*   **Selección Dinámica:** El usuario primero selecciona la Especialidad, lo que dispara una carga asíncrona de los Subtemas vinculados.
*   **Asignación Obligatoria:** Se eliminó el campo de texto libre "Tema". Ahora es obligatorio seleccionar un Identificador (Subtema) existente, garantizando la consistencia del banco de datos.
*   **Preservación de Datos:** En la edición, el sistema detecta automáticamente la especialidad y el tema previamente asignado, permitiendo cambios fluidos.

---

## 3. Sistema de Prevención de Errores (Runtime Protection)

Se detectó y corrigió un error crítico donde el componente `next/image` provocaba caídas del sistema al ingresar URLs incompletas (ej: mientras el usuario escribía `https://`).

### Mejoras implementadas:
*   **Validación Predictiva:** El estado de previsualización (`preview`) solo se actualiza si el texto ingresado tiene una longitud mínima (12 caracteres) y comienza con el protocolo `http`.
*   **Constructor URL:** Se utiliza la API nativa `new URL()` para verificar la validez de la cadena antes de intentar renderizarla.
*   **Try-Catch Rendering:** El componente `Image` está envuelto en lógica de control que retorna `null` si la URL es inválida, evitando que el error de "hostname" bloquee la ejecución del sitio.
*   **Validación de Envío:** El botón de guardado incluye una validación final con `SweetAlert2` que impide enviar enlaces mal formateados.

---

## 4. Listado Administrativo y Filtrado
**Ruta:** `src/app/admin/flashcards/page.jsx`

La vista principal de administración fue actualizada para reflejar los nuevos metadatos:

*   **Nuevas Columnas:** Se añadieron columnas para "Especialidad" e "Identificador (Tema)".
*   **Buscador Inteligente:** El filtro de búsqueda ahora busca coincidencias en la Pregunta, el Identificador, la Especialidad y los Tags simultáneamente.
*   **Diseño:** Se implementaron etiquetas (badges) de colores para diferenciar visualmente los identificadores de estudio.

---

## Estructura de Datos (Firestore)

### Colección: `flashcards`
```json
{
  "pregunta": "string",
  "respuesta": "string",
  "explicacion": "string",
  "especialidad": "ID_CATEGORIA",
  "especialidadNombre": "string",
  "subtema": "NOMBRE_SUBTEMAS (Identificador)",
  "driveUrl": "string",
  "tags": ["array"],
  "createdAt": "timestamp"
}
```

### Colección: `course_categories`
```json
{
  "name": "string",
  "subcategories": { // Subcolección
    "ID_SUB": {
      "name": "string"
    }
  }
}
```
