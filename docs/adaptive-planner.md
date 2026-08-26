# Adaptive Learning Engine & Study Planner Architecture

The **Adaptive Learning Engine** in Abhi.iterates-OS is a deterministic, explainable, and reproducible study time allocation system. It calculates optimal daily study schedules grounded in student mastery evidence, upcoming exam urgency, learning trends, goals, and prerequisite dependencies.

---

## 1. Core Principle & Architecture

The engine answers one fundamental question:
> *"Given the student's current evidence and constraints, how should today's available study time be allocated?"*

It does **not** rely on LLMs or non-deterministic ML models to rank topics or allocate time. Given identical evidence, constraints, and configuration, it produces the exact same schedule every time.

### System Pipeline
```
               RAW EVIDENCE
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  Assessments   Study Time    Exams/Goals
        │           │           │
        └───────────┼───────────┘
                    ▼
             Learning State
                    │
                    ▼
           Topic Priority Engine
                    │
                    ▼
            TopicPriorityFactors (Ranked)
                    │
                    ▼
         Time Allocation Engine
                    │
                    ▼
           Session Scheduler
                    │
                    ▼
              Study Plan
                    │
                    ▼
          Planned Study Sessions
```

---

## 2. Topic Priority Scoring Model

Each topic $T$ is assigned a normalized priority score in the range $[0.0, 1.0]$:

$$\text{rawScore} = \sum_{c} (\text{factor}_c \times \text{weight}_c)$$

All weights are configured in `application.yml` (`academic.planner.weights`) and validated at startup to ensure $\sum \text{weight}_c = 1.0$.

### Component Breakdown

| Component | Weight | Heuristic / Formula |
| :--- | :---: | :--- |
| **Weakness (`weaknessFactor`)** | `0.30` | `WEAK` = 1.0, `INSUFFICIENT_DATA` = 0.6, `DEVELOPING` = 0.5, `STRONG` = 0.0. *(INSUFFICIENT_DATA is distinct from STRONG).* |
| **Exam Urgency (`examUrgencyFactor`)** | `0.20` | Computed **only** for exams associated with topic $T$. Takes $\max(\text{urgency})$ across multiple exams to avoid inflation.<br>• 0–6 days: 1.0<br>• 7–14 days: 0.7<br>• 15–30 days: 0.4<br>• > 30 days: 0.1 |
| **Learning Trend (`trendFactor`)** | `0.15` | `DECLINING` = 1.0, `STABLE` / `INSUFFICIENT_DATA` = 0.5, `IMPROVING` = 0.1. |
| **Recency (`recencyFactor`)** | `0.10` | Days since last study session:<br>• > 14 days: 1.0<br>• 7–14 days: 0.7<br>• Never studied: 0.7<br>• 3–7 days: 0.5<br>• 1–3 days: 0.3<br>• Today: 0.0 |
| **Goal Urgency (`goalUrgencyFactor`)** | `0.10` | Active academic goals targeting topic:<br>• Overdue / $\le$ 7 days: 1.0<br>• $\le$ 14 days: 0.7<br>• $\le$ 30 days: 0.4<br>• > 30 days: 0.1 |
| **Prerequisite Importance (`prerequisiteImportanceFactor`)** | `0.10` | Bounded dependency graph propagation up to `maxPrerequisiteDepth` (2). Fraction of dependent topics blocked by weak prerequisites. |
| **Neglect Gap (`neglectFactor`)** | `0.05` | Long inactivity (> 14 days) combined with low overall study minutes. |

---

## 3. High-Effort / Low-Performance Signal

If a student accumulates $\ge 300$ minutes of study time on a topic but remains in a `WEAK` state ($< 50\%$ accuracy), the engine detects a **HIGH_EFFORT_LOW_PERFORMANCE** condition.

- Rather than allocating more raw study time indefinitely, the engine shifts the recommended strategy to `PREREQUISITE_REVIEW` or `TUTOR_REVIEW` (RAG grounded explanations) to address foundational misconceptions.

---

## 4. Deterministic Strategy Assignment

Each planned session is assigned a strategy deterministically:

- `WEAK` + Low Evidence ($< 2$ attempts) $\rightarrow$ `STUDY`
- `WEAK` + High Effort $\rightarrow$ `READING` / `PREREQUISITE_REVIEW`
- `WEAK` + Sufficient Evidence $\rightarrow$ `PRACTICE`
- `DEVELOPING` + `IMPROVING` $\rightarrow$ `PRACTICE`
- `STRONG` + Upcoming Exam $\rightarrow$ `REVISION`
- `STRONG` + No Exam $\rightarrow$ `STUDY` (Maintenance)

---

## 5. Time Allocation & Constraints

1. **Minimum Session Block (`minMinutes`)**: 20 minutes. No micro-sessions ($<20$ min) are created.
2. **Maximum Session Block (`maxMinutes`)**: 60 minutes.
3. **Daily Study Cap (`maxDailyMinutes`)**: 240 minutes (4 hours). Available study time exceeding 240 minutes remains unallocated.
4. **Insufficient Time Allocation**: If available time is limited (e.g., 20 minutes), time is allocated strictly to the #1 priority topic.
5. **Prerequisite Ordering**: Topological sorting (Kahn's algorithm) ensures prerequisite topics appear before dependent topics on the schedule.

---

## 6. Plan Stability & User Overrides

- **Stability Threshold (`stabilityThreshold = 0.10`)**: Prevents daily plan churn caused by minor score fluctuations.
- **User Overrides Preservation**: When plans are regenerated, sessions manually overridden by the user (`isManualOverride = true`) retain their overridden duration and strategy.
- **Historical Plan Integrity**: Generated plans store fixed `priorityReason` and `generationContext` metadata at generation time, preserving historical accuracy.

---

## 7. Diagnostics & Inspection API

- **Endpoint**: `GET /api/v1/study-plans/{id}/priority-breakdown`
- Exposes transparent component breakdowns (`weaknessFactor`, `examUrgencyFactor`, `trendFactor`, `recencyFactor`, `prerequisiteImportanceFactor`, `neglectFactor`, `rawScore`, `recommendedStrategy`, `reason`) for UI Plan Inspector and debugging.
