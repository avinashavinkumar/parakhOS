# Implementation Plan: Curriculum & Question Bank Management

**Branch**: `002-curriculum-question-bank` | **Date**: 2026-08-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-curriculum-question-bank/spec.md`

## Summary

The Curriculum & Question Bank Management feature will provide a centralized, queryable repository of CBSE/NCERT curriculum structure and assessment questions. It serves as the upstream data layer for the assessment feature, enabling educators and admins to:

1. Import and manage curriculum hierarchies (Class → Subject → Topic → SubTopic)
2. Create, bulk-import, and AI-generate assessment questions with full metadata
3. Link questions to competencies and curriculum nodes
4. Track question provenance, versions, and import history
5. Manage a web-based admin dashboard for curriculum and question bank operations

This feature operates in two phases: **Phase 1 (MVP)** focuses on curriculum import, basic question management, and bulk import. **Phase 2** adds AI-assisted generation and the admin dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20 LTS, NestJS

**Primary Dependencies**: NestJS, PostgreSQL, BullMQ (for async bulk import jobs), AWS S3 or compatible (for import file storage), CSV parsing library (papaparse or csv-parser), file upload middleware (multer), JWT auth

**Storage**: PostgreSQL as primary relational store; S3-compatible storage for uploaded CSV/JSON files

**Testing**: Jest with Supertest for backend integration tests; contract tests for bulk import and curriculum endpoints

**Target Platforms**: REST API backend; web admin dashboard (Vue.js or React, to follow)

**Performance Goals**: 
- Curriculum queries return results in <100ms
- Bulk import processing at 100+ questions/second
- Question search/filter returns results in <200ms
- Admin dashboard loads in <2 seconds

**Constraints**: 
- CBSE/NCERT curriculum must be immutable after import (archive old versions, don't overwrite)
- Questions in use by live assessments cannot be deleted
- AI-generated questions must be human-reviewed before activation
- All import operations must be logged and auditable

## Constitution Check

*GATE: Must pass before implementation. Re-check after Phase 1 design.*

Pass. The chosen architecture complies with the project constitution:

- Code Quality Is Non-Negotiable: The modular NestJS service architecture separates curriculum, question bank, and import logic into distinct modules with clear interfaces.
- Test-First Validation Is Mandatory: Bulk import and question operations will have unit, integration, and contract tests to ensure data consistency and validation.
- User Experience Must Be Consistent and Accessible: The admin dashboard will follow common UI patterns for data management (list, create, edit, bulk import workflows).
- Performance Is a Product Requirement: Question queries use indexed curriculum paths; bulk imports use async job processing; curriculum is cached at the application layer.
- Simplicity and Maintainability Win Over Cleverness: Question storage follows a straightforward schema; versioning is explicit; no complex derivations.

No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-curriculum-question-bank/
├── plan.md              # This file
├── research.md          # Phase 0 design decisions (to be created)
├── data-model.md        # Data model and schema design
├── quickstart.md        # Local setup and validation guide (to be created)
├── contracts/
│   └── api-v1.md        # API contract for curriculum and question endpoints (to be created)
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Checklist for completion (to be created)
└── tasks.md             # Implementation backlog (to be created)
```

### Source Code Structure

```text
backend/src/
├── curriculum/                    # NEW: Curriculum management module
│   ├── curriculum.module.ts
│   ├── curriculum.controller.ts
│   ├── curriculum.service.ts
│   ├── entities/
│   │   ├── board.entity.ts
│   │   ├── class.entity.ts
│   │   ├── subject.entity.ts
│   │   ├── topic.entity.ts
│   │   ├── subtopic.entity.ts
│   │   └── learning-objective.entity.ts
│   ├── repositories/
│   │   ├── board.repository.ts
│   │   └── curriculum.repository.ts
│   └── test/
│       └── curriculum.integration.spec.ts
│
├── questions/                     # NEW: Question bank module
│   ├── questions.module.ts
│   ├── questions.controller.ts
│   ├── questions.service.ts
│   ├── entities/
│   │   ├── question.entity.ts
│   │   ├── question-version.entity.ts
│   │   ├── question-bank.entity.ts
│   │   └── ai-generation-request.entity.ts
│   ├── repositories/
│   │   ├── question.repository.ts
│   │   └── question-bank.repository.ts
│   ├── services/
│   │   ├── question-search.service.ts
│   │   ├── question-versioning.service.ts
│   │   └── question-validation.service.ts
│   └── test/
│       ├── question.integration.spec.ts
│       └── question-search.spec.ts
│
├── import/                        # NEW: Bulk import and file handling module
│   ├── import.module.ts
│   ├── import.controller.ts
│   ├── import.service.ts
│   ├── entities/
│   │   ├── import-log.entity.ts
│   │   └── import-detail.entity.ts
│   ├── processors/
│   │   ├── csv-parser.ts
│   │   ├── json-parser.ts
│   │   ├── import.job.ts           # BullMQ async job
│   │   └── import-validator.ts
│   ├── repositories/
│   │   └── import-log.repository.ts
│   └── test/
│       ├── csv-import.spec.ts
│       └── import-validation.spec.ts
│
├── ai/                            # Extend existing AI module (Phase 2)
│   ├── ai-question-generation/
│   │   ├── generation.service.ts
│   │   └── generation.job.ts
│   └── test/
│       └── ai-question-generation.spec.ts
│
└── admin/                         # NEW: Admin dashboard endpoints (Phase 2)
    ├── admin.module.ts
    ├── admin.controller.ts
    ├── admin.service.ts
    └── test/
        └── admin-dashboard.spec.ts
```

## Complexity Tracking

No exceptions to the constitution.

---

## Phase 0: Research and Decision Log

### Research Findings

1. **NCERT curriculum must be versioned and immutable**
   - Decision: Store curriculum as versioned snapshots; archive old versions when updating
   - Rationale: Questions reference specific curriculum versions; changing a curriculum definition retroactively breaks assessment historical comparisons
   - Implementation: Board and Curriculum entities have `validFrom` and `validTo` timestamps

2. **Questions need rich metadata for filtering and audit**
   - Decision: Include classId, subjectId, topicId, competencyId, learningObjectiveId, and provenance in every Question record
   - Rationale: Enables fast filtering and provides full traceability for import/generation workflows
   - Implementation: Denormalize curriculum path in Question entity for query efficiency

3. **Bulk import must support partial success and detailed error reporting**
   - Decision: Use BullMQ async jobs; process each row independently; collect errors without stopping on first failure
   - Rationale: Large batches (100s–1000s of questions) cannot block; educators need to know exactly which rows failed and why
   - Implementation: QuestionImportLog + QuestionImportDetail entities with per-row status and error messages

4. **AI-generated questions require human review before activation**
   - Decision: AI generates candidate questions; educators review and approve via staging workflow; only approved questions enter ACTIVE status
   - Rationale: Maintains educational integrity and fairness; AI is not the final authority
   - Implementation: AIGenerationRequest entity tracks request, generated questions, and review status

5. **Admin dashboard is required for adoption**
   - Decision: Build a Vue.js or React admin SPA alongside REST API
   - Rationale: Educators and curriculum coordinators expect a graphical interface; API-only operations create adoption friction
   - Implementation: Separate admin app folder; uses same REST API as mobile/backend

---

## Phase 1: Design Artifacts

### Curriculum Import Workflow

1. **Admin uploads curriculum file** (CSV/JSON) via `POST /api/v1/admin/curriculum/import`
2. **System validates structure**:
   - Required columns: class, subject, topic (CSV) or equivalent structure (JSON)
   - Optional: subtopic, description, learning_objectives
3. **System checks for duplicates**:
   - If class/subject/topic already exists, flag as update and show preview
   - Allow merge (keep old, replace, or keep both as versioned)
4. **On confirmation, system imports and stores**:
   - Creates Board, Class, Subject, Topic, SubTopic entities
   - Marks old versions as archived if updated
   - Returns import summary with counts and new IDs

### Question Lifecycle

```
DRAFT → ACTIVE → ARCHIVED
        ↓
      FLAGGED → ACTIVE or ARCHIVED
```

- Educators create questions in DRAFT status
- After review/approval, status becomes ACTIVE
- AI-generated questions must be reviewed before ACTIVE
- Questions in use by assessments can only be ARCHIVED, not deleted
- FLAGGED status indicates data quality issues requiring review

### Bulk Import Workflow

1. **Educator uploads CSV with questions** via `POST /api/v1/admin/questions/bulk-import`
2. **System validates each row**:
   - Checks required fields (prompt, itemType, correct answer, class, subject, topic, competency)
   - Validates relationships (class/subject/topic must exist)
   - Validates enum values (itemType, difficulty, provenance)
3. **System shows preview**:
   - Summary: X valid, Y warnings, Z errors
   - Allows educator to fix and retry without re-uploading valid rows
4. **On confirmation, system processes async**:
   - Creates BullMQ job for each batch
   - Creates Question records in DRAFT status
   - Creates QuestionImportLog + QuestionImportDetail for tracking
   - Sends completion notification with summary and error report

### Curriculum and Question Query Paths

**Get curriculum structure**:
```
GET /api/v1/curriculum/boards
GET /api/v1/curriculum/boards/{boardId}/classes
GET /api/v1/curriculum/classes/{classId}/subjects
GET /api/v1/curriculum/subjects/{subjectId}/topics
GET /api/v1/curriculum/topics/{topicId}/subtopics
GET /api/v1/curriculum/topics/{topicId}/learning-objectives
```

**Get questions**:
```
GET /api/v1/questions?classId=X&subjectId=Y&topicId=Z&difficulty=MEDIUM
GET /api/v1/questions/{questionId}
GET /api/v1/questions/{questionId}/versions
GET /api/v1/questions/search?prompt=<keywords>
```

### Performance and Quality Guards

- Index on (classId, subjectId, topicId, status) for fast question filtering
- Curriculum queries are cached at the service layer with 1-hour TTL
- Bulk import uses BullMQ to prevent blocking; max concurrency = 5 concurrent jobs
- Question validation runs before any write; no partial/invalid data is stored
- QuestionVersion entities are immutable; edit creates new version record
- All question changes (create, edit, approve, archive) are logged with user ID and timestamp

---

## Phase 1: Implementation Roadmap (MVP)

- T101: Design and create database schema for Board, Class, Subject, Topic, SubTopic, LearningObjective, Question, QuestionVersion, QuestionBank, QuestionImportLog, QuestionImportDetail
- T102: Create PostgreSQL migrations for curriculum and question entities
- T103: Create NestJS curriculum module with Board, Class, Subject, Topic, SubTopic repositories and services
- T104: Create curriculum controller with endpoints for listing and querying curriculum structure
- T105: Implement CSV/JSON curriculum import logic with validation and duplicate detection
- T106: Create NestJS questions module with Question, QuestionVersion, QuestionBank repositories and services
- T107: Create questions controller with endpoints for CRUD operations and question search
- T108: Implement question versioning and immutability; prevent deletion of in-use questions
- T109: Create import module with QuestionImportLog, QuestionImportDetail entities and BullMQ processors
- T110: Implement CSV question import with row-level validation, error reporting, and async job processing
- T111: Add database and service tests for curriculum import, question CRUD, and bulk import
- T112: Add contract tests for curriculum and question API endpoints

## Phase 2: Enhancement (to follow MVP)

- T201: Implement AI-assisted question generation workflow (AIGenerationRequest entity and service)
- T202: Integrate AI service for generating candidate questions from learning objectives
- T203: Create editor staging area UI for reviewing and approving AI-generated questions
- T204: Build admin dashboard (Vue.js or React SPA) for curriculum and question management
- T205: Add user authentication, role-based access control (educator vs. admin) for question/curriculum operations
- T206: Implement bulk export and templating for question download
- T207: Add analytics and question-difficulty recommendation based on student performance
- T208: Support for additional curriculum boards (ICSE, State Boards) beyond CBSE

---

## Integration Points with Assessment Feature (001)

1. **Assessment uses Curriculum**:
   - When creating an Assessment, the system queries available Topics for a given Class/Subject
   - Assessment blueprints specify which Topics/SubTopics to include

2. **Assessment uses Questions**:
   - AssessmentItem references Question entities
   - Assessment lists questions filtered by classId, subjectId, topicId

3. **Growth Reporting uses Curriculum Context**:
   - When generating GrowthReports, the system includes curriculum context (subject, topic, learning objective)
   - Parents and educators can see which curriculum areas show improvement or need support

4. **Question Performance Analytics**:
   - Scoring service tracks which questions students struggle with
   - Educators use this to improve question difficulty or learning objective alignment

---

## Dependencies and Prerequisites

- PostgreSQL database with write access
- File upload handling (multer middleware already in backend)
- BullMQ and Redis for async job processing
- JWT authentication from existing auth module
- Competency entities from assessment feature must already exist in database

## Success Criteria

- All CBSE curriculum data imports successfully in <5 seconds
- Educators can bulk-import 500+ questions with detailed validation and error reporting
- Questions are queryable by class/subject/topic in <100ms
- Question edit history is complete and auditable
- AI-generated questions require human review before activation
- Admin dashboard loads and renders curriculum/question management views in <2 seconds
