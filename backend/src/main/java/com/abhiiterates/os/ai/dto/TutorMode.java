package com.abhiiterates.os.ai.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Controlled tutoring modes for the Topic-Aware RAG Tutor.
 */
@Getter
@RequiredArgsConstructor
public enum TutorMode {
    /** Teach concepts from fundamentals with clear explanations and simple examples */
    EXPLAIN("Explain from Fundamentals"),

    /** Concise, revision-oriented bulleted explanation of core concepts */
    SUMMARY("Concise Summary"),

    /** In-depth explanation exploring technical edge cases and deep connections */
    DEEP_DIVE("Deep Dive & Edge Cases"),

    /** Exam-oriented recap targeting key principles, formulas, and common traps */
    REVISION("Exam Revision"),

    /** Answer the student's specific question directly */
    QUESTION("Specific Question"),

    /** Target conceptual gaps following a weak assessment attempt */
    REVIEW("Assessment Concept Gap Review");

    private final String description;
}
