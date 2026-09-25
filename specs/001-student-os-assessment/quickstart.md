# Quickstart Validation Guide

## Purpose

This guide provides the minimum validation flow needed to confirm that Student OS can deliver a complete assessment and growth-reporting experience for a student and parent.

## Prerequisites

- Node.js 20 LTS
- Docker Desktop or equivalent container runtime
- PostgreSQL 15+
- Redis 7+
- Flutter SDK 3.x for mobile client testing
- Optional: S3-compatible storage for media or generated PDF outputs

## Local Setup

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the local data stack:
   ```bash
   docker compose up -d postgres redis
   ```
3. Configure environment variables for the application and database:
   ```bash
   cp .env.example .env
   ```
4. Run database migrations and seed the competency repository:
   ```bash
   npm run prisma:migrate
   npm run seed:competencies
   ```
5. Install and run the mobile app in debug mode:
   ```bash
   cd apps/mobile/student-os-app
   flutter pub get
   flutter run
   ```

## Validation Scenarios

### 1. Student assessment flow

- Log in as a valid student user assigned to a class and school.
- Navigate to the assessment dashboard.
- Start a class-appropriate assessment.
- Complete the assessment session with mixed task types.

Expected outcome:
- The system selects the correct stage-specific competency model.
- The assessment is persisted with a valid attempt record.
- The student receives a competency summary explaining strengths and improvement areas.

### 2. Growth comparison flow

- Complete a second assessment after a prior attempt exists.
- Open the growth report from the parent or student dashboard.

Expected outcome:
- Current scores are compared against prior scores.
- Improvement and support needs are shown as positive developmental insight rather than punitive labels.
- The report clearly identifies strong and weak domains.

### 3. Educator repository review

- Open the assessment repository or blueprint metadata.
- Review a competency, item metadata, rubric, and evidence dimensions.

Expected outcome:
- Teachers can see the learning objective and expected evidence.
- Class-appropriate expectations are visible across preparatory, middle, and secondary stages.

### 4. Explainability and fairness checks

- Inspect a completed score summary.
- Open the explanation panel for a competency result.

Expected outcome:
- The summaries connect evidence to competency dimensions.
- Low-confidence or insufficient-evidence cases are handled with a transparent status rather than a misleading numeric result.

## Exit Criteria

The feature is considered validated when all four scenarios complete successfully and the system produces:
- a completed assessment result,
- a score explanation for each competency,
- a growth comparison when prior data exists,
- a parent-facing growth report with support guidance and recommended actions.

## Related Design Artifacts

- [spec.md](spec.md)
- [research.md](research.md)
- [data-model.md](data-model.md)
- [contracts/api-v1.md](contracts/api-v1.md)
