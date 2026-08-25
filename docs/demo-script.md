# 5-Minute Technical Demo Script

This script guides a 5-minute technical demonstration of **Abhi.iterates-OS** for code reviews, interviews, or project presentations.

---

## 5-Minute Walkthrough Timeline

```
[0:00 - 0:45]  1. Overview & Command Center Dashboard
[0:45 - 1:30]  2. Academic Topic Workspace & Prerequisite DAG
[1:30 - 2:30]  3. Study Session & Contextual RAG AI Tutor
[2:30 - 3:30]  4. "Test Me" Direct Assessment Launch & Attempt
[3:30 - 4:30]  5. Learning Analytics & Dynamic Replanning
[4:30 - 5:00]  6. Exam-Aware Revision Engine Summary
```

---

## Detailed Step-by-Step Script

### 1. Overview & Command Center Dashboard (0:00 - 0:45)
- **Action**: Log in with demo credentials (`admin@abhiiterates.os` / `AdminPassword123!`) and navigate to `/academic`.
- **Narration**:
  > *"Abhi.iterates-OS is an academic learning operating system designed around a closed feedback loop. On the Command Center dashboard, notice how today's study plan, upcoming exam countdowns, plan adherence, and weak topic alerts are aggregated in real time."*

### 2. Central Topic Workspace (0:45 - 1:30)
- **Action**: Click on a topic (e.g., *"Operating Systems - Deadlocks"*).
- **Narration**:
  > *"Every topic has a dedicated workspace at `/academic/topics/:id` showing mastery state (`WEAK`), total study hours, assessment accuracy, recommended study strategy, linked resources, and study history."*

### 3. Study Session & Contextual RAG Tutor (1:30 - 2:30)
- **Action**: Click **"Start Study Session"**, then click **"Need Help? Open Tutor"**. Ask: *"How does Banker's algorithm prevent deadlocks?"*
- **Narration**:
  > *"Notice how the active topic ID is preserved in the URL (`/ai?topicId=...`). The tutor runs vector retrieval over embedded textbook PDFs using PostgreSQL `pgvector` and streams grounded responses with Markdown source citations via Server-Sent Events (SSE)."*

### 4. "Test Me" Assessment Launch & Attempt (2:30 - 3:30)
- **Action**: Click **"Test Me"** in the AI chat header, launch a 5-question adaptive assessment, complete the answers, and click **Submit**.
- **Narration**:
  > *"When the student understands the concept, clicking 'Test Me' generates a topic-tailored assessment. Submitting answers immediately scores the attempt, reveals explanations, and updates the student's evidence base."*

### 5. Learning Analytics & Dynamic Replanning (3:30 - 4:30)
- **Action**: Return to `/academic` Command Center and click **"Generate Adaptive Study Plan"**.
- **Narration**:
  > *"The Learning Analytics engine re-evaluates student evidence. If performance on a topic improves from WEAK to STRONG, the deterministic planner dynamically adjusts time allocations and shifts target focus to remaining weak topics."*

### 6. Exam-Aware Revision Engine (4:30 - 5:00)
- **Action**: Navigate to an Exam Detail page (`/academic/exams/:id`).
- **Narration**:
  > *"As exam day approaches, the Exam Revision Engine automatically shifts planning phase from LEARNING to REVISION, prioritizing high-weight weak topics and displaying factual coverage metrics."*
