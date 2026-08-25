-- V7: Adaptive Study Planner Schema
-- Creates: topic_prerequisites, academic_goals, planner_preferences, study_plans, planned_study_sessions

-- ============================================================
-- 1. Topic Prerequisites (prerequisite DAG)
-- ============================================================
CREATE TABLE topic_prerequisites (
    id                    UUID         NOT NULL PRIMARY KEY,
    topic_id              UUID         NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    prerequisite_topic_id UUID         NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_topic_prerequisite UNIQUE (topic_id, prerequisite_topic_id),
    CONSTRAINT chk_no_self_prereq CHECK (topic_id <> prerequisite_topic_id)
);

CREATE INDEX idx_prereq_topic    ON topic_prerequisites(topic_id);
CREATE INDEX idx_prereq_prereq   ON topic_prerequisites(prerequisite_topic_id);

-- ============================================================
-- 2. Academic Goals (deadline-driven urgency signals)
-- ============================================================
CREATE TABLE academic_goals (
    id           UUID         NOT NULL PRIMARY KEY,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id     UUID         NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    target_state VARCHAR(30)  NOT NULL,       -- STRONG | DEVELOPING
    target_date  DATE         NOT NULL,
    description  VARCHAR(500),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_goal_user_topic_active UNIQUE (user_id, topic_id, is_active)
);

CREATE INDEX idx_academic_goals_user        ON academic_goals(user_id, is_active, target_date);
CREATE INDEX idx_academic_goals_topic       ON academic_goals(topic_id);

-- ============================================================
-- 3. Planner Preferences (per-user availability config)
-- ============================================================
CREATE TABLE planner_preferences (
    id                              UUID        NOT NULL PRIMARY KEY,
    user_id                         UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    available_minutes_per_day       INT         NOT NULL DEFAULT 120,
    preferred_session_length_minutes INT        NOT NULL DEFAULT 45,
    planning_horizon_days           INT         NOT NULL DEFAULT 7,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_pref_daily_min    CHECK (available_minutes_per_day BETWEEN 15 AND 720),
    CONSTRAINT chk_pref_session_len  CHECK (preferred_session_length_minutes BETWEEN 15 AND 180),
    CONSTRAINT chk_pref_horizon      CHECK (planning_horizon_days BETWEEN 1 AND 90)
);

-- ============================================================
-- 4. Study Plans (recommendation artifact — NOT actual sessions)
-- ============================================================
CREATE TABLE study_plans (
    id                    UUID         NOT NULL PRIMARY KEY,
    user_id               UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',  -- DRAFT|ACTIVE|EXPIRED|COMPLETED
    plan_start_date       DATE         NOT NULL,
    plan_end_date         DATE         NOT NULL,
    total_planned_minutes INT          NOT NULL DEFAULT 0,
    total_available_minutes INT        NOT NULL DEFAULT 0,
    capacity_warning      BOOLEAN      NOT NULL DEFAULT FALSE,
    capacity_warning_msg  VARCHAR(500),
    generation_context    TEXT,                 -- JSON snapshot of inputs used at generation time
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_plan_status CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'COMPLETED')),
    CONSTRAINT chk_plan_dates   CHECK (plan_end_date >= plan_start_date)
);

CREATE INDEX idx_study_plans_user_status ON study_plans(user_id, status);
CREATE INDEX idx_study_plans_user_date   ON study_plans(user_id, plan_start_date DESC);

-- ============================================================
-- 5. Planned Study Sessions (line items within a plan)
-- ============================================================
CREATE TABLE planned_study_sessions (
    id                    UUID         NOT NULL PRIMARY KEY,
    study_plan_id         UUID         NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    user_id               UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id              UUID         NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    day_number            INT          NOT NULL,        -- 1-based (Day 1, Day 2, ... N)
    recommended_minutes   INT          NOT NULL,
    priority_score        DOUBLE PRECISION NOT NULL,
    priority_reason       VARCHAR(1000) NOT NULL,
    session_type          VARCHAR(30)  NOT NULL DEFAULT 'STUDY',
    is_manual_override    BOOLEAN      NOT NULL DEFAULT FALSE,
    override_notes        VARCHAR(500),
    display_order         INT          NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT chk_pss_day        CHECK (day_number >= 1),
    CONSTRAINT chk_pss_minutes    CHECK (recommended_minutes BETWEEN 5 AND 480)
);

CREATE INDEX idx_planned_sessions_plan ON planned_study_sessions(study_plan_id, day_number, display_order);
CREATE INDEX idx_planned_sessions_user ON planned_study_sessions(user_id);
