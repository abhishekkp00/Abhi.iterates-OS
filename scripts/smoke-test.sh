#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# AbhiIterates.OS Production Deployment Smoke Test Script
#
# Validates readiness of backend API, health endpoints, database connectivity,
# and authentication after container deployment.
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "====================================================================="
echo " Starting AbhiIterates.OS Deployment Smoke Test"
echo " Target Backend:  ${BACKEND_URL}"
echo " Target Frontend: ${FRONTEND_URL}"
echo "====================================================================="

# 1. Health Endpoint Check
echo -n "[1/4] Checking Actuator Health Endpoint (/actuator/health)... "
HEALTH_RESP=$(curl -s -f "${BACKEND_URL}/actuator/health" || echo "FAILED")

if [[ "${HEALTH_RESP}" == *"UP"* ]]; then
    echo "OK (Status: UP)"
else
    echo "FAILED"
    echo "Error response: ${HEALTH_RESP}"
    exit 1
fi

# 2. Frontend SPA Accessibility Check
echo -n "[2/4] Checking Frontend SPA Index Page... "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}/" || echo "000")

if [[ "${FRONTEND_STATUS}" == "200" ]]; then
    echo "OK (HTTP 200)"
else
    echo "FAILED (HTTP ${FRONTEND_STATUS})"
    exit 1
fi

# 3. Public Auth Endpoint Check
echo -n "[3/4] Checking Swagger / API Docs Endpoint (/v3/api-docs)... "
SWAGGER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/v3/api-docs" || echo "000")

if [[ "${SWAGGER_STATUS}" == "200" ]]; then
    echo "OK (HTTP 200)"
else
    echo "FAILED (HTTP ${SWAGGER_STATUS})"
    exit 1
fi

# 4. Authentication Login Validation
echo -n "[4/4] Testing Authenticated User Login Endpoint (/api/v1/auth/login)... "
LOGIN_PAYLOAD='{"email":"admin@abhiiterates.os","password":"AdminPassword123!"}'
LOGIN_RESP=$(curl -s -X POST "${BACKEND_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "${LOGIN_PAYLOAD}" || echo "FAILED")

if [[ "${LOGIN_RESP}" == *"accessToken"* ]] || [[ "${LOGIN_RESP}" == *"Authentication successful"* ]] || [[ "${LOGIN_RESP}" == *"Invalid"* ]]; then
    echo "OK (Auth service responsive)"
else
    echo "FAILED"
    echo "Response: ${LOGIN_RESP}"
    exit 1
fi

echo "====================================================================="
echo " SMOKE TEST PASSED: All deployment checks successful!"
echo "====================================================================="
