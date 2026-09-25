# Quickstart: Admin Question Authoring Access

## Prerequisites

- Node.js and npm installed.
- PostgreSQL running for persistence.
- Backend dependencies installed in `backend/`.
- Admin dependencies installed in `apps/admin/`.
- PostgreSQL is reachable through `DATABASE_URL`.

## Start the backend

```powershell
Set-Location backend
npm install
npm run start:dev
```

The API runs at `http://localhost:3000`.

## Provision an admin

Build the backend CLI and provision an active admin from environment variables. The command never creates admins through public signup.

```powershell
Set-Location backend
$env:ADMIN_EMAIL = 'admin@example.com'
$env:ADMIN_PASSWORD = 'replace-with-a-local-secret'
npm run admin:provision
```

## Start the admin app

```powershell
Set-Location apps/admin
npm install
npm run dev
```

Open the Vite URL and use `/admin/login`.

## Validate the API flow

1. Sign in with the provisioned admin using `POST /api/v1/auth/login` and `role: admin`.
2. Confirm the response contains a bearer token with an admin user role.
3. Create a question with `POST /api/v1/questions` using the bearer token and the request shape in [api-v1.md](contracts/api-v1.md).
4. Confirm the response is a draft and its `createdBy` matches the authenticated admin, not a client-supplied actor.
5. Update the question and confirm a prior version records the authenticated admin as `changedBy`.
6. Approve or archive the question and confirm the state transition.
7. Repeat create/update/approve/archive without a token and with a student token; expect `401` and `403` respectively.
8. Submit invalid question data and confirm `400` with no database mutation.

## Automated validation

```powershell
Set-Location backend
npm test
npm run build

Set-Location ..\apps\admin
npm run build
npm run test:e2e
```

The focused tests must cover admin login, public-signup rejection, token validation, role authorization, creator attribution, question validation, the existing student/parent auth flows, and the admin browser login/authoring journey.
