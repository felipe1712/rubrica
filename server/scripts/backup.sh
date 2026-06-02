#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  RÚBRICA — Script de Backup Automático
#  Archivo: /opt/rubrica/scripts/backup.sh
#  Cron:    0 2 * * * /opt/rubrica/scripts/backup.sh >> /opt/rubrica/backups/backup.log 2>&1
# ════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuración ──────────────────────────────────────────────
BACKUP_DIR="/opt/rubrica/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

# Cargar variables de entorno
source /opt/rubrica/.env

echo "${LOG_PREFIX} ══════ Backup iniciado ══════"

# ─── Crear directorio de backup con fecha ───────────────────────
mkdir -p "${BACKUP_DIR}/${DATE}"

# ─── 1. Backup PostgreSQL (rubrica_prod + docuseal_prod) ────────
echo "${LOG_PREFIX} Backing up PostgreSQL..."
docker exec rubrica_postgres pg_dumpall \
    -U "${POSTGRES_USER}" \
    | gzip > "${BACKUP_DIR}/${DATE}/postgres_all_${DATE}.sql.gz"

if [ $? -eq 0 ]; then
    echo "${LOG_PREFIX} ✅ PostgreSQL backup OK"
else
    echo "${LOG_PREFIX} ❌ PostgreSQL backup FALLÓ"
fi

# ─── 2. Backup de documentos DocuSeal ───────────────────────────
echo "${LOG_PREFIX} Backing up documentos DocuSeal..."
tar czf "${BACKUP_DIR}/${DATE}/docuseal_storage_${DATE}.tar.gz" \
    /opt/rubrica/docuseal/storage/ 2>/dev/null || true
echo "${LOG_PREFIX} ✅ DocuSeal storage backup OK"

# ─── 3. Backup de configuración Stirling-PDF ────────────────────
echo "${LOG_PREFIX} Backing up configuración Stirling..."
tar czf "${BACKUP_DIR}/${DATE}/stirling_configs_${DATE}.tar.gz" \
    /opt/rubrica/stirling/ 2>/dev/null || true
echo "${LOG_PREFIX} ✅ Stirling configs backup OK"

# ─── 4. Backup del .env (encriptado) ────────────────────────────
echo "${LOG_PREFIX} Backing up .env..."
cp /opt/rubrica/.env "${BACKUP_DIR}/${DATE}/env_${DATE}.bak"
echo "${LOG_PREFIX} ✅ .env backup OK"

# ─── 5. Tamaño del backup ───────────────────────────────────────
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${DATE}" | cut -f1)
echo "${LOG_PREFIX} 📦 Tamaño del backup: ${BACKUP_SIZE}"

# ─── 6. Eliminar backups viejos ─────────────────────────────────
echo "${LOG_PREFIX} Eliminando backups de más de ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}" -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true
echo "${LOG_PREFIX} ✅ Limpieza OK"

echo "${LOG_PREFIX} ══════ Backup completado: ${DATE} ══════"
echo ""
