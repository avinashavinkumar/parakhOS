# Login Module

## Scope

Login is a separate authentication module for Student and Parent users. It is distinct from assessment selection, question generation, profile completion, and reporting.

## User Flow

1. User opens `/login`.
2. User selects `Student` or `Parent`.
3. User signs in with email/phone and password through `POST /api/v1/auth/login`.
4. Backend returns a signed, one-hour JWT access token.
5. Student users without a `students` profile are routed to `/student-profile`.
6. Parent users are routed to `/parent`.
7. Google login starts at `GET /api/v1/auth/google?role=student|parent` and returns to the frontend after the OAuth callback.

First-time users can switch to **Sign up** on the same login module. `POST /api/v1/auth/signup` creates a Student or Parent account. New students are routed to profile completion before accessing assessments; new parents are routed to the parent space.

## Password Login Contract

Request:

```json
{
  "identifier": "email-or-phone",
  "password": "password",
  "role": "student"
}
```

Response:

```json
{
  "accessToken": "header.payload.signature",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "needsProfile": true,
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "role": "student"
  }
}
```

## Google OAuth Configuration

The backend requires:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FRONTEND_URL`
- `JWT_SECRET`

When Google settings are missing, the login module redirects to `/login#auth_error=google_not_configured`, where the UI displays an actionable message instead of a raw API error.

## Security Rules

- Passwords are stored as scrypt hashes and are never returned to clients.
- JWT signing requires `JWT_SECRET` in production.
- Google identity is accepted only after Google token verification reports a verified email.
- Existing protected endpoints and parent consent/relationship guards remain follow-up work under task `T011`.

## Implementation Locations

- Backend module: `backend/src/auth.module.ts`
- Backend service: `backend/src/auth.service.ts`
- Backend controller: `backend/src/auth.controller.ts`
- Frontend login page: `apps/admin/src/App.tsx`
- Frontend login styles: `apps/admin/src/login.css`
