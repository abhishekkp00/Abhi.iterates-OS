-- =============================================================================
-- Flyway Migration V5: Academic Domain (Subjects, Topics, Study Sessions, Topic Progress, Learning Activities)
-- =============================================================================

-- 1. Academic Subjects Table
CREATE TABLE academic_subjects (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    color VARCHAR(50),
    description VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 2. Academic Topics Table
CREATE TABLE academic_topics (
    id UUID NOT NULL PRIMARY KEY,
    subject_id UUID NOT NULL REFERENCES academic_subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 3. Study Sessions Table (Source of Truth)
CREATE TABLE study_sessions (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    topic_id UUID NOT NULL REFERENCES academic_topics(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    status VARCHAR(50) NOT NULL,
    session_type VARCHAR(50) NOT NULL,
    notes VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 4. Topic Progress Table (Derived Projection)
CREATE TABLE topic_progress (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    topic_id UUID NOT NULL REFERENCES academic_topics(id),
    total_study_minutes INTEGER NOT NULL DEFAULT 0,
    session_count INTEGER NOT NULL DEFAULT 0,
    last_studied_at TIMESTAMP WITH TIME ZONE,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_topic_progress_user_topic UNIQUE (user_id, topic_id)
);

-- 5. Learning Activities Table (Event History)
CREATE TABLE learning_activities (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    topic_id UUID NOT NULL REFERENCES academic_topics(id),
    study_session_id UUID REFERENCES study_sessions(id) ON DELETE SET NULL,
    activity_type VARCHAR(100) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata_json VARCHAR(2000),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Performance and Security Isolation Indexes
CREATE INDEX idx_academic_subj_user ON academic_subjects (user_id);
CREATE INDEX idx_academic_topic_subj ON academic_topics (subject_id);
CREATE INDEX idx_study_sess_user_start ON study_sessions (user_id, started_at DESC);
CREATE INDEX idx_study_sess_topic_start ON study_sessions (topic_id, started_at DESC);
CREATE INDEX idx_study_sess_user_status ON study_sessions (user_id, status);
CREATE INDEX idx_learning_act_user_time ON learning_activities (user_id, occurred_at DESC);
