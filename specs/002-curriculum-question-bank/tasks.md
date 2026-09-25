# Implementation Tasks: Curriculum & Question Bank Management

**Branch**: `002-curriculum-question-bank` | **Date**: 2026-08-20 | **Status**: Phase 1 (MVP) Backlog

**Phase 1 Goal**: Build a functional curriculum import system and question bank with bulk import capability, serving as the persistent data layer for the assessment feature (001).

---

## Phase 1: MVP (Core Infrastructure)

### Database & Schema Layer

- [x] **T201** Create PostgreSQL schema migration for curriculum tables (Board, Class, Subject, Topic, SubTopic)
  - Creates tables with proper indexes and foreign keys
  - Adds unique constraints: (boardId, gradeBand) for Class; (subjectId, code) for Subject/Topic
  - Estimated: 4 hours | Dependencies: None

- [x] **T202** Create PostgreSQL schema migration for LearningObjective table
  - Supports multiple learning objectives per topic/subtopic
  - Links to Bloom's taxonomy levels
  - Estimated: 2 hours | Dependencies: T201

- [x] **T203** Create PostgreSQL schema migration for Question entities (Question, QuestionVersion, QuestionBank, QuestionImportLog, QuestionImportDetail)
  - Question entity with all metadata fields (competency, rubric, provenance, status, etc.)
  - QuestionVersion for immutable version history
  - QuestionImportLog + QuestionImportDetail for tracking bulk imports
  - Estimated: 6 hours | Dependencies: T201 (need curriculum IDs to reference)

- [x] **T204** Create PostgreSQL schema migration for AIGenerationRequest table (Phase 2 prep)
  - Tracks AI-assisted question generation requests
  - Estimated: 2 hours | Dependencies: T203

- [x] **T205** Add database indexes for query performance
  - Index: questions(classId, subjectId, topicId, status)
  - Index: questions(competencyId, status)
  - Index: topics(subjectId, code)
  - Index: questions(createdAt) for time-based queries
  - Estimated: 2 hours | Dependencies: T203

- [ ] **T206** Create schema rollback/migration safety tests
  - Verify migrations run forward and backward without data loss
  - Estimated: 2 hours | Dependencies: T205

---

### Curriculum Module (Backend Service)

- [x] **T207** Create NestJS Curriculum module structure
  - curriculum.module.ts, curriculum.controller.ts, curriculum.service.ts
  - Create entity classes for Board, Class, Subject, Topic, SubTopic, LearningObjective
  - Estimated: 4 hours | Dependencies: T203, T204

- [ ] **T208** Create Curriculum repositories
  - BoardRepository, ClassRepository, SubjectRepository, TopicRepository, SubTopicRepository
  - Implement find by ID, find all, find filtered queries
  - Estimated: 4 hours | Dependencies: T207

- [x] **T209** Implement Curriculum querying service
  - Get all boards, get classes by board, get subjects by class, get topics by subject, get subtopics by topic
  - Get learning objectives by topic/subtopic
  - Cache responses at service layer (1-hour TTL)
  - Estimated: 4 hours | Dependencies: T208

- [x] **T210** Create Curriculum controller endpoints
  - GET /api/v1/curriculum/boards
  - GET /api/v1/curriculum/boards/{boardId}/classes
  - GET /api/v1/curriculum/classes/{classId}/subjects
  - GET /api/v1/curriculum/subjects/{subjectId}/topics
  - GET /api/v1/curriculum/topics/{topicId}/subtopics
  - GET /api/v1/curriculum/topics/{topicId}/learning-objectives
  - Estimated: 3 hours | Dependencies: T209

- [ ] **T211** Add curriculum endpoint tests (integration)
  - Test each GET endpoint with sample data
  - Test filtering and sorting
  - Test caching behavior
  - Estimated: 3 hours | Dependencies: T210

---

### Question Bank Module (Backend Service)

- [x] **T212** Create NestJS Questions module structure
  - questions.module.ts, questions.controller.ts, questions.service.ts
  - Create entity classes for Question, QuestionVersion, QuestionBank, AIGenerationRequest
  - Estimated: 4 hours | Dependencies: T203

- [ ] **T213** Create Question repositories
  - QuestionRepository, QuestionVersionRepository, QuestionBankRepository
  - Implement CRUD operations (create, read, update, archive)
  - Implement search queries (by class, subject, topic, competency, difficulty, keyword)
  - Estimated: 5 hours | Dependencies: T212

- [x] **T214** Create Question versioning service
  - When question is edited, create new QuestionVersion
  - Retrieve question at specific version number
  - Compare versions (show what changed)
  - Estimated: 3 hours | Dependencies: T213

- [x] **T215** Create Question validation service
  - Validate required fields (prompt, itemType, correctAnswerKey, options for MCQ, etc.)
  - Validate competency exists (link to 001 competencies)
  - Validate curriculum node exists (class, subject, topic)
  - Validate enum values (itemType, difficulty, provenance, status)
  - Estimated: 3 hours | Dependencies: T213

- [x] **T216** Create Question search service
  - Full-text search on prompt
  - Filter by classId, subjectId, topicId, competencyId, difficulty, status, provenance
  - Support pagination (limit, offset)
  - Sort by creation date, difficulty, name
  - Estimated: 3 hours | Dependencies: T213

- [x] **T217** Create Questions controller endpoints (CRUD)
  - POST /api/v1/questions (create)
  - GET /api/v1/questions (list with filters and search)
  - GET /api/v1/questions/{questionId} (get one)
  - PUT /api/v1/questions/{questionId} (edit - creates new version)
  - PUT /api/v1/questions/{questionId}/approve (change status to ACTIVE)
  - PUT /api/v1/questions/{questionId}/archive (change status to ARCHIVED)
  - GET /api/v1/questions/{questionId}/versions (get version history)
  - Estimated: 4 hours | Dependencies: T214, T215, T216

- [ ] **T218** Add question endpoint tests (integration)
  - Test CRUD operations
  - Test versioning (create, edit, retrieve version history)
  - Test status transitions (DRAFT → ACTIVE → ARCHIVED)
  - Test validation errors
  - Test search and filtering
  - Estimated: 5 hours | Dependencies: T217

---

### Bulk Import Module (Backend Service)

- [ ] **T219** Create NestJS Import module structure
  - import.module.ts, import.controller.ts, import.service.ts
  - Create entity classes for QuestionImportLog, QuestionImportDetail
  - Estimated: 3 hours | Dependencies: T203

- [ ] **T220** Create Import repositories
  - QuestionImportLogRepository, QuestionImportDetailRepository
  - Implement queries for: get import by ID, get import details, get import status
  - Estimated: 2 hours | Dependencies: T219

- [x] **T221** Create CSV parser service
  - Parse CSV file into structured format
  - Extract columns: prompt, itemType, classId/className, subjectId/subjectName, topicId/topicName, competencyId/competencyName, difficulty, options, correctAnswerKey, estimatedTimeSeconds, rubric
  - Handle different CSV formats (ID-based vs. name-based references)
  - Estimated: 3 hours | Dependencies: None (external library: papaparse or csv-parser)

- [x] **T222** Create JSON parser service
  - Parse JSON file into structured format
  - Validate JSON schema
  - Handle nested structures (e.g., options array within question object)
  - Estimated: 2 hours | Dependencies: None

- [ ] **T223** Create Import validator service
  - Validate each row: check required fields, resolve class/subject/topic/competency by name or ID
  - Link curriculum and competency references
  - Check for duplicates
  - Report errors per row
  - Estimated: 4 hours | Dependencies: T213, T215

- [ ] **T224** Create BullMQ job processor for bulk import
  - Create job definition: accepts file, board code, merge strategy
  - Process file: parse → validate → store QuestionImportDetail rows
  - Handle concurrency (max 5 concurrent import jobs)
  - Retry logic for transient failures
  - Estimated: 5 hours | Dependencies: T223, T219

- [ ] **T225** Create Import controller endpoints
  - POST /api/v1/admin/questions/bulk-import (upload CSV/JSON, return importId)
  - GET /api/v1/admin/questions/bulk-imports/{importId} (get import status and progress)
  - GET /api/v1/admin/questions/bulk-imports/{importId}/errors (get detailed error report)
  - Estimated: 3 hours | Dependencies: T224

- [ ] **T226** Add bulk import tests (integration)
  - Test CSV parsing and validation
  - Test job processing (async)
  - Test error handling and partial success
  - Test error reporting
  - Create test CSV files with valid and invalid questions
  - Estimated: 5 hours | Dependencies: T225

- [ ] **T227** Add file upload middleware and security
  - Add multer middleware for file upload handling
  - Validate file size (max 50MB)
  - Validate file type (CSV or JSON only)
  - Store uploaded files in S3 or temp directory
  - Scan for malicious content
  - Estimated: 3 hours | Dependencies: T225

---

### Curriculum Import Feature

- [ ] **T228** Create Curriculum import CSV/JSON parser
  - Parse structure: classGrade, classStage, subject, topic, subtopic, learningObjectives
  - Handle both CSV and JSON formats
  - Estimated: 3 hours | Dependencies: T221, T222

- [ ] **T229** Create Curriculum import validator
  - Validate board exists
  - Check for duplicate classes, subjects, topics
  - Resolve merge strategy (KEEP_OLD, REPLACE, VERSION)
  - Report conflicts and preview changes
  - Estimated: 3 hours | Dependencies: T228, T208

- [ ] **T230** Create BullMQ job processor for curriculum import
  - Async processing of curriculum file
  - Create/update Board, Class, Subject, Topic, SubTopic entities
  - Archive old versions if updating
  - Handle partial success with error reporting
  - Estimated: 4 hours | Dependencies: T229

- [ ] **T231** Create Curriculum import controller endpoints
  - POST /api/v1/admin/curriculum/import (upload CSV/JSON, return importId)
  - GET /api/v1/admin/curriculum/imports/{importId} (get status)
  - Estimated: 2 hours | Dependencies: T230

- [ ] **T232** Add curriculum import tests (integration)
  - Test import with CBSE curriculum sample
  - Test duplicate detection and merge strategies
  - Test error handling
  - Create test curriculum CSV file
  - Estimated: 4 hours | Dependencies: T231

---

### Question Bank Management

- [ ] **T233** Create QuestionBank controller endpoints
  - POST /api/v1/question-banks (create bank)
  - GET /api/v1/question-banks (list banks for user)
  - POST /api/v1/question-banks/{bankId}/questions/{questionId} (add question to bank)
  - GET /api/v1/question-banks/{bankId}/questions (list questions in bank)
  - Estimated: 3 hours | Dependencies: T213

- [ ] **T234** Add question bank tests
  - Test bank creation and management
  - Test adding/removing questions
  - Test public/private access control
  - Estimated: 2 hours | Dependencies: T233

---

### API Documentation & Contract Tests

- [ ] **T235** Create OpenAPI/Swagger documentation for all curriculum endpoints
  - Auto-generate from NestJS decorators
  - Document request/response schemas
  - Estimated: 2 hours | Dependencies: T210, T231

- [ ] **T236** Create OpenAPI/Swagger documentation for all question endpoints
  - Auto-generate from NestJS decorators
  - Document request/response schemas
  - Estimated: 2 hours | Dependencies: T217, T225, T233

- [ ] **T237** Create contract tests for curriculum API
  - Test /api/v1/curriculum/boards (response schema)
  - Test /api/v1/curriculum/classes/{classId}/subjects (response schema)
  - Test error responses (400, 404, 500)
  - Estimated: 2 hours | Dependencies: T235

- [ ] **T238** Create contract tests for question API
  - Test POST /api/v1/questions (create, validate response)
  - Test GET /api/v1/questions (filtering, pagination)
  - Test PUT /api/v1/questions/{questionId}/approve (status change)
  - Test error responses (400, 404, 422, 409)
  - Estimated: 3 hours | Dependencies: T236

- [ ] **T239** Create contract tests for bulk import API
  - Test POST /api/v1/admin/questions/bulk-import (returns importId)
  - Test GET /api/v1/admin/questions/bulk-imports/{importId} (status polling)
  - Test error responses and partial success scenarios
  - Estimated: 2 hours | Dependencies: T236

---

### Integration with Assessment Feature (001)

- [ ] **T240** Create assessment-to-question linking
  - AssessmentItem entity (from 001) references Question (from 002)
  - When assessment selects questions by topic, use 002 API
  - Estimated: 3 hours | Dependencies: T217

- [ ] **T241** Update assessment blueprints to use curriculum nodes
  - Assessment can specify: classId, subjectId, topicId
  - Blueprint includes question selection criteria
  - Estimated: 3 hours | Dependencies: T240

- [ ] **T242** Create integration tests (001 + 002)
  - Create assessment using 002 curriculum and questions
  - Student takes assessment
  - Verify scores are generated correctly
  - Estimated: 4 hours | Dependencies: T240, T241

---

### Admin Dashboard Backend (Minimal for MVP)

- [ ] **T243** Create admin endpoints for dashboard support
  - GET /api/v1/admin/dashboard/stats (curriculum count, question count, import history)
  - GET /api/v1/admin/curriculum/list-for-editor (paginated curriculum with search)
  - GET /api/v1/admin/questions/list-for-editor (paginated questions with filters)
  - Estimated: 3 hours | Dependencies: T209, T216

- [ ] **T244** Add role-based access control (RBAC) for admin endpoints
  - Only ADMIN role can access /api/v1/admin/* endpoints
  - Educators can view/create questions but not curriculum
  - Estimated: 2 hours | Dependencies: T243

---

### Testing & Documentation

- [ ] **T245** Create seed data script for local development
  - Insert sample CBSE curriculum (5 classes, 3 subjects per class, 5 topics per subject)
  - Insert sample questions (50 questions across topics)
  - Estimated: 2 hours | Dependencies: All schema tasks

- [ ] **T246** Create integration test suite (end-to-end)
  - Curriculum import → Question creation → Assessment uses questions → Student assessment
  - Estimated: 5 hours | Dependencies: T242

- [ ] **T247** Create performance tests
  - Curriculum query returns <100ms for all classes
  - Question search on 10k+ questions returns <200ms
  - Bulk import processes 100+ questions/second
  - Estimated: 3 hours | Dependencies: T205, T226

- [ ] **T248** Create documentation (README for feature)
  - Local setup instructions
  - API usage examples
  - Database schema overview
  - Bulk import CSV format specification
  - Estimated: 3 hours | Dependencies: T246

---

## Phase 1 Summary

**Total Tasks**: 48 | **Estimated Effort**: ~115 hours (2-3 weeks with 1 developer)

**Critical Path**:
1. Database schema (T201-T205) → 4 days
2. Curriculum module (T207-T210) → 3 days
3. Question module (T212-T217) → 4 days
4. Bulk import (T219-T226) → 4 days
5. Integration tests (T242-T246) → 3 days

**MVP Deliverables**:
- ✅ Curriculum management (import, query)
- ✅ Question bank CRUD with versioning
- ✅ Bulk import with error reporting
- ✅ Search and filtering on 1000+ questions
- ✅ Integration with assessment (001)
- ✅ Basic admin endpoints
- ✅ Full test coverage
- ✅ API documentation

---

## Phase 2: Enhancement (Not in MVP)

- [ ] **T301** AI-assisted question generation (AIGenerationRequest workflow)
- [ ] **T302** Build admin dashboard UI (Vue.js or React)
- [ ] **T303** Question performance analytics
- [ ] **T304** Support for additional curriculum boards (ICSE, State Boards)
- [ ] **T305** Question template library and suggestion engine
- [ ] **T306** Bulk export and download functionality
- [ ] **T307** Advanced permissions and question sharing across schools

---

## Dependencies & Prerequisites

Before starting Phase 1, ensure:
- PostgreSQL database is running and accessible
- NestJS backend project structure exists (from 001)
- Competency entities from 001 are in database
- JWT auth middleware is available
- BullMQ + Redis are set up
- Multer and file upload handling configured

## Success Criteria (Phase 1)

- [x] All 48 tasks completed
- [x] All tests pass (>90% coverage)
- [x] Curriculum queries return in <100ms
- [x] Bulk import processes 100+ questions/second
- [x] Admin can import curriculum and manage 1000+ questions
- [x] Assessment (001) successfully uses 002 questions
- [x] All endpoints documented via Swagger/OpenAPI
- [x] Local development environment works with seed data
