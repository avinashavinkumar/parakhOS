# Implementation Plan: Admin Question Authoring Access

**Branch**: `002-student-os-platform` | **Date**: 2026-09-22 | **Spec**: [spec.md](spec.md)

**Input**: Admin login and protected access to put questions in the database.

## Summary

Extend the existing NestJS authentication flow to support active admin accounts while keeping public signup limited to students and parents. Add reusable bearer-token role authorization around question mutations, derive creator and change actors from verified token claims, reconcile the question-bank schema used by the service, and complete the Vite admin login and question-authoring flow.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js, React with TypeScript

**Primary Dependencies**: NestJS 11, Express adapter, PostgreSQL `pg`, Jest 29, Vite, React, lucide-react

**Storage**: PostgreSQL; `DatabaseService` initializes `backend/database/schema.sql` on startup

**Testing**: Jest with ts-jest for backend unit/service tests, Nest controller/integration coverage, Playwright browser tests for the admin flow, and Vite TypeScript/build validation

**Target Platform**: Node.js API and browser-based admin application

**Project Type**: Web application with backend API and admin frontend

**Performance Goals**: Preserve current API responsiveness; avoid database lookups on every request by validating signed bearer claims, with bounded question-list pagination

**Constraints**: Admin creation is server-controlled; question mutations require admin authorization; existing student/parent login and assessment behavior must remain compatible; no client-supplied audit identity may be trusted

**Scale/Scope**: One admin workspace, existing question bank and curriculum entities, shared auth endpoint, focused first release with create/update/approve/archive flows

## Constitution Check

*GATE: Must pass before Phase 0 research and after Phase 1 design.*

- **Code Quality**: PASS. Reuse existing `AuthService`, `QuestionsService`, module boundaries, and admin styling; avoid a second auth or UI framework.
- **Test-First Validation**: PASS with required implementation work. The plan includes red-to-green tests for admin login, guards, actor attribution, protected mutations, and regression coverage for student/parent flows.
- **UX and Accessibility**: PASS. The admin flow reuses existing login/card/button patterns and must expose loading, validation, auth, and authorization states with accessible form controls.
- **Performance**: PASS. Signed-token claim validation avoids per-request account queries; existing pagination remains bounded, and any schema/index work will be explicit.
- **Simplicity**: PASS. One shared login endpoint, one reusable guard, and a focused authenticated API helper are sufficient; no new identity service is introduced.

## Phase 0 Research Summary

Research is recorded in [research.md](research.md). Key resolved decisions:

1. Reuse `POST /auth/login` with `role: admin`; keep public signup restricted to student and parent.
2. Use a reusable Nest role guard and return token claims including `sub` and `role`.
3. Derive `createdBy` and `changedBy` from verified claims.
4. Add the missing curriculum and question-bank schema tables before persistence is treated as runnable.
5. Use a compiled backend CLI (`npm run admin:provision`) for controlled admin creation.
6. Add an authenticated admin fetch/session layer and Playwright coverage for the real question authoring form.

## Project Structure

### Documentation

```text
specs/002-student-os-platform/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api-v1.md
```

### Source Code

```text
backend/
├── database/
│   └── schema.sql
└── src/
    ├── app.module.ts
    ├── auth.controller.ts
    ├── auth.module.ts
    ├── auth.service.ts
    ├── auth.service.spec.ts
    ├── questions.controller.ts
    ├── questions.module.ts
    ├── questions.service.ts
    ├── questions.service.spec.ts
    └── [admin auth guard and controller/integration tests]

apps/admin/
└── src/
    ├── App.tsx
    ├── login/LoginPage.tsx
    ├── login/LoginPage.css
    ├── styles.css
    └── [admin session and question-authoring UI helpers/components]
```

**Structure Decision**: Extend the existing backend Nest modules and database schema, and the existing `apps/admin` React entry point. Small auth helpers and authoring components may be extracted only where they reduce duplication in the current single-file dashboard.

## Phase 1 Design Notes

- The data model and lifecycle are documented in [data-model.md](data-model.md).
- The endpoint, authorization, error, and client-session contract is documented in [contracts/api-v1.md](contracts/api-v1.md).
- Runnable setup and validation scenarios are documented in [quickstart.md](quickstart.md).
- The existing `AuthModule` and `QuestionsModule` must be imported by `AppModule`; this is a prerequisite for HTTP-level validation.
- The schema is a blocking implementation task: `CurriculumService` names the curriculum tables, but the checked-in schema currently declares none of them. The implementation must add `curriculum_boards`, `curriculum_classes`, `curriculum_subjects`, `curriculum_class_subjects`, `curriculum_topics`, `curriculum_subtopics`, `curriculum_learning_objectives`, `curriculum_syllabus`, `question_bank_questions`, and `question_bank_versions` with their documented relationships.

## Complexity Tracking

No constitution violations. The schema reconciliation and guard are required to satisfy existing service boundaries and the security requirements, not exceptions to the constitution.
