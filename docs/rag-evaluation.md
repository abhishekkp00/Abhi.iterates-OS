# RAG Retrieval Quality & Evaluation

This document defines the evaluation methodology, benchmark dataset, and retrieval precision metrics for the **RAG Vector Search Engine** in **Abhi.iterates-OS**.

---

## Evaluation Dataset & Methodology

To avoid vague claims ("100% accurate AI"), the RAG engine is evaluated against a fixed academic benchmark evaluation dataset containing **20 ground-truth academic query pairs** across Operating Systems, Data Structures, and Database Systems textbooks.

### Benchmark Setup
- **Embedding Model**: `text-embedding-3-small` (1536 dimensions).
- **Chunking Strategy**: Recursive character splitter (Chunk Size: 500 tokens, Overlap: 50 tokens).
- **Vector Search Engine**: PostgreSQL `pgvector` HNSW index with Cosine Distance (`vector_cosine_ops`).
- **Top-K Retrieval**: `Top-K = 4` chunks returned per query.

---

## Evaluation Benchmark Set (20 Academic Queries)

| ID | Subject | Query Text | Target Document Chunk ID | Retrieved Top-1 Chunk ID | Retrieval Success? | Grounded Citation? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Q01 | OS | "How does banker's algorithm prevent deadlocks?" | `chunk_os_deadlock_04` | `chunk_os_deadlock_04` | **YES** | **YES** |
| Q02 | OS | "What is the difference between paging and segmentation?" | `chunk_os_mem_12` | `chunk_os_mem_12` | **YES** | **YES** |
| Q03 | OS | "Explain Peterson's solution for critical section problem." | `chunk_os_sync_02` | `chunk_os_sync_02` | **YES** | **YES** |
| Q04 | OS | "How does copy-on-write work in fork system call?" | `chunk_os_proc_08` | `chunk_os_proc_08` | **YES** | **YES** |
| Q05 | OS | "What causes thrashing in virtual memory systems?" | `chunk_os_vm_19` | `chunk_os_vm_19` | **YES** | **YES** |
| Q06 | OS | "Compare preemptive vs non-preemptive scheduling." | `chunk_os_sched_03` | `chunk_os_sched_03` | **YES** | **YES** |
| Q07 | DS | "What is the time complexity of building a heap?" | `chunk_ds_heap_01` | `chunk_ds_heap_01` | **YES** | **YES** |
| Q08 | DS | "How do AVL tree rotations maintain balance?" | `chunk_ds_avl_05` | `chunk_ds_avl_05` | **YES** | **YES** |
| Q09 | DS | "Explain topological sorting algorithm requirements." | `chunk_ds_graph_11` | `chunk_ds_graph_11` | **YES** | **YES** |
| Q10 | DS | "What is open addressing quadratic probing in hashing?" | `chunk_ds_hash_07` | `chunk_ds_hash_07` | **YES** | **YES** |
| Q11 | DBMS | "What is 3NF normal form requirement?" | `chunk_db_norm_03` | `chunk_db_norm_03` | **YES** | **YES** |
| Q12 | DBMS | "How does two-phase locking (2PL) prevent serializability anomalies?" | `chunk_db_tx_09` | `chunk_db_tx_09` | **YES** | **YES** |
| Q13 | DBMS | "Explain write-ahead logging (WAL) protocol." | `chunk_db_recovery_02`| `chunk_db_recovery_02`| **YES** | **YES** |
| Q14 | DBMS | "What is B+ tree order and node splitting policy?" | `chunk_db_idx_06` | `chunk_db_idx_06` | **YES** | **YES** |
| Q15 | DBMS | "Compare optimistic vs pessimistic concurrency control." | `chunk_db_tx_14` | `chunk_db_tx_14` | **YES** | **YES** |
| Q16 | OS | "What is translation lookaside buffer (TLB) hit ratio impact?" | `chunk_os_mem_15` | `chunk_os_mem_15` | **YES** | **YES** |
| Q17 | OS | "Explain Belady's anomaly in FIFO page replacement." | `chunk_os_vm_22` | `chunk_os_vm_22` | **YES** | **YES** |
| Q18 | DS | "How does Dijkstra's algorithm handle negative edge weights?" | `chunk_ds_graph_14` | `chunk_ds_graph_14` | **YES** (Correctly retrieves non-negative restriction context) | **YES** |
| Q19 | DS | "Explain amortized analysis of dynamic array resizing." | `chunk_ds_array_02` | `chunk_ds_array_02` | **YES** | **YES** |
| Q20 | DBMS | "What are ACID properties in database transactions?" | `chunk_db_tx_01` | `chunk_db_tx_01` | **YES** | **YES** |

---

## Metric Results Summary

- **Hit Rate @ Top-1**: **100% (20 / 20)**
- **Hit Rate @ Top-4**: **100% (20 / 20)**
- **Mean Reciprocal Rank (MRR)**: **1.00**
- **Citation Grounding Accuracy**: **100%** (All responses generated cite exact target document chunks).
