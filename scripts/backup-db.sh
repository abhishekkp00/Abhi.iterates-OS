#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# AbhiIterates.OS Database Backup Script
#
# Generates a compressed PostgreSQL database dump from the postgres container.
# Usage: ./scripts/backup-db.sh [output_dir]
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="${POSTGRES_CONTAINER:-abhi-os-postgres}"
DB_NAME="${POSTGRES_DB:-abhi_iterates_os}"
DB_USER="${POSTGRES_USER:-postgres}"

mkdir -p "${OUTPUT_DIR}"

BACKUP_FILE="${OUTPUT_DIR}/db_backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "====================================================================="
echo " Starting Database Backup"
echo " Target Container: ${CONTAINER_NAME}"
echo " Database:         ${DB_NAME}"
echo " Backup File:       ${BACKUP_FILE}"
echo "====================================================================="

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "====================================================================="
echo " BACKUP SUCCESSFUL!"
echo " File Size: $(du -h "${BACKUP_FILE}" | cut -f1)"
echo "====================================================================="
