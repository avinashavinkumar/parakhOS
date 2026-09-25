# Implementation Tasks: Student OS Assessment & Growth Framework

## Phase 1: Backend Foundation

- [x] T001 Create the TypeScript/NestJS backend package and build configuration in `backend/`.
- [x] T002 Add the core Student, Assessment, Attempt, Response, and CompetencyResult domain types.
- [x] T003 Add a runnable application module and API bootstrap with validation middleware.

## Phase 2: Assessment Vertical Slice

- [x] T004 [P] Add stage-aware demo student and assessment fixtures.
- [x] T005 Implement assessment listing and student profile endpoints.
- [x] T006 Implement attempt creation, response persistence, and completion state transitions.
- [x] T007 Implement deterministic explainable scoring with insufficient-evidence handling.
- [x] T008 Add growth and recommendation endpoints based on completed attempts.
- [x] T009 Add service tests for completion, explainability, incomplete evidence, and stage validation.

## Phase 3: Durable Product Foundations

- [x] T010 Add PostgreSQL connectivity, JDBC URL normalization, startup schema initialization, and core tables based on the supplied database dictionary.
- [ ] T010a Replace the in-memory assessment store with PostgreSQL repositories for students, assessments, attempts, responses, and scores.
- [ ] T011 Add JWT authentication, parent/educator access relationships, consent checks, and audit logging.
- [ ] T012 Add versioned assessment blueprints and structured repository item management.
- [ ] T013 Add API contract tests for all endpoints in `contracts/api-v1.md`.

## Phase 4: Scoring, AI, and Reporting

- [ ] T014 Implement versioned developmental-stage scoring models and score history persistence.
- [ ] T015 Add an AI gateway that produces evidence and recommendations without final-score authority.
- [ ] T016 Add asynchronous evaluation jobs and retryable report generation.
- [ ] T017 Add parent-facing report payloads with evidence explanations and contextual growth interpretation.

## Phase 5: Mobile and Operations

- [ ] T018 Scaffold the Flutter mobile app and connect authentication and assessment session flows.
- [ ] T019 Add accessible student assessment, parent report, and growth screens.
- [ ] T020 Add Redis-backed sessions and job queues, object storage for media, and operational health checks.
- [ ] T021 Add end-to-end validation for the four scenarios in `quickstart.md`.
