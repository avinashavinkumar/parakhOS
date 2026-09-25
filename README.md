# Student OS

Student OS is a competency-based assessment platform for Classes III-XII. This repository currently contains the first runnable backend vertical slice for stage-aware assessment, explainable results, and growth reporting.

## Repository

- `backend/`: NestJS API with an in-memory domain store for the initial slice
- `apps/mobile/student-os-app/`: reserved for the Flutter client
- `specs/001-student-os-assessment/`: product specification, model, contracts, and implementation tasks

## Run the API

```powershell
Set-Location backend
npm install
npm run start:dev
```

The API listens on `http://localhost:3000`.

## Run with Hostinger PostgreSQL

The Hostinger SSH tunnel settings are stored in `backend/.env`. Start the tunnel, backend, and admin app together with:

```powershell
Set-Location backend
npm run start:hostinger
```

The first run may prompt for the SSH password. For automatic restarts, configure an SSH key and set `SSH_KEY_PATH` in `backend/.env`. Keep the SSH tunnel running while the backend is in use.

The backend connects to PostgreSQL at `jdbc:postgresql://127.0.0.1:5432/studentos` from `.env.example`. The application removes the `jdbc:` prefix for the Node PostgreSQL driver and initializes the schema in `backend/database/schema.sql` on startup. Set `DB_ENABLED=false` only when running without PostgreSQL.

Useful endpoints:

- `GET /api/v1/students/me`
- `GET /api/v1/assessments`
- `POST /api/v1/assessment-attempts`
- `POST /api/v1/assessment-attempts/:attemptId/responses`
- `POST /api/v1/assessment-attempts/:attemptId/complete`
- `GET /api/v1/students/me/growth`
- `GET /api/v1/students/me/recommendations`

For the demo student, use `student-demo` and the assessment `assessment-middle-demo`. Response scores are supplied as `{ "score": 0-100 }` in this first slice.

## Validate

```powershell
Set-Location backend
npm test
npm run build
```

The current implementation intentionally uses in-memory storage. PostgreSQL, authentication, durable assessment repositories, AI evidence extraction, and the Flutter app are tracked in [tasks.md](specs/001-student-os-assessment/tasks.md).
