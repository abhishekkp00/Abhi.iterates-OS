/**
 * AI module test package.
 *
 * Planned test coverage for Phase 2 (RAG baseline):
 *
 * - AiChatServiceImplTest: Unit tests for conversation resolution, message history
 *   construction, saveMessages, and the extractPdfContext chunking logic.
 *
 * - AiConversationRepositoryTest: Slice tests (@DataJpaTest) for
 *   findByUserOrderByUpdatedAtDesc and findByIdAndUserWithMessages.
 *
 * - AiChatControllerTest: MockMvc slice tests for all /api/v1/ai/** endpoints,
 *   verifying auth enforcement (401 without JWT, 200 with valid JWT).
 *
 * - StreamingIntegrationTest: Full SpringBootTest verifying SSE token streaming
 *   produces correct event types (token, done, error).
 */
package com.abhiiterates.os.ai;
