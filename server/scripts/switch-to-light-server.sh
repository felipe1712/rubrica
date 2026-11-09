#!/bin/bash
# ══════════════════════════════════════════════════════════════════
# Script para apagar la infraestructura pesada y liberar ~3.5 GB RAM
# Ejecutar en el servidor VPS: /opt/rubricalo/server o /opt/rubrica/server
# ══════════════════════════════════════════════════════════════════

set -e

echo "=========================================================="
echo "  RÚBRICA: Transición a Infraestructura Ligera Híbrida    "
echo "=========================================================="

# 1. Detener y remover contenedores pesados que ya no se usan
echo ">>> Deteniendo contenedores pesados (OnlyOffice, Stirling-PDF, DocuSeal, MinIO)..."
docker stop rubrica_onlyoffice rubrica_stirling rubrica_docuseal rubrica_minio 2>/dev/null || true
docker rm rubrica_onlyoffice rubrica_stirling rubrica_docuseal rubrica_minio 2>/dev/null || true

# 2. Levantar el stack ligero (Postgres, Redis, API Gateway, Frontend)
echo ">>> Levantando stack optimizado con docker-compose.light.yml..."
docker compose -f docker-compose.light.yml up -d --build

# 3. Recargar Nginx para servir la nueva landing y el binario de descarga
echo ">>> Recargando Nginx..."
sudo systemctl reload nginx || sudo nginx -s reload

echo "=========================================================="
echo "  ¡Listo! Infraestructura ligera activa y ~3.5 GB de RAM liberados."
echo "  La landing ya sirve el .exe y la API atiende el saldo y Brevo."
echo "=========================================================="
