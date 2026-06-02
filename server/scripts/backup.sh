#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  RÚBRICA — Script de Backup Automático
#
#  Estructura real en servidor:
#    /opt/rubrica/              ← raíz del repo (git clone)
#    /opt/rubrica/server/       ← docker-compose.yml y datos
#    /opt/rubrica/rubrica/saas/ ← frontend React
#
#  Cron: 0 2 * * * /opt/rubrica/server/scripts/backup.sh >> /opt/rubrica/server/backups/backup.log 2>&1
# ════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="/opt/rubrica"
SERVER_DIR="${REPO_ROOT}/server"
BACKUP_DIR="${SERVER_DIR}/backups"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

source "${SERVER_DIR}/.env"

echo "${LOG_PREFIX} ══════ Backup iniciado ══════"
mkdir -p "${BACKUP_DIR}/${DATE}"

# 1. PostgreSQL
echo "${LOG_PREFIX} Backing up PostgreSQL..."
docker exec rubrica_postgres pg_dumpall -U "${POSTGRES_USER}" \
    | gzip > "${BACKUP_DIR}/${DATE}/postgres_all_${DATE}.sql.gz"
echo "${LOG_PREFIX} ✅ PostgreSQL OK"

# 2. Documentos DocuSeal
echo "${LOG_PREFIX} Backing up DocuSeal storage..."
tar czf "${BACKUP_DIR}/${DATE}/docuseal_storage_${DATE}.tar.gz" \
    "${SERVER_DIR}/docuseal/storage/" 2>/dev/null || true
echo "${LOG_PREFIX} ✅ DocuSeal storage OK"

# 3. Stirling configs
echo "${LOG_PREFIX} Backing up Stirling configs..."
tar czf "${BACKUP_DIR}/${DATE}/stirling_configs_${DATE}.tar.gz" \
    "${SERVER_DIR}/stirling/" 2>/dev/null || true
echo "${LOG_PREFIX} ✅ Stirling OK"

# 4. .env
cp "${SERVER_DIR}/.env" "${BACKUP_DIR}/${DATE}/env_${DATE}.bak"
echo "${LOG_PREFIX} ✅ .env OK"

# 5. Tamaño y limpieza
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${DATE}" | cut -f1)
echo "${LOG_PREFIX} 📦 Tamaño: ${BACKUP_SIZE}"
find "${BACKUP_DIR}" -maxdepth 1 -type d -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true
echo "${LOG_PREFIX} ══════ Backup completado: ${DATE} ══════"
echo ""
