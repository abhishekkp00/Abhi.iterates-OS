-- V10: Academic Exams Schema
-- Tracks upcoming exams and links exams to academic subjects and topics

CREATE TABLE exams (
    id          UUID NOT NULL PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id  UUID REFERENCES academic_subjects(id) ON DELETE SET NULL,
    title       VARCHAR(150) NOT NULL,
    description TEXT,
    exam_date   DATE NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exams_user_date ON exams(user_id, exam_date);

CREATE TABLE exam_topics (
    exam_id   UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    topic_id  UUID NOT NULL REFERENCES academic_topics(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, topic_id)
);

CREATE INDEX idx_exam_topics_topic ON exam_topics(topic_id);
