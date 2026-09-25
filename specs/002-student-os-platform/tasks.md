---
description: "Task list for admin authentication and protected question authoring"
---

# Tasks: Admin Question Authoring Access

**Input**: Design documents from `specs/002-student-os-platform/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/api-v1.md`, and `quickstart.md`

**Tests**: Included because the feature specification requires automated coverage and the project constitution mandates test-first validation.

## Phase 1: Setup

**Purpose**: Confirm the existing application structure and establish the implementation surfaces for the shared NestJS API and Vite admin app.

- [ ] T001 Confirm backend and admin package scripts and dependency baselines in `backend/package.json` and `apps/admin/package.json`
- [ ] T002 [P] Configure Playwright browser testing and the `test:e2e` script in `apps/admin/package.json`, `apps/admin/playwright.config.ts`, and `apps/admin/tests/fixtures.ts`
- [X] T003 [P] Define the compiled admin provisioning CLI entry point and `admin:provision` script using `ADMIN_EMAIL`, optional `ADMIN_PHONE`, and `ADMIN_PASSWORD` in `backend/src/admin-provisioning.ts` and `backend/package.json`

---

## Phase 2: Foundational

**Purpose**: Blocking infrastructure required before any user story can be implemented.

- [X] T004 Extend `backend/database/schema.sql` with the concrete curriculum tables `curriculum_boards`, `curriculum_classes`, `curriculum_subjects`, `curriculum_class_subjects`, `curriculum_topics`, `curriculum_subtopics`, `curriculum_learning_objectives`, and `curriculum_syllabus`, then add `question_bank_questions` and `question_bank_versions` with status defaults, actor foreign keys, curriculum foreign keys, timestamps, and indexes
- [X] T005 [P] Import `AuthModule` and `QuestionsModule` into the root Nest module in `backend/src/app.module.ts`
- [X] T006 [P] Add shared authenticated request claim types and bearer parsing helpers in `backend/src/auth.types.ts`
- [X] T007 Add the admin role to the shared auth role model while keeping public signup roles restricted to student and parent in `backend/src/auth.service.ts` and `backend/src/auth.controller.ts`
- [X] T008 Add a reusable admin authorization guard that validates bearer signatures, expiration, and `role: admin` in `backend/src/admin-auth.guard.ts`
- [ ] T009 [P] Add HTTP error/status handling conventions for authentication and authorization failures in `backend/src/main.ts` and `backend/src/admin-auth.guard.ts`

**Checkpoint**: The API modules are mounted, the question-bank tables exist, and authenticated admin claims can be established before story implementation begins.

---

## Phase 3: User Story 1 - Admin signs in (Priority: P1) MVP

**Goal**: An active, provisioned admin can authenticate through the shared login endpoint and receive a bearer session, while non-admin accounts cannot authenticate as admins.

**Independent Test**: Provision an active admin, call `POST /api/v1/auth/login` with `role: admin`, verify the documented bearer response and role claim, then verify student/parent and inactive/wrong-credential attempts are rejected.

### Tests for User Story 1

- [ ] T010 [P] [US1] Add failing service tests for successful admin login, inactive admin rejection, invalid admin credentials, missing fields, and unsupported roles in `backend/src/auth.service.spec.ts`
- [ ] T011 [P] [US1] Add failing controller contract tests for the admin login request and documented `200`, `400`, and `401` responses in `backend/src/auth.controller.spec.ts`
- [ ] T012 [P] [US1] Add failing provisioning tests for admin creation, duplicate identifiers, password hashing, and refusal to create an admin through public signup in `backend/src/admin-provisioning.spec.ts`

### Implementation for User Story 1

- [X] T013 [US1] Extend `AuthService.login` to query active admin accounts, preserve the existing bearer response shape, include `role` in signed claims, and update `last_login_at` in `backend/src/auth.service.ts`
- [X] T014 [US1] Keep `AuthService.signup` and `AuthController.signup` limited to `student` and `parent`, returning a validation error for `role: admin` in `backend/src/auth.service.ts` and `backend/src/auth.controller.ts`
- [X] T015 [US1] Implement controlled admin provisioning with scrypt password hashing, active status, and duplicate identifier handling in `backend/src/admin-provisioning.ts`
- [X] T016 [US1] Update token verification to safely reject malformed, tampered, expired, or role-missing tokens and return typed claims in `backend/src/auth.service.ts` and `backend/src/auth.types.ts`
- [ ] T017 [US1] Preserve and extend existing student and parent auth regression coverage for the new role-aware token behavior in `backend/src/auth.service.spec.ts`

**Checkpoint**: Admin login and controlled provisioning work independently, public signup cannot grant admin access, and existing student/parent auth tests remain green.

---

## Phase 4: User Story 2 - Admin creates a question (Priority: P1)

**Goal**: An authenticated admin can create a validated draft question whose creator is taken from the authenticated identity.

**Independent Test**: Send a valid question payload to `POST /api/v1/questions` with an admin bearer token, verify a draft response and persisted `createdBy`, then submit invalid question data and verify no write occurs.

### Tests for User Story 2

- [ ] T018 [P] [US2] Add failing service tests for valid draft creation, default provenance/status, validation errors, and creator attribution in `backend/src/questions.service.spec.ts`
- [ ] T019 [P] [US2] Add failing controller contract tests for `POST /api/v1/questions`, including `201`, `400`, and authenticated actor propagation in `backend/src/questions.controller.spec.ts`
- [ ] T020 [P] [US2] Add a failing integration test that mounts the root Nest application and persists a created question against the question-bank schema in `backend/src/questions.integration.spec.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Add named curriculum fixtures and question-bank seed data needed by the end-to-end creation scenario in `backend/src/questions.integration.spec.ts`
- [ ] T022 [US2] Change `QuestionInput` and `QuestionsService.create` to accept the authenticated admin subject separately from client question content in `backend/src/questions.service.ts`
- [X] T023 [US2] Apply the admin guard to `POST /api/v1/questions` and pass verified claims to the service without trusting a client-supplied `createdBy` in `backend/src/questions.controller.ts`
- [ ] T024 [US2] Preserve and complete item type, difficulty, prompt, MCQ/true-false option, answer-key, and provenance validation before persistence in `backend/src/questions.service.ts`
- [ ] T025 [US2] Return the documented created-question response with draft status, authenticated creator, timestamps, and stable validation errors in `backend/src/questions.service.ts` and `backend/src/questions.controller.ts`

**Checkpoint**: A valid admin can create a draft question end to end, and invalid content is rejected before database mutation.

---

## Phase 5: User Story 3 - Unauthorized access is denied (Priority: P1)

**Goal**: Every question-management mutation rejects unauthenticated, malformed, expired, tampered, and non-admin requests.

**Independent Test**: Exercise create, update, approve, archive, and import mutations with no token, invalid tokens, and valid student/parent tokens; verify `401` or `403` and no database mutation.

### Tests for User Story 3

- [X] T026 [P] [US3] Add failing guard tests for missing, malformed, tampered, expired, and non-admin bearer tokens in `backend/src/admin-auth.guard.spec.ts`
- [ ] T027 [P] [US3] Add failing controller authorization tests for question create, update, approve, archive, and import mutation routes in `backend/src/questions.controller.spec.ts` and `backend/src/curriculum.controller.spec.ts`
- [ ] T028 [P] [US3] Add failing tests proving client-supplied `createdBy` and `changedBy` cannot override authenticated identity in `backend/src/questions.service.spec.ts`
- [ ] T029 [P] [US3] Add failing integration tests for `401`, `403`, `400`, and no-write behavior across protected mutations in `backend/src/admin-authorization.integration.spec.ts`

### Implementation for User Story 3

- [X] T030 [US3] Apply the admin guard to question update, approve, archive, and all question/curriculum import mutation endpoints in `backend/src/questions.controller.ts` and `backend/src/curriculum.controller.ts`
- [ ] T031 [US3] Remove trusted client actor fields from update inputs and pass authenticated `changedBy` into version snapshots in `backend/src/questions.service.ts`
- [ ] T032 [US3] Wrap question version snapshot and current-question update in one transaction so failed updates cannot leave partial audit history in `backend/src/questions.service.ts` and `backend/src/database.service.ts`
- [ ] T033 [US3] Ensure authorization failures occur before service/database mutation calls and map them to the API contract status codes in `backend/src/admin-auth.guard.ts` and protected controllers
- [X] T034 [US3] Add admin-only import authorization while preserving existing curriculum/question import validation behavior in `backend/src/curriculum.controller.ts` and `backend/src/question-import.parser.ts`

**Checkpoint**: All protected question-management mutations are server-enforced, audit actors come from verified claims, and unauthorized requests do not write.

---

## Phase 6: User Story 4 - Admin uses the web login and authoring entry point (Priority: P2)

**Goal**: An admin can sign in through the browser, retain a session, open New question, submit a question, see useful errors, and log out.

**Independent Test**: Run the backend and Vite app, open `/admin/login`, sign in with a provisioned admin, create a valid question through the form, observe success/error states, and log out to return to the login screen.

### Tests for User Story 4

- [ ] T035 [P] [US4] Add Playwright coverage for admin login, protected redirect, logout, and authentication/authorization error states in `apps/admin/tests/admin-login.spec.ts`
- [ ] T036 [P] [US4] Add Playwright coverage for question-form validation, successful submission, server errors, and loading states in `apps/admin/tests/question-authoring.spec.ts`

### Implementation for User Story 4

- [X] T037 [US4] Add an admin-specific login route and role selector behavior that submits `role: admin` without exposing admin signup in `apps/admin/src/login/LoginPage.tsx` and `apps/admin/src/App.tsx`
- [ ] T038 [US4] Add an admin session helper that stores the bearer token, attaches `Authorization`, handles `401` redirect, handles `403` errors, and clears state on logout in `apps/admin/src/auth/adminSession.ts`
- [ ] T039 [US4] Protect the admin dashboard route and replace unauthenticated demo fallback behavior with an explicit login/connection state in `apps/admin/src/App.tsx`
- [ ] T040 [US4] Build the question authoring form with curriculum selectors, item type, difficulty, prompt, MCQ options, correct answer, provenance, draft submission, and accessible validation feedback in `apps/admin/src/question-bank/QuestionForm.tsx`
- [X] T041 [US4] Connect the New question action and question-bank submission to `POST /api/v1/questions`, including loading, success, `400`, `401`, `403`, and persistence error states in `apps/admin/src/App.tsx` and `apps/admin/src/question-bank/QuestionForm.tsx`
- [ ] T042 [US4] Add admin login, authoring form, logout, error, responsive, and focus-visible styles consistent with the existing design system in `apps/admin/src/login/LoginPage.css` and `apps/admin/src/styles.css`
- [ ] T043 [US4] Update admin client API types and environment URL handling to match `specs/002-student-os-platform/contracts/api-v1.md` in `apps/admin/src/api.ts`

**Checkpoint**: The browser flow provides a usable, protected admin login and question authoring experience against the real API.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature, documentation, security posture, and existing regressions.

- [ ] T044 [P] Update `README.md` with admin provisioning, admin login, question-authoring setup, and required environment variables
- [ ] T045 [P] Reconcile `specs/002-student-os-platform/quickstart.md` with the final provisioning command, route names, and browser flow in `README.md`
- [X] T046 Run backend focused tests for auth, guards, questions, imports, and integration behavior with `Set-Location backend; npm test -- --runInBand`
- [X] T047 Run backend production compilation with `Set-Location backend; npm run build`
- [ ] T048 Run admin production compilation and browser tests with `Set-Location apps/admin; npm run build; npm run test:e2e`
- [ ] T049 Run the complete quickstart validation from `specs/002-student-os-platform/quickstart.md`, including unauthorized mutation checks and creator attribution
- [ ] T050 Review protected routes and client session handling for secret exposure, unsafe fallbacks, missing authorization, and accessible error states in `backend/src` and `apps/admin/src`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms the existing project surfaces.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because it mounts modules, defines the schema, and establishes shared claims/guard infrastructure.
- **User Story 1 (Phase 3)**: Depends on Foundational; provides the admin token and provisioning path.
- **User Story 2 (Phase 4)**: Depends on Foundational and the authenticated claims shape from US1; can begin service/schema tests in parallel, but end-to-end execution uses US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and the protected mutation surfaces from US2; its guard tests can begin after T008.
- **User Story 4 (Phase 6)**: Depends on US1 for admin login and US2/US3 for the protected question contract.
- **Polish (Phase 7)**: Depends on all desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Foundational only; MVP authentication increment.
- **US2 (P1)**: Foundational plus the typed claims/role contract from US1; independently testable with a seeded token fixture.
- **US3 (P1)**: Foundational plus the mutation endpoints from US2; independently testable through guard/controller integration tests.
- **US4 (P2)**: Depends on the stable API behavior from US1-US3; frontend work can proceed in parallel with backend tests once the contract is fixed.

### Parallel Opportunities

- T002, T003, T005, T006, and T009 can run in parallel after the initial setup inspection.
- T010-T012 can run in parallel because they target separate test surfaces.
- T018-T020 can run in parallel before the US2 implementation tasks.
- T026-T029 can run in parallel before the US3 implementation tasks.
- T035-T036 can run in parallel with backend stabilization once the API contract is fixed.
- T044-T045 can run in parallel with final executable validation.

## Parallel Example: User Story 1

```text
Task T010: AuthService admin login and rejection tests in backend/src/auth.service.spec.ts
Task T011: AuthController admin login contract tests in backend/src/auth.controller.spec.ts
Task T012: Admin provisioning tests in backend/src/admin-provisioning.spec.ts
```

## Parallel Example: User Story 4

```text
Task T035: Admin login/session browser coverage in apps/admin/src/login/LoginPage.test.tsx
Task T036: Question form browser coverage in apps/admin/src/question-bank/QuestionForm.test.tsx
Task T038: Admin session helper in apps/admin/src/auth/adminSession.ts
```

## Implementation Strategy

### MVP First

1. Complete Phase 1 Setup.
2. Complete Phase 2 Foundational, including schema reconciliation and module mounting.
3. Complete Phase 3 User Story 1 for controlled admin authentication.
4. Complete Phase 4 User Story 2 for protected draft question creation.
5. Complete Phase 5 User Story 3 for authorization enforcement.
6. Validate the backend MVP with focused tests and build before starting the browser workflow.

### Incremental Delivery

1. Deliver admin provisioning and login.
2. Deliver protected question creation with creator attribution.
3. Deliver protection for update, approval, archive, and imports.
4. Deliver the admin browser login and authoring experience.
5. Run the complete quickstart and regression suite.

### MVP Scope

The smallest useful release is **US1 + US2 + US3**: an approved admin can authenticate, create questions, and cannot be bypassed by unauthenticated or non-admin callers. US4 completes the intended browser experience.

## Format Validation

All implementation tasks use the required `- [ ] T###` checklist format. Story tasks include `[US#]`; parallelizable tasks include `[P]`; every task description names an exact repository file or command path.
