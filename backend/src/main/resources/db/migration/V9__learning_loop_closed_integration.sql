-- V9: Closed Learning Loop Integration Schema
-- Connects PlannedStudySession to actual StudySession and adds StudyPlan staleness tracking

-- ============================================================
-- 1. Add needs_review, stale_reason, and generated_at to study_plans
-- ============================================================
ALTER TABLE study_plans ADD COLUMN needs_review BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE study_plans ADD COLUMN stale_reason VARCHAR(500);
ALTER TABLE study_plans ADD COLUMN generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_study_plans_needs_review ON study_plans(user_id, needs_review);

-- ============================================================
-- 2. Add is_completed, completed_at, actual_minutes to planned_study_sessions
-- ============================================================
ALTER TABLE planned_study_sessions ADD COLUMN is_completed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE planned_study_sessions ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE planned_study_sessions ADD COLUMN actual_minutes INTEGER;

-- ============================================================
-- 3. Add planned_study_session_id to study_sessions table
-- ============================================================
ALTER TABLE study_sessions ADD COLUMN planned_study_session_id UUID REFERENCES planned_study_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_study_sess_planned ON study_sessions(planned_study_session_id);
