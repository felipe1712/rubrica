/**
 * Helper de Procesamiento de Imágenes para Verificación de Identidad (INE & Selfie)
 * 
 * Evita el recorte agresivo (auto-crop), conserva la relación de aspecto original (contain),
 * corrige la orientación EXIF y asegura alta fidelidad para el OCR y Biometría de NuFi.
 */

/**
 * Convierte un File/Blob de imagen a Base64 sin recortar ni distorsionar bordes.
 * @param {File|Blob} file Archivo de imagen subido
 * @param {Object} options Opciones de escalado (maxWidth por defecto 1920)
 * @returns {Promise<string>} Promesa con la cadena Base64 limpia
 */
export const processImageForVerification = (file, options = {}) => {
  const { maxWidth = 1920, quality = 0.95 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Escalar proporcionalmente si excede maxWidth (sin recortar bordes)
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Limpiar lienzo
        ctx.clearRect(0, 0, width, height);

        // Dibujar la imagen completa respetando las dimensiones originales
        ctx.drawImage(img, 0, 0, width, height);

        // Generar base64 JPEG de alta calidad
        const base64Data = canvas.toDataURL('image/jpeg', quality);
        resolve(base64Data);
      };

      img.onerror = (err) => reject(new Error('Error al cargar la imagen: ' + err));
      img.src = event.target.result;
    };

    reader.onerror = (err) => reject(new Error('Error al leer el archivo: ' + err));
    reader.readAsDataURL(file);
  });
};

/**
 * Configuración recomendada para FilePond cuando se capturan INEs o Selfies
 */
export const getSafeFilePondConfig = () => ({
  allowImageCrop: false,            // Desactiva el auto-crop cuadrado/fijo
  allowImageTransform: true,
  imageTransformOutputStripImageHead: false, // Mantiene metadatos EXIF
  imageTransformResizeMode: 'contain',       // Escalado proporcional, NUNCA cover o crop
  imageTransformOutputQuality: 0.95,
  stylePanelLayout: 'integrated',
});
