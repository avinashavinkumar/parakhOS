# Implementation Plan: Student OS Assessment & Growth Framework

**Branch**: `001-student-os-assessment` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-student-os-assessment/spec.md`

## Summary

Student OS will be implemented as a domain-first assessment platform combining a Flutter mobile application with a robust NestJS backend, PostgreSQL data layer, Redis cache/job queue, and S3-compatible object storage. The core product requirement is to assess students holistically across academic, future-skills, and learning dispositions domains while producing explainable, growth-oriented reports. The architecture separates AI evidence generation from the official scoring engine so that all competency judgments remain reproducible, auditable, and explainable.

## Technical Context

**Language/Version**: TypeScript 5.x for backend, Dart 3.x for Flutter mobile app, Node.js 20 LTS runtime

**Primary Dependencies**: NestJS, PostgreSQL, Redis, BullMQ, Prisma or TypeORM, S3-compatible storage, Flutter SDK, JWT auth, validation libraries, Prometheus/Grafana for observability

**Storage**: PostgreSQL as primary relational store; Redis for sessions, rate limiting, job queues, and cached data; S3-compatible object storage for voice, images, PDFs, and generated media files

**Testing**: Jest with Supertest for backend unit and integration tests; Flutter test for mobile UI logic; contract tests for API payloads; targeted regression tests around scoring and growth reporting

**Target Platform**: Android, iOS, and tablet-first mobile app; REST API backend deployed on a managed container platform; web admin/reporting layer to follow after core MVP

**Project Type**: Mobile app + API service with domain-driven backend modules

**Performance Goals**: Assessment response and reporting API p95 under 300 ms for standard reads; assessment scoring pipeline completes asynchronously within a few seconds for typical sessions; no blocking UI waits for AI processing on mobile; support scale for multiple schools with 15k+ item repository and concurrent assessment sessions

**Constraints**: Child-data privacy and compliance requirements; age-appropriate, explainable scoring; no direct AI final scoring authority; all score changes must remain versioned and auditable; very small latency tolerance for student-facing assessment states

**Scale/Scope**: Initial MVP covers Classes III–XII across the three domains, with 1,000–1,500 items per competency target and multi-school deployment readiness; product should support 3-stage benchmark logic: preparatory, middle, and secondary

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pass. The chosen architecture complies with the project constitution in the following ways:

- Code Quality Is Non-Negotiable: the modular NestJS monolith and domain-oriented entity model keep responsibilities explicit and maintainable.
- Test-First Validation Is Mandatory: backend and scoring logic will be validated with unit, integration, and regression tests before production release; user-facing flows will have acceptance tests.
- User Experience Must Be Consistent and Accessible: Flutter shared patterns, stage-appropriate reports, and accessible evaluation design will be enforced through common UI components and report templates.
- Performance Is a Product Requirement: the design isolates async AI processing, uses Redis for queues and caching, and keeps score computation separate from AI inference to maintain responsiveness.
- Simplicity and Maintainability Win Over Cleverness: the team is intentionally using a clear domain model and modular backend rather than screen-centric or ad hoc database structures.

No constitution violations or unjustified exceptions need to be recorded.

## Project Structure

### Documentation (this feature)

```text
specs/001-student-os-assessment/
├── plan.md              # This file
├── research.md          # Phase 0 design decisions
├── data-model.md        # Domain and persistence model
├── quickstart.md        # Validation and local setup guide
├── contracts/
│   └── api-v1.md        # API contract for backend integration
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 implementation backlog (future)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.module.ts
│   ├── common/
│   ├── auth/
│   ├── users/
│   ├── students/
│   ├── schools/
│   ├── domains/
│   ├── competencies/
│   ├── assessments/
│   ├── assessment-attempts/
│   ├── assessment-items/
│   ├── scoring/
│   ├── evidence/
│   ├── growth/
│   ├── practice/
│   ├── recommendations/
│   ├── parents/
│   ├── ai/
│   ├── storage/
│   ├── audit/
│   └── main.ts
├── test/
│   ├── contract/
│   ├── integration/
│   └── unit/
├── package.json
├── nest-cli.json
├── tsconfig.json
└── docker-compose.yml

apps/
├── mobile/
│   └── student-os-app/
│       ├── lib/
│       ├── test/
│       └── pubspec.yaml
└── admin/
    └── [future reporting tooling]

infra/
├── docker/
├── helm/
├── env/
└── monitoring/
```

**Structure Decision**: Use a modular backend service with a separate mobile app project. Data domain and API layers are organized around Student OS entities rather than page-based screens, which matches the product model and the architecture recommendation.

## Complexity Tracking

No constitution violations requiring exceptions were identified.

---

## Phase 0: Research and Decision Log

The following findings resolve the technical unknowns and align the architecture to the product objectives.

### Research Findings

1. Domain-first design is required and must precede screen-level modeling.
   - Decision: Database tables and services will be built around domains, competencies, assessments, evidence, scoring, growth, and recommendations.
   - Rationale: This matches the NEP 2020 competency model and prevents UI-centric design from creating brittle data structures.
   - Alternatives considered: page-oriented schema design and ad hoc dashboard tables; rejected because they do not support consistent longitudinal analysis.

2. The product needs a modular backend with explicit service boundaries.
   - Decision: NestJS with TypeScript will be used for the primary backend application.
   - Rationale: It provides strong structure, dependency injection, validation, module separation, and future readiness for multi-service growth.
   - Alternatives considered: Express-only Node.js and a single-file service layer; rejected because the product requires clearer domain separation and maintainability.

3. AI must not be the official scoring authority.
   - Decision: AI generates evidence and recommendations; the Scoring Engine owns the final competency score.
   - Rationale: This preserves explainability, auditability, and reproducibility for educational judgments.
   - Alternatives considered: AI-direct scoring and deterministic model-only scoring; rejected because both reduce transparency and create unacceptable risk for student assessment decisions.

4. Assessment metadata and historical score integrity are required.
   - Decision: Versioned assessments and immutable score history will be implemented from the start.
   - Rationale: This allows historical comparisons and prevents score drift when assessment definitions change.
   - Alternatives considered: overwriting assessment versions and updating live records in place; rejected because it makes longitudinal growth reporting unreliable.

5. Student data privacy must be embedded in the system design.
   - Decision: Authentication, role-based access control, consent management, audit logging, and limiting AI payload exposure will be first-class requirements.
   - Rationale: Student OS handles minors and sensitive educational data; privacy must be built into architecture from V1.
   - Alternatives considered: treating security as a later enhancement; rejected because it creates avoidable governance risk.

---

## Phase 1: Design Artifacts

### Domain Model Summary

The data model will center on the following key entities:

- User, Student, Parent, School, Class, Academic Year
- Domain, Competency, Sub-Competency
- Assessment, Assessment Version, Assessment Item, Assessment Attempt, Response, Evidence
- Scoring Model, Score, Competency Score History
- Practice Activity, Practice Attempt
- Recommendation, Achievement, Streak, Notification, Consent, Audit Log

Core relationships:

- Student belongs to School and Class
- Assessment belongs to Domain and Competency
- Assessment Version belongs to Assessment
- Assessment Attempt belongs to Student and Assessment Version
- Response belongs to Attempt and Assessment Item
- Evidence belongs to Attempt and Competency
- Score and Score History are computed from evidence and versioned scoring
- Growth and recommendations are derived from historical score trends

### API Contract Scope

The contract will include secure REST endpoints for authorization, student profile, assessment sessions, scoring, growth, practice, and recommendations. The most critical endpoints are:

- `GET /api/v1/students/me`
- `GET /api/v1/students/me/growth`
- `GET /api/v1/students/me/recommendations`
- `GET /api/v1/assessments`
- `POST /api/v1/assessment-attempts`
- `POST /api/v1/assessment-attempts/{id}/responses`
- `POST /api/v1/assessment-attempts/{id}/complete`
- `GET /api/v1/practice/recommended`

### Performance and Quality Guards

- Use async job processing for AI feature extraction and recommendation generation.
- Keep score computation centralized in the scoring engine and separate from evidence extraction.
- Use Redis caching only for high-read workloads; do not use Redis as the source of record.
- Version all published assessments and score models.
- Require regression tests for any scoring formula or growth-reporting change.

---

## Planned Delivery Milestones

### Milestone 1: Foundation and Identity
- User, student, parent, and school identity models
- Authentication and authorization
- Class-level benchmarks and domain/competency definitions
- Basic database schema and migration system

### Milestone 2: Assessment Engine
- Assessment definitions, versions, and item repository
- Attempt tracking and response persistence
- Student assessment session flow and completion states

### Milestone 3: Scoring and Growth
- Evidence extraction and scoring model execution
- Competency scores and score history
- Growth comparisons and explainable report generation

### Milestone 4: Practice and Recommendations
- Practice activities and attempts
- Recommendations based on rule engine and AI output
- Parent and student dashboard readiness

### Milestone 5: AI and Ops Readiness
- AI gateway for transcription, recommendation, and evidence extraction
- Audit logging, monitoring, and deployment infrastructure
- Privacy, rate limiting, and operational observability

## Constitution Re-check

After design: Pass. The architecture remains consistent with the constitution because it prioritizes actor separation, domain clarity, testability, explainability, and performance-sensitive async design.

## Complexity Tracking

No additional complexity justifications required.
