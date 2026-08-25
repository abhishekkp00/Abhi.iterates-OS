-- V8: Add Subject & Topic associations to Resources and AI Conversations
-- Enables Topic-Aware RAG retrieval and topic-bound AI tutor conversations

-- ============================================================
-- 1. Add subject_id and topic_id to resources table
-- ============================================================
ALTER TABLE resources ADD COLUMN subject_id UUID REFERENCES academic_subjects(id) ON DELETE SET NULL;
ALTER TABLE resources ADD COLUMN topic_id   UUID REFERENCES academic_topics(id)   ON DELETE SET NULL;

CREATE INDEX idx_resources_subject ON resources(subject_id);
CREATE INDEX idx_resources_topic   ON resources(topic_id);

-- ============================================================
-- 2. Add topic_id to ai_conversations table
-- ============================================================
ALTER TABLE ai_conversations ADD COLUMN topic_id UUID REFERENCES academic_topics(id) ON DELETE SET NULL;

CREATE INDEX idx_ai_conversations_topic ON ai_conversations(topic_id);
