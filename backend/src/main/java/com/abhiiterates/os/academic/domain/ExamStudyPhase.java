package com.abhiiterates.os.academic.domain;

/**
 * Deterministic study phase for an upcoming academic exam.
 */
public enum ExamStudyPhase {
    /** > 21 days remaining: focus on initial topic study and foundational learning. */
    LEARNING,

    /** 14-21 days remaining: focus on problem solving, exercises, and practice assessments. */
    PRACTICE,

    /** 7-14 days remaining: focus on reinforcing developing/strong concepts and targeted practice. */
    CONSOLIDATION,

    /** 3-7 days remaining: focus on weak area repair, error review, and active recall. */
    REVISION,

    /** 0-3 days remaining: focus on final review, key definitions, and high-priority weak topics. */
    FINAL_REVIEW,

    /** Exam date has passed. */
    EXAM_PASSED_DATE
}
