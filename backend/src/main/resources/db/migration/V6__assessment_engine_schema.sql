-- =============================================================================
-- Flyway Migration V6: Assessment Engine Schema
-- =============================================================================

-- 1. Assessments Table
CREATE TABLE assessments (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    subject_id UUID REFERENCES academic_subjects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    question_count INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 2. Assessment Topics Join Table
CREATE TABLE assessment_topics (
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (assessment_id, topic_id)
);

-- 3. Questions Table
CREATE TABLE questions (
    id UUID NOT NULL PRIMARY KEY,
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES academic_topics(id) ON DELETE SET NULL,
    question_text VARCHAR(4000) NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    difficulty VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    marks DOUBLE PRECISION NOT NULL DEFAULT 1.00,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    CONSTRAINT uq_question_assessment_order UNIQUE (assessment_id, question_order),
    CONSTRAINT chk_question_marks_positive CHECK (marks > 0)
);

-- 4. Question Options Table
CREATE TABLE question_options (
    id UUID NOT NULL PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text VARCHAR(2000) NOT NULL,
    option_order INTEGER NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_option_question_order UNIQUE (question_id, option_order)
);

-- 5. Assessment Attempts Table
CREATE TABLE assessment_attempts (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    total_marks DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    obtained_marks DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    percentage DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 6. Assessment Answers Table
CREATE TABLE assessment_answers (
    id UUID NOT NULL PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    marks_awarded DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_answer_attempt_question UNIQUE (attempt_id, question_id)
);

-- 7. Topic Assessment Performance Table
CREATE TABLE topic_assessment_performance (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    topic_id UUID NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    questions_attempted INTEGER NOT NULL DEFAULT 0,
    questions_correct INTEGER NOT NULL DEFAULT 0,
    marks_obtained DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    marks_available DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    percentage DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Indexes for Query Performance and Isolation
CREATE INDEX idx_assessments_user ON assessments (user_id);
CREATE INDEX idx_assessments_subject ON assessments (subject_id);
CREATE INDEX idx_questions_assessment ON questions (assessment_id);
CREATE INDEX idx_questions_topic ON questions (topic_id);
CREATE INDEX idx_attempts_user ON assessment_attempts (user_id);
CREATE INDEX idx_attempts_assessment ON assessment_attempts (assessment_id);
CREATE INDEX idx_answers_attempt ON assessment_answers (attempt_id);
CREATE INDEX idx_topic_perf_user_topic ON topic_assessment_performance (user_id, topic_id);
