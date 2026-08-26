# System & Algorithmic Technical Limitations

This document provides an honest assessment of current technical and algorithmic limitations in **Abhi.iterates-OS**.

---

## Technical & Algorithmic Limitations

### 1. Heuristic Mastery & Priority Weights
- **Limitation**: Mastery states (`STRONG`, `DEVELOPING`, `WEAK`) and topic priority scores are calculated using deterministic heuristic algorithms.
- **Context**: While highly debuggable and predictable, these weights are based on academic scheduling heuristics rather than scientifically validated psychological cognitive models (like Item Response Theory (IRT) or Bayesian Knowledge Tracing (BKT)).

### 2. LLM Non-Determinism in Question Generation
- **Limitation**: While assessment scoring and topic priority calculation are 100% deterministic, the initial text generation of questions by external LLMs exhibits non-determinism.
- **Mitigation**: Question outputs are strictly validated against JSON schema rules (verifying presence of exactly 4 options and 1 correct answer index) before persistence.

### 3. Vector Retrieval Chunk Boundaries
- **Limitation**: Document chunking using fixed 500-token boundaries can occasionally split a complex mathematical formula or code snippet across two adjacent chunks.
- **Mitigation**: Overlap of 50 tokens is used to preserve contextual continuity between adjacent chunks.

### 4. Single Node Local File Storage
- **Limitation**: Local file uploads are stored on the host filesystem under `uploads/`. In multi-container horizontal scale scenarios, files must be moved to S3 object storage.

### 5. Absence of Exam-Score Prediction
- **Limitation**: The system explicitly enforces a **Non-Predictive Policy**. It does **NOT** provide pseudo-scientific predictions such as *"You have an 87% chance of passing your exam"*. Coverage and revision metrics are strictly factual metrics of completed study time and assessment accuracy.
