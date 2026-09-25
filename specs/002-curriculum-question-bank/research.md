# Research & Design Decisions: Curriculum & Question Bank

**Date**: 2026-08-20 | **Version**: 1.0 | **Status**: Design Research Complete

This document records the technical and architectural decisions made during the design phase of the Curriculum & Question Bank feature (002), along with alternatives considered and rationale.

---

## Decision 1: Separate Curriculum & Question Entities

**Question**: Should curriculum (Class/Subject/Topic) and Questions be stored as:
- **Option A** (Selected): Separate entities with Question referencing curriculum nodes
- Option B: Questions embedded within curriculum nodes (nested structure)
- Option C: Questions and curriculum combined in a single mega-entity

**Decision**: Option A - Separate entities

**Rationale**:
1. **Flexibility**: Questions can reference multiple competencies and curriculum nodes; separation allows many-to-many relationships
2. **Scalability**: With 1,000+ questions per competency and 30+ classes, nested structures would create deep hierarchies (hard to query)
3. **Versioning**: Curriculum changes independently from questions; separation prevents version conflicts
4. **Audit Trail**: Each entity has its own change history; easier to track "What changed?" for curriculum vs. questions
5. **Bulk Operations**: Educators can bulk-import questions without re-importing entire curriculum
6. **Assessment Mapping**: Assessments reference questions directly; curriculum nodes provide context without tightly coupling

**Alternatives Rejected**:
- **Option B** (Embedded): Makes question search across topics expensive; prevents reusing questions across curriculum nodes
- **Option C** (Combined): Creates massive entities; hard to update without affecting thousands of dependent records

**Implementation**: Question entity includes denormalized curriculum path (classId, subjectId, topicId) for fast queries while maintaining separate tables for referential integrity

---

## Decision 2: Immutable Question Versioning

**Question**: How should question edits be handled?
- **Option A** (Selected): Create new immutable QuestionVersion on every edit; original version never changes
- Option B: Overwrite question fields in-place; keep a single changlog entry
- Option C: No versioning; always edit in-place (no history)

**Decision**: Option A - Immutable versioning

**Rationale**:
1. **Auditability**: When a student took an assessment using Question v1, that exact question is preserved forever
2. **Score Reproducibility**: If educator tweaks rubric in v2, scores from assessments using v1 remain valid
3. **Rollback**: If v2 is bad, educators can compare and revert to v1
4. **Fairness**: Protects students from having assessment questions changed after they answered
5. **Compliance**: Required for educational audit trails and legal defensibility
6. **Learning Analytics**: Can track "which question version did students perform better on?"

**Alternatives Rejected**:
- **Option B** (Changelog only): Doesn't protect assessment data; if question changes, scores become ambiguous
- **Option C** (No versioning): No audit trail; impossible to debug scoring issues; unfair to students

**Implementation**: 
- Question.id always points to latest version
- QuestionVersion stores all historical snapshots
- AssessmentItem links to Question + versionNumber to specify which version was used
- Scoring engine retrieves exact rubric for the version that was assessed

**Trade-off**: Requires more storage (one row per edit per question); mitigated by indexing and archiving old versions after 2+ years

---

## Decision 3: Bulk Import with Async Processing

**Question**: How should bulk import be handled?
- **Option A** (Selected): Async job queue (BullMQ); return importId immediately; client polls for status
- Option B: Synchronous processing; block until all questions imported (timeout if too large)
- Option C: Streaming import; process while user watches

**Decision**: Option A - Async with job queue

**Rationale**:
1. **Responsiveness**: Importing 500+ questions takes 30+ seconds; sync would block user (bad UX)
2. **Reliability**: Job queue ensures import completes even if server restarts; can retry failures
3. **Scalability**: Multiple imports can run in parallel (max 5 concurrent); doesn't block other API traffic
4. **Error Resilience**: If one row fails, other rows still succeed (partial success pattern)
5. **Progress Tracking**: Real-time status, ETA, error reporting as it processes
6. **Cost**: Doesn't hold open HTTP connections for long imports (cheaper, better load balancing)

**Alternatives Rejected**:
- **Option B** (Sync): Would timeout for batches >100 questions; bad for mobile clients
- **Option C** (Streaming): Complex; no proven benefit over async with polling

**Implementation**: 
- POST /api/v1/admin/questions/bulk-import returns importId immediately
- BullMQ job enqueued; max 5 concurrent, others wait in queue
- GET /api/v1/admin/questions/bulk-imports/{importId} polls for status
- WebSocket support (Phase 2) for real-time updates instead of polling

**Monitoring**: Job failures logged; auto-retry for transient errors (network, timeout); manual retry for validation errors

---

## Decision 4: Question Status Lifecycle

**Question**: What states should questions flow through?
- **Option A** (Selected): DRAFT → ACTIVE → ARCHIVED; with FLAGGED status for quality issues
- Option B: DRAFT → ACTIVE → DELETED (immediately remove)
- Option C: Only two states: ACTIVE and ARCHIVED

**Decision**: Option A - Four states with FLAGGED intermediate

**Rationale**:
1. **DRAFT**: New or bulk-imported questions start here; educators review before use
2. **ACTIVE**: Question is approved and can be used in assessments
3. **FLAGGED**: Educator or QA detected issue (ambiguous wording, scoring problem); needs review
4. **ARCHIVED**: Question no longer used; kept for historical reference

**Why no deletion?**:
- If question is used in a live assessment, deleting it breaks that assessment's data integrity
- Students' historical responses reference the question; deleting makes audit trail incomplete
- Archiving preserves history while preventing accidental use

**Why FLAGGED?**:
- Educator reports issue mid-assessment (e.g., "Option B text is unclear")
- System can flag without deleting; coordinator reviews before next use
- Prevents throwing away a question due to a single complaint

**Transitions**:
- DRAFT → ACTIVE: Educator/admin reviews and approves
- ACTIVE → ARCHIVED: Consciously retire question (e.g., topic was updated)
- ACTIVE → FLAGGED: QA or educator reports issue
- FLAGGED → ACTIVE: Issue resolved; re-approve
- FLAGGED → ARCHIVED: Issue unresolvable; retire

**Implementation**: 
- Status field in Question; validation rules enforce legal transitions
- Prevent use in new assessments if FLAGGED or ARCHIVED
- Allow scoring of OLD assessments that already used the question

---

## Decision 5: Curriculum Import Merge Strategy

**Question**: When importing curriculum that conflicts with existing data, what options?
- **Option A** (Selected): Three merge strategies: KEEP_OLD, REPLACE, VERSION
- Option B: Always version (archive old, create new)
- Option C: Always replace (overwrite)

**Decision**: Option A - Flexible merge strategy

**Rationale**:
1. **KEEP_OLD** (default): Safe; don't overwrite existing. Useful if importing same file twice
2. **REPLACE**: For corrections; e.g., topic name was wrong, now updating it
3. **VERSION**: Archive old topic, create new one with same name but different ID

**When each is appropriate**:
- **KEEP_OLD**: First import; testing; or correcting duplicate uploads
- **REPLACE**: Topic description needs update; topic code corrected; minor tweaks
- **VERSION**: Major curriculum change (e.g., CBSE updated Whole Numbers scope); want to keep old assessments using old version

**Why not always VERSION?**
- Creates version drift; educators get confused ("Which version of Whole Numbers should I use?")
- Storage overhead; old versions rarely needed after 1-2 years
- Requires version selection when creating assessments (complexity)

**Why not always KEEP_OLD?**
- Prevents correcting mistakes; forces manual fixes
- Doesn't scale for 100+ rows to update

**Why not always REPLACE?**
- Breaks existing assessments if topic ID changes
- Loses historical context; can't compare old vs. new curriculum

**Implementation**: 
- Admin specifies strategy at import time
- System previews conflicts: "Found 5 duplicate classes; here's what will happen with each strategy"
- Audit log records which strategy was used and what was affected

---

## Decision 6: Denormalized Curriculum Path in Question

**Question**: How to optimize the most common query: "Get all questions for Class V, Math, Whole Numbers"?
- **Option A** (Selected): Denormalize curriculum path in Question (classId, subjectId, topicId)
- Option B: Store only topicId; join Topic, Subject, Class on every query
- Option C: Use PostgreSQL array column (classId, subjectId, topicId) for composite indexing

**Decision**: Option A - Denormalized columns + composite index

**Rationale**:
1. **Query Performance**: Single table scan with index on (classId, subjectId, topicId, status)
2. **Without denormalization**: Would need 3-4 joins (Question → Topic → Subject → Class); expensive for 1000+ rows
3. **Index Efficiency**: Composite index enables: "find all ACTIVE questions for Class V Math" in <100ms
4. **Update Overhead**: When topic changes, questions already have classId/subjectId; no cascade updates needed
5. **Referential Integrity**: Separate tables (topicId FK) still enforce consistency

**Referential Integrity Enforcement**:
```sql
-- Ensure denormalized path matches actual hierarchy
ALTER TABLE questions ADD CONSTRAINT check_curriculum_consistency
  CHECK (topic_id NOT NULL AND class_id NOT NULL AND subject_id NOT NULL)
  FOREIGN KEY (topic_id) REFERENCES topics(id)
  FOREIGN KEY (subject_id) REFERENCES subjects(id)
  FOREIGN KEY (class_id) REFERENCES classes(id);
```

**Alternatives Rejected**:
- **Option B** (Pure normalization): 3-4 joins per query would make search slow; doesn't scale
- **Option C** (Array column): PostgreSQL arrays don't index well; harder to query

**Trade-off**: Denormalization adds small storage overhead and requires careful synchronization; massive read performance gain justifies cost

---

## Decision 7: Learning Objective as First-Class Entity

**Question**: Should LearningObjective be a separate entity or embedded in Topic?
- **Option A** (Selected): Separate entity (LearningObjective table)
- Option B: JSONB array in Topic
- Option C: No formal learning objectives; store in free-text notes

**Decision**: Option A - Separate entity

**Rationale**:
1. **AI Generation**: AI needs to query learning objectives independently (e.g., "generate 5 MCQs for objective X")
2. **Bloom's Taxonomy**: Each objective is mapped to a level (REMEMBER, UNDERSTAND, APPLY, etc.); needs indexing
3. **Question Linking**: Questions reference specific learning objectives; many questions per objective
4. **Analytics**: Can track "which objectives have sufficient question coverage?"
5. **Curriculum Mapping**: Each objective can belong to topic or subtopic; flexible
6. **Pedagogy**: Learning objectives guide both question generation and assessment blueprinting

**Benefits for AI (Phase 2)**:
- Query: "Generate 5 APPLY-level questions for objective X"
- Ensures AI-generated questions align to pedagogy
- Educators can provide feedback on how well questions meet objectives

**Alternatives Rejected**:
- **Option B** (JSONB): No indexing; can't query "all APPLY-level objectives"; hard to standardize format
- **Option C** (Free-text): No consistency; can't measure coverage; impossible to automate

**Implementation**: 
- LearningObjective entity with bloomLevel enum
- Question can link to 0-N learning objectives
- API endpoint: GET /api/v1/curriculum/topics/{topicId}/learning-objectives
- Phase 2: AI generation requests include targetObjective

---

## Decision 8: Question Provenance Tracking

**Question**: Should we track where questions come from (manually created, imported, AI-generated)?
- **Option A** (Selected): provenance enum field in Question; also track aiGeneratedFrom reference
- Option B: Only track import in QuestionImportLog; assume rest are manual
- Option C: No tracking; don't distinguish origin

**Decision**: Option A - Full provenance tracking

**Rationale**:
1. **Transparency**: Educators know which questions are AI-assisted; can give feedback
2. **Quality Metrics**: Track "How often are AI-generated questions used? Performance vs. manual?"
3. **Compliance**: Some schools may require "only human-vetted questions"; easy to filter
4. **Review Workflow**: AI questions go through extra review before ACTIVE; manual don't (unless flagged)
5. **Analytics**: "80% of our questions are AI-assisted; this is well-balanced"
6. **Improvement**: Use data to improve AI generation prompts and models

**Provenance Values**:
- MANUALLY_CREATED: Educator created via UI
- BULK_IMPORTED: Loaded from CSV/JSON file
- AI_ASSISTED: AI generated, then human-edited before approval
- AI_GENERATED: AI generated and approved as-is

**Alternatives Rejected**:
- **Option B** (Partial tracking): Can't distinguish between manual and AI
- **Option C** (No tracking): Blindfolded to quality and usage patterns

**Implementation**:
- provenance enum field
- aiGeneratedFrom reference (points to LearningObjective or AIGenerationRequest)
- Status flow: AI_GENERATED must be reviewed before becoming ACTIVE
- Manual questions can go straight to ACTIVE

---

## Decision 9: Admin Dashboard as Phase 2, Not Phase 1

**Question**: Should the admin dashboard (Vue.js/React UI) be built with MVP or later?
- **Option A**: Phase 1 (MVP) - Desktop dashboard + API
- **Option B** (Selected): Phase 1 - API only; Phase 2 - Dashboard

**Decision**: Option B - API first, dashboard in Phase 2

**Rationale**:
1. **MVP Scope**: Phase 1 focuses on backend reliability (tests, API contracts, scalability)
2. **Time-to-Value**: Educators and admins can use API directly or command-line tools immediately
3. **Frontend Reduces Risk**: Can build backend in parallel with frontend team; unblock frontend team for other features
4. **Flexibility**: API-first means desktop, mobile, CLI, or third-party tools can all consume it
5. **Educator Adoption**: For MVP, direct API usage is acceptable for small pilot group; dashboard needed for scale (Phase 2)

**Phase 1 MVP Deliverables**:
- ✅ REST API (all endpoints)
- ✅ PostgreSQL schema
- ✅ Tests & documentation
- ❌ Admin dashboard UI

**Phase 2 Enhancement**:
- ✅ Vue.js/React dashboard
- ✅ Advanced analytics
- ✅ Real-time WebSocket updates
- ✅ Offline question caching

**Workaround for MVP**:
- Provide curl/Postman templates for admins
- Simple HTML form (not a full dashboard) for basic operations
- Can use Swagger UI to test API

**Alternatives Rejected**:
- **Option A** (Dashboard in Phase 1): Would delay API; frontend team can't start; dashboard likely built in rush (poor UX)

---

## Decision 10: Support Multiple Curriculum Boards from Start

**Question**: Should Phase 1 support only CBSE or multiple boards (CBSE, ICSE, State)?
- **Option A** (Selected): Design for multiple boards; Phase 1 implements CBSE; Phase 2 adds others
- Option B: Phase 1 supports all three (CBSE, ICSE, State)
- Option C: Phase 1 only supports CBSE; refactor later for others

**Decision**: Option A - Design for extensibility; implement CBSE only in Phase 1

**Rationale**:
1. **Scope Creep Prevention**: CBSE alone is ~300 topics for Classes III-XII; adding ICSE + State Boards = 3x work
2. **Market First**: CBSE is largest market in India; Phase 1 focuses on CBSE; ICSE/State boards are Phase 2
3. **Design Correctness**: Board entity already in schema; adding ICSE/State boards later is straightforward
4. **Testing**: Validate CBSE thoroughly before scaling to other boards
5. **Curriculum Validation**: Verify API and import processes work perfectly for 1 board before generalizing

**Architecture for Extensibility**:
- Board entity already supports multiple values (code, name)
- Schema migration path: CBSE → add ICSE → add State Boards (backwards compatible)
- No hardcoding of board logic; all board-specific data in database

**Phase 1 Constraint**: Only CBSE curriculum imported; other boards rejected with "Coming in Phase 2"

**Alternatives Rejected**:
- **Option B** (All three boards): Would triple work; dilutes focus; ICSE/State boards have less market share in MVP
- **Option C** (CBSE only, hardcoded): Design doesn't support extensibility; refactoring needed later

---

## Decision 11: Bulk Import Error Handling Strategy

**Question**: How should import errors be handled?
- **Option A** (Selected): Partial success; process all rows; report errors per row; allow retry
- Option B: Fail-fast; stop on first error; all-or-nothing
- Option C: Skip errors silently; no feedback

**Decision**: Option A - Partial success with detailed error reporting

**Rationale**:
1. **Educator Friction**: Importing 500 questions shouldn't fail because row 250 has a typo
2. **Pragmatism**: Real-world CSVs often have edge cases; rigid validation frustrates users
3. **Error Reporting**: Each failed row includes specific reason ("Competency 'UNKNOWN' not found")
4. **Retry Capability**: Export only failed rows; fix; re-upload (don't re-upload 500 rows)
5. **Visibility**: Show success rate prominently (e.g., "248/250 imported; 2 errors")
6. **Scalability**: Can process large batches incrementally

**Implementation**:
- Process each CSV row independently in the job processor
- Capture error per row in QuestionImportDetail
- Commit successful rows; don't rollback on errors
- Generate error report with suggestions (e.g., "Use competency ID instead of name")
- Allow partial import to succeed

**Error Recovery Path**:
1. User gets error report (e.g., "Row 45: Invalid itemType; Row 127: Competency not found")
2. User fixes only problematic rows
3. System provides "failed rows export" option
4. User uploads fixed CSV
5. System skips already-imported rows (duplicate detection)

**Alternatives Rejected**:
- **Option B** (Fail-fast): One typo ruins entire import; requires perfect CSV; educational feedback
- **Option C** (Silent skip): Educators don't know what failed; silent data loss

---

## Decision 12: PostgreSQL Choice Over NoSQL

**Question**: Should curriculum/questions be stored in PostgreSQL or NoSQL (MongoDB)?
- **Option A** (Selected): PostgreSQL with strict schema
- Option B: MongoDB with flexible documents
- Option C: Hybrid (PostgreSQL for relational, MongoDB for flexible fields)

**Decision**: Option A - PostgreSQL

**Rationale**:
1. **Relational Data**: Curriculum is hierarchical (Class → Subject → Topic); questions reference multiple entities; SQL excels here
2. **Referential Integrity**: Foreign keys prevent orphaned questions; schema ensures consistency
3. **Complex Queries**: "Questions by Class/Subject/Topic with all learning objectives" requires joins; inefficient in NoSQL
4. **ACID Transactions**: Bulk imports must be atomic; if partial failure, must be consistent
5. **Indexes**: Composite indexes on (classId, subjectId, topicId, status) enable fast filtering
6. **Maturity**: PostgreSQL proven at scale; excellent for educational institutions
7. **Cost**: PostgreSQL is free/open; no vendor lock-in

**Denormalization Mitigates NoSQL Advantage**:
- Denormalized curriculum path in Question makes queries fast (not a NoSQL advantage)
- JSON rubric/evidence fields (JSONB in PostgreSQL) provides NoSQL flexibility where needed

**When MongoDB Would Lose**:
- "Find all questions in topic X" requires collection scan (slow)
- No foreign key constraints; can create orphaned questions
- Transactions for bulk import more complex
- Indexing doesn't map well to hierarchical queries

**Alternatives Rejected**:
- **Option B** (MongoDB): Flexibility doesn't outweigh SQL advantages; would need application-level constraints
- **Option C** (Hybrid): Adds operational complexity; two databases to maintain

---

## Decision 13: Caching Strategy

**Question**: How should curriculum queries be cached?
- **Option A** (Selected): Service-level cache (in-memory); 1-hour TTL; invalidate on import
- Option B: Database query cache (PostgreSQL pg_stat_user_tables)
- Option C: No caching; always query fresh

**Decision**: Option A - Service-layer cache

**Rationale**:
1. **Read-Heavy**: Curriculum rarely changes; thousands of reads per day; excellent cache candidate
2. **TTL Balance**: 1 hour is long enough to reduce queries significantly; short enough that new imports visible quickly
3. **Invalidation**: On import completion, clear cache (educators expect to see new topics immediately)
4. **Memory Efficient**: Curriculum is ~1MB total (10 classes, 35 subjects, 145 topics); fits in memory easily
5. **Backend Load**: Reduces PostgreSQL connection pool pressure; scales better

**Implementation**:
```typescript
// Service-level caching
@Injectable()
export class CurriculumService {
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, Date>();
  
  async getClassesByBoard(boardId: string): Promise<Class[]> {
    const cacheKey = `classes_${boardId}`;
    if (this.isValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const classes = await this.classRepository.find({ boardId });
    this.cache.set(cacheKey, classes);
    this.cacheExpiry.set(cacheKey, new Date(Date.now() + 3600000)); // 1 hour
    return classes;
  }
  
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}
```

**Alternatives Rejected**:
- **Option B** (Database cache): PostgreSQL caching is automatic for frequent queries; application-level cache provides more control
- **Option C** (No cache): Would timeout on every "get subjects for class" request; poor user experience

---

## Decision 14: Question Search Implementation

**Question**: How to implement fast full-text search on question prompts?
- **Option A** (Selected): PostgreSQL tsvector with GIST or GIN index; FTS ranking
- Option B: Elasticsearch
- Option C: Simple LIKE or iLIKE

**Decision**: Option A - PostgreSQL native FTS

**Rationale**:
1. **Simplicity**: No external service; FTS built into PostgreSQL
2. **Performance**: GIN indexes make FTS queries <100ms even on 10k+ rows
3. **Cost**: No extra infrastructure; single PostgreSQL instance handles both relational + search
4. **Stemming**: English stemming included; matches "running" and "run"
5. **Ranking**: tsvector includes relevance scoring; best matches appear first
6. **No Sync Issues**: Unlike Elasticsearch, search index always matches database state

**Alternatives Rejected**:
- **Option B** (Elasticsearch): Overkill for MVP; adds operational complexity; must sync indexes
- **Option C** (LIKE): Scales poorly; full table scan on millions of characters

**Implementation**:
```sql
CREATE INDEX question_search_idx ON questions 
USING GIN (to_tsvector('english', prompt));

-- Query
SELECT * FROM questions 
WHERE to_tsvector('english', prompt) @@ plainto_tsquery('english', 'addition carry')
ORDER BY ts_rank(to_tsvector('english', prompt), query) DESC;
```

---

## Decision 15: File Upload & Storage

**Question**: Where to store uploaded CSV/JSON files for bulk import?
- **Option A** (Selected): S3-compatible storage (AWS S3 or MinIO locally)
- Option B: Local filesystem
- Option C: Database BLOB field

**Decision**: Option A - S3-compatible storage

**Rationale**:
1. **Scalability**: S3 handles arbitrary file sizes; filesystem on single server limited
2. **Durability**: S3 has redundancy; file loss unlikely
3. **Cloud-Ready**: Works with managed services (AWS ECS, K8s)
4. **Access Control**: S3 permissions can restrict file access by user/role
5. **Cost**: S3 pricing reasonable; local storage limits scaling
6. **Compliance**: File audit trail; encryption at rest

**Implementation**:
- Admin uploads CSV → multipart form to API
- API stores file in S3 with signed URL
- BullMQ job downloads file from S3
- After import completes, file can be archived or deleted

**Alternatives Rejected**:
- **Option B** (Filesystem): Single-server bottleneck; backup complexity; no access control
- **Option C** (BLOB): PostgreSQL bloats; slow retrieval; no compression

---

## Summary of Key Decisions

| Decision | Chosen | Why |
|----------|--------|-----|
| Curriculum + Questions separate | Yes | Flexibility, scalability, independent versioning |
| Immutable question versions | Yes | Auditability, score reproducibility, fairness |
| Async bulk import | Yes | Responsiveness, reliability, scalability |
| Four-state lifecycle | Yes | Quality control, fairness, archiving |
| Multiple merge strategies | Yes | Flexibility; KEEP_OLD default for safety |
| Denormalized curriculum path | Yes | Query performance <100ms |
| Learning objectives as entities | Yes | AI generation, analytics, curriculum mapping |
| Provenance tracking | Yes | Transparency, quality metrics, compliance |
| Dashboard in Phase 2 | Yes | Faster MVP; API-first design |
| Multiple boards in design | Yes | Future-proof; CBSE-only Phase 1 |
| Partial success imports | Yes | Educator friction reduction |
| PostgreSQL (not NoSQL) | Yes | Relational integrity, query power |
| Service-level caching | Yes | Read-heavy workload; invalidate on changes |
| PostgreSQL FTS | Yes | Built-in, fast, no sync issues |
| S3 file storage | Yes | Scalable, cloud-ready, secure |

---

## Open Questions / Future Decisions

1. **Phase 2 - Real-time Updates**: Use WebSocket or Server-Sent Events (SSE) for live import progress?
2. **Phase 2 - Question Difficulty Recommendation**: Use ML to suggest difficulty based on student performance?
3. **Phase 2 - Question Reuse Across Schools**: Allow questions from public banks to be shared; what permissions model?
4. **Phase 2 - Question Analysis**: Track "which questions have highest struggle rate?" and suggest improvements
5. **Internationalization**: Support non-English languages (Hindi, etc.); how to structure?

---

## Conclusion

The design prioritizes **educators' friction reduction** (easy import, quick search, clear feedback) while maintaining **system integrity** (immutability, auditability, referential consistency). The API-first approach with Phase 2 dashboard ensures a solid, testable foundation before building UI.
