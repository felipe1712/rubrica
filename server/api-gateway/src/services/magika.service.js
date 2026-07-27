/**
 * magika.service.js
 * Servicio de verificación de tipo de archivo usando Google Magika (IA).
 * 
 * Detecta el tipo REAL del archivo analizando su contenido binario,
 * independientemente de la extensión o el mimetype declarado por el cliente.
 * Esto previene ataques de file type confusion (ej: malware.exe renombrado como contrato.pdf).
 */

let magikaInstance = null;

// Tipos permitidos en Rubricalo (etiquetas que devuelve Magika)
const ALLOWED_LABELS = new Set([
  'pdf',
  'docx', 'doc',
  'xlsx', 'xls',
  'pptx', 'ppt',
  'txt',
  'odt', 'ods', 'odp',  // OpenDocument
  'rtf',
]);

// Tipos que son especialmente peligrosos — log adicional aunque ya sean rechazados
const DANGEROUS_LABELS = new Set([
  'exe', 'dll', 'so', 'elf',     // Ejecutables
  'bat', 'cmd', 'ps1', 'sh',     // Scripts
  'php', 'py', 'rb', 'js',       // Scripts web/server
  'zip', 'rar', '7z', 'tar',     // Comprimidos (pueden contener malware)
  'jar', 'class',                 // Java
  'html', 'svg',                  // Pueden embeber scripts XSS
]);

/**
 * Inicializa Magika de forma lazy (solo al primer uso).
 * El modelo ONNX tarda ~1-2s en cargar, después las verificaciones son <100ms.
 */
async function getMagika() {
  if (!magikaInstance) {
    const { Magika } = await import('magika');
    magikaInstance = new Magika();
    console.log('[Magika] Modelo cargado correctamente.');
  }
  return magikaInstance;
}

/**
 * Verifica el tipo real de un archivo usando Magika.
 * 
 * @param {string} filePath - Ruta absoluta al archivo en disco
 * @param {string} declaredMime - Mimetype declarado por el cliente (para comparar)
 * @returns {{ ok: boolean, detectedLabel: string, score: number, isDangerous: boolean, error?: string }}
 */
async function verifyFileType(filePath, declaredMime = '') {
  try {
    const fs = await import('fs');
    const fileBuffer = fs.default.readFileSync(filePath);

    const magika = await getMagika();
    const result = await magika.identifyBytes(fileBuffer);

    const detectedLabel = result.output.label;
    const score = result.output.score;
    const isDangerous = DANGEROUS_LABELS.has(detectedLabel);
    const isAllowed = ALLOWED_LABELS.has(detectedLabel);

    if (isDangerous) {
      console.warn(`[Magika] ⚠️  ALERTA DE SEGURIDAD: archivo detectado como '${detectedLabel}' (score: ${(score * 100).toFixed(1)}%) — mimetype declarado: '${declaredMime}' — RECHAZADO`);
    } else if (!isAllowed) {
      console.info(`[Magika] Tipo no permitido: '${detectedLabel}' (score: ${(score * 100).toFixed(1)}%)`);
    } else {
      console.info(`[Magika] ✅ Archivo verificado: '${detectedLabel}' (score: ${(score * 100).toFixed(1)}%)`);
    }

    return {
      ok: isAllowed,
      detectedLabel,
      score,
      isDangerous,
    };
  } catch (err) {
    console.error('[Magika] Error durante verificación:', err.message);
    // Si Magika falla, no bloqueamos la subida — fail-open para no romper el flujo
    // pero sí dejamos un warning en el log
    return { ok: true, detectedLabel: 'unknown', score: 0, isDangerous: false, error: err.message };
  }
}

module.exports = { verifyFileType, ALLOWED_LABELS, DANGEROUS_LABELS };
