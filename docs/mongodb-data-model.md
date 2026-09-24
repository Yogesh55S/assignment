# MongoDB Data Model Architecture

## 1. Document Storage Paradigm vs Relational SQL
Unlike SQL relational databases that enforce normalized tables with foreign keys and joint operations across distinct rows, MongoDB is a document-oriented database. 

In this application:
- A complete Interview Prep Kit (containing domain requirements, role specifications, interview questions, answer outlines, revision flashcards, and schedule timeline) is stored as a **single embedded document** within the `kits` collection.
- Flashcard study progress (`confidence`, `covered`, `lastSeenAt`) is decoupled into a dedicated `flashcard_progress` collection because progress updates occur frequently per flashcard interaction, avoiding full kit document updates and write contention.

---

## 2. ASCII Collection Topology

```
+-----------------------------------------------------------------------------------+
|                                 users Collection                                  |
+-----------------------------------------------------------------------------------+
| _id: ObjectId                                                                     |
| email: String (unique, lowercased)                                                |
| passwordHash: String (select: false)                                              |
| createdAt: Date                                                                   |
| updatedAt: Date                                                                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         | 1 : N
                                         v
+-----------------------------------------------------------------------------------+
|                                  kits Collection                                  |
+-----------------------------------------------------------------------------------+
| _id: ObjectId                                                                     |
| userId: ObjectId (ref: User)                                                      |
| generationStatus: "draft" | "generating" | "ready" | "failed"                     |
| requestFingerprint: String                                                        |
| sourceMetadata: { company_url, days, jd_chars, jd }                               |
| kit: {                                                                            |
|   title, company_name, seniority, location,                                       |
|   requirements: [{ id, text, kind, priority }],                                   |
|   questions: [{ id, category, requirement_ids, prompt, answer_outline, difficulty}],|
|   flashcards: [{ id, front, back, requirement_ids }],                             |
|   schedule: [{ day, focus, tasks, question_ids }]                                 |
| } (null when failed/generating)                                                   |
| generationError: { code, message } (null unless failed)                           |
| warnings: [{ code, message }]                                                     |
| researchSnapshot: Object | null (bounded size snapshot)                           |
| __v: Number (optimistic concurrency version)                                      |
| createdAt: Date                                                                   |
| updatedAt: Date                                                                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         | 1 : N
                                         v
+-----------------------------------------------------------------------------------+
|                           flashcard_progress Collection                           |
+-----------------------------------------------------------------------------------+
| _id: ObjectId                                                                     |
| userId: ObjectId (ref: User)                                                      |
| kitId: ObjectId (ref: Kit)                                                        |
| flashcardId: String (e.g. "fc1", "fc2")                                           |
| confidence: Number (1 | 2 | 3)                                                    |
| covered: Boolean                                                                  |
| lastSeenAt: Date                                                                  |
| createdAt: Date                                                                   |
| updatedAt: Date                                                                   |
|                                                                                   |
| UNIQUE COMPOUND INDEX: { userId: 1, kitId: 1, flashcardId: 1 }                    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Embedded vs Separate Collection Decision Matrix

| Data Entity | Design Decision | Technical & Operational Justification |
| :--- | :--- | :--- |
| **Requirements** | **Embedded** in `kits.kit` | Requirements are immutable metadata derived strictly during initial kit generation. They have no lifespan outside their kit. |
| **Questions** | **Embedded** in `kits.kit` | Questions link directly to kit requirement IDs (`r1`, `r2`). Embedded storage guarantees transactional consistency during category regeneration. |
| **Flashcards** | **Embedded** in `kits.kit` | Base flashcard definitions (`front`, `back`, `requirement_ids`) remain fixed with the kit content. |
| **Schedule** | **Embedded** in `kits.kit` | Schedules map directly to question IDs (`q1`, `q2`). Preserving embedded schedule guarantees zero-LLM deterministic schedule recalculation. |
| **Flashcard Progress** | **Separate Collection** | Student active-recall interactions mutate `confidence` and `covered` state frequently. Storing this in a separate collection eliminates write-lock contention on the main kit document. |
| **Research Snapshot** | **Embedded (Bounded)** | Snapshot of research summary and page titles is bounded to max 50KB to preserve context without document size inflation. |

---

## 4. Index Architecture & Query Optimization

1. `users` Collection:
   - `{ email: 1 }` (Unique index for fast authentication lookups and duplicate prevention).
2. `kits` Collection:
   - `{ userId: 1, updatedAt: -1 }` (Compound index for fetching recent kits per user).
   - `{ userId: 1, createdAt: -1 }` (Compound index for chronological listing).
   - `{ userId: 1, requestFingerprint: 1 }` (Compound index for deduplicating identical generation requests).
3. `flashcard_progress` Collection:
   - `{ userId: 1, kitId: 1, flashcardId: 1 }` (**Unique Compound Index** enforcing 1 progress record per flashcard per user per kit).

---

## 5. Failure & Retry Lifecycle
- **Generation Draft/Generating**: When kit creation initiates, a document is saved with `generationStatus: "generating"`, `kit: null`, and `generationError: null`.
- **Generation Ready**: On successful generation, `generationStatus` transitions to `"ready"`, `kit` is populated with the complete validated payload, and `generationError` remains `null`.
- **Generation Failure**: If an error occurs, `generationStatus` transitions to `"failed"`, `kit` is set to `null` (enforcing zero corrupted fallback data), and `generationError` receives a safe `{ code, message }` payload.
- **Retry Operation**: Retrying a failed kit updates `generationStatus` back to `"generating"`, clears `generationError`, and attempts generation again cleanly.

---

## 6. Security & Data Retention Rules
- **No Secrets or Credentials**: Connection strings, API tokens, JWT secrets, and raw user passwords are NEVER stored in kit documents.
- **Data Ownership Scoping**: Every document operation (`find`, `findById`, `updateOne`, `deleteOne`) MUST include `userId` in the query payload to enforce strict tenant isolation.
- **Password Hashes**: Hashes use `select: false` in Mongoose schema to prevent accidental serialization in API responses.

---

## 7. Migration Strategy
- **Zero Automatic Migrations**: Automatic or destructive migrations on app launch are strictly prohibited.
- **Additive Backwards Compatibility**: New schema fields utilize safe Mongoose defaults (`null` or `[]`).
- **Lazy On-Read/Write Migration**: Legacy documents lacking new optional fields inherit defaults gracefully when queried or updated.
- **Offline CLI Migration Utility**: `backend/src/scripts/migrateKitDocuments.ts` provides safe dry-run auditing (with explicit `--apply` flag required to write updates).
