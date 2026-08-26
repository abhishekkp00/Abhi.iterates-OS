-- =============================================================================
-- Flyway Migration V11: Performance Indexes
--
-- Evidence-driven indexes added based on query analysis of the performance audit.
-- Only indexes NOT already present in V5–V10 are created here.
--
-- Indexes already present (not duplicated here):
--   V5: idx_study_sess_user_start (user_id, started_at DESC)
--       idx_study_sess_user_status (user_id, status)
--       idx_academic_subj_user (user_id), idx_academic_topic_subj (subject_id)
--   V6: idx_topic_perf_user_topic (user_id, topic_id)
--       idx_attempts_user (user_id), idx_answers_attempt (attempt_id)
--   V7: idx_academic_goals_user (user_id, is_active, target_date)
--       idx_academic_goals_topic (topic_id)
--       idx_planned_sessions_plan (study_plan_id, day_number, display_order)
--       idx_study_plans_user_status (user_id, status)
-- =============================================================================

-- ── 1. topic_assessment_performance: add evaluated_at DESC to existing index ─
-- The existing idx_topic_perf_user_topic covers (user_id, topic_id) for filtering.
-- Adding evaluated_at allows ORDER BY to use the index, eliminating a sort step
-- in the bulk query: findAllByUserIdAndTopicIdIn(...) ORDER BY evaluatedAt DESC.
CREATE INDEX IF NOT EXISTS idx_topic_perf_user_topic_eval
    ON topic_assessment_performance (user_id, topic_id, evaluated_at DESC);

-- ── 2. resources: user_id (for vector search WHERE r.user_id = :userId) ─────
-- VectorSearchRepositoryImpl.searchSimilarChunks() filters resources by
-- user_id as the first predicate. This index supports fast user-isolation
-- in the vector search JOIN path.
CREATE INDEX IF NOT EXISTS idx_resources_user
    ON resources (user_id);

-- ── 3. rag_documents: (resource_id, status, embedding_status) ───────────────
-- VectorSearchRepositoryImpl joins rag_documents with:
--   WHERE d.status = 'COMPLETED' AND d.embedding_status = 'COMPLETED'
-- A composite covering resource_id + both status columns supports the JOIN
-- and filter in one index scan without a full table scan.
CREATE INDEX IF NOT EXISTS idx_rag_docs_resource_status
    ON rag_documents (resource_id, status, embedding_status);

-- ── 4. study_sessions: covering index for dashboard range-status queries ─────
-- AcademicDashboardServiceImpl calls:
--   findByUserAndStatusAndStartedAtBetweenOrderByStartedAtDesc
-- The existing V5 indexes are (user_id, started_at) and (user_id, status) separately.
-- A composite covering all three predicate columns avoids two separate index scans.
CREATE INDEX IF NOT EXISTS idx_study_sess_user_status_start
    ON study_sessions (user_id, status, started_at DESC);
