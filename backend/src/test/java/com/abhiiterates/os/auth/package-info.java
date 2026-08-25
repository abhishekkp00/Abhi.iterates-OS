/**
 * Security module test package.
 *
 * Planned test coverage:
 *
 * - JwtTokenProviderTest: Unit tests for token generation, validation, expiry,
 *   tampered-signature rejection, and email extraction.
 *
 * - JwtAuthenticationFilterTest: MockMvc tests verifying that requests with no
 *   token receive 401, requests with expired tokens receive 401, and requests
 *   with valid tokens are authenticated correctly.
 *
 * - SecurityConfigTest: Integration tests verifying that public endpoints are
 *   accessible without authentication, and protected endpoints return 401.
 *
 * - AccessControlTest: @WithMockUser tests verifying that ADMIN-only endpoints
 *   return 403 for regular users.
 */
package com.abhiiterates.os.auth;
