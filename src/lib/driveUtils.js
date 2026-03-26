/**
 * Procesa un enlace de Google Drive para convertirlo en un enlace de visualización directa.
 * @param {string} url - URL original de Google Drive.
 * @returns {string} - URL formateada para exportación/visualización.
 */
export function formatDriveUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Manejar links que ya son directos o thumbnails para no procesarlos de nuevo
  if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/thumbnail?')) {
    return url;
  }

  try {
    // Extraer el ID del archivo de Google Drive de una URL de tipo /file/d/[ID]/view o similares
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1].split('/')[0];
      return `https://drive.google.com/uc?export=view&id=${id}`;
    }
    
    // Fallback con Regex para otros formatos posibles que contengan /d/[ID]
    const driveIdRegex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(driveIdRegex);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  } catch (error) {
    console.error("Error al formatear Drive URL:", error);
  }

  return url;
}
