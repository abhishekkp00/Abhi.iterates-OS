# Exam-Aware Revision Engine Architecture

The **Exam-Aware Revision Engine** in Abhi.iterates-OS dynamically adapts study strategy recommendations, assessment frequency, time allocation, and prerequisite handling based on proximity to upcoming exams and topic mastery evidence.

---

## 1. Core Principle & Non-Predictive Policy

> **Important Non-Predictive Disclaimer**:
> *The system does not predict exam scores or probability of passing.*
> It does not display speculative numbers such as "87% Ready" or "91% Pass Probability".

Instead, all metrics and recommendations represent **factual evidence**:
- `Study Coverage %`: percentage of exam topics with recorded study activity.
- `Assessment Coverage %`: percentage of exam topics with recorded assessment attempt evidence.
- `Topic Mastery State Breakdown`: counts of topics in `WEAK`, `DEVELOPING`, `STRONG`, and `INSUFFICIENT_DATA` states.

---

## 2. Deterministic Exam Study Phases

The system evaluates a global phase for each upcoming exam based on days remaining until the exam date:

| Global Phase | Days Remaining | Primary Strategy Focus |
| :--- | :---: | :--- |
| **`LEARNING`** | $> 21$ days | Initial concept study, foundational readings, and prerequisite understanding. |
| **`PRACTICE`** | $14 - 21$ days | Active problem solving, topic exercises, and practice assessments. |
| **`CONSOLIDATION`** | $7 - 14$ days | Reinforcing developing/strong concepts, targeted practice, and diagnostic tests. |
| **`REVISION`** | $3 - 7$ days | Active recall, weak area repair, error review, and high-frequency assessment. |
| **`FINAL_REVIEW`** | $0 - 3$ days | Key definitions, core recall, high-priority weak topics, and summary review. |
| **`EXAM_PASSED_DATE`** | $< 0$ days | Exam date has passed; excluded from active planning. |

### Topic Strategy Overrides
While an exam has a global phase, individual topics receive topic-specific strategy overrides based on:
- Global `ExamStudyPhase`
- Topic `LearningState` (`WEAK`, `DEVELOPING`, `STRONG`, `INSUFFICIENT_DATA`)
- Topic `LearningTrend` (`DECLINING`, `STABLE`, `IMPROVING`)
- High-Effort / Low-Performance condition ($\ge 300$ study minutes with `WEAK` state)

---

## 3. Exam Context in Planning

When generating a study plan with an `examId` context (`GeneratePlanRequest(examId = "...")`):
1. **Exam Topic Priority Boost**: Topics associated with the target exam receive a priority score boost and high exam urgency weighting.
2. **Explainable Session Reasons**: Planned study sessions explicitly link the exam title and days remaining to the topic state (e.g., *"OS Midterm Exam in 5 days + Deadlocks currently WEAK"*).
3. **Prerequisite Repair**: Weak prerequisite topics linked to exam topics are included in the schedule up to `maxPrerequisiteDepth` (2).
4. **Strong Topic Retention**: Strong topics are scheduled for short revision blocks (20–25 min) to protect retention without consuming scarce study time.

---

## 4. Final Review & Exam-Day Rules

- **`FINAL_REVIEW` ($0 - 3$ Days)**: Broad new topic introduction is avoided. Allocation prioritizes weak topics, declining topics, and core recall.
- **Exam Day ($0$ Days)**: Standard multi-hour study sessions are suppressed in favor of short final review blocks prior to exam time.
- **Past Exam Date ($< 0$ Days)**: Past exams are automatically excluded from upcoming study planning. Historical exam coverage and performance analytics remain fully accessible.

---

## 5. Multi-Exam & Priority Conflict Resolution

When multiple exams overlap:
- Urgency is evaluated per topic against the **nearest relevant upcoming exam** (preventing artificial double-counting).
- Ties between exams occurring on the same date are resolved by topic weakness, goal priority, and deterministic score tie-breaking.

---

## 6. REST API Endpoints

- `GET /api/v1/academic/exams/{id}/coverage`: Returns factual `ExamCoverageResponse` including study coverage %, assessment coverage %, topic breakdown items, and global phase.
- `GET /api/v1/academic/exams/{id}/phase`: Returns current `ExamStudyPhase`.
- `POST /api/v1/study-plans`: Accepts optional `examId` to generate an exam-focused study plan.
