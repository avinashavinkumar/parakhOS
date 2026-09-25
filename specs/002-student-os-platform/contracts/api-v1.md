# API Contract: Admin Question Authoring

Base path: `/api/v1`

## Admin login

`POST /auth/login`

Request:

```json
{
  "identifier": "admin@example.com",
  "password": "secret",
  "role": "admin"
}
```

Success `200`:

```json
{
  "accessToken": "<signed-token>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": { "id": "<uuid>", "email": "admin@example.com", "role": "admin" }
}
```

The existing public signup endpoint MUST reject `role: admin`.

Failure statuses:

- `400` for missing fields or unsupported role.
- `401` for missing, inactive, or invalid credentials.

## Protected question mutations

All endpoints below require:

```http
Authorization: Bearer <admin-access-token>
Content-Type: application/json
```

- `POST /questions` creates a draft question.
- `PUT /questions/:questionId` updates a question and snapshots its previous version.
- `PUT /questions/:questionId/approve` transitions a question to `ACTIVE`.
- `PUT /questions/:questionId/archive` transitions a question to `ARCHIVED`.
- Any question-import mutation MUST use the same admin authorization policy.

Unauthenticated or invalid-token requests return `401`. Valid student or parent tokens return `403`.

## Create question request

```json
{
  "classId": "<uuid>",
  "subjectId": "<uuid>",
  "topicId": "<uuid>",
  "subtopicId": "<uuid>",
  "learningObjectiveId": "<uuid>",
  "competencyId": "<uuid>",
  "itemType": "MCQ",
  "prompt": "Which value is greatest?",
  "difficulty": "EASY",
  "estimatedTimeSeconds": 60,
  "options": [{ "key": "A", "text": "12" }, { "key": "B", "text": "21" }],
  "correctAnswerKey": "B",
  "rubric": null,
  "expectedEvidence": null,
  "provenance": "MANUALLY_CREATED"
}
```

`createdBy` is intentionally absent. The server derives it from the admin token subject.

Success `201`: persisted question representation including `id`, `status`, `createdBy`, and timestamps.

Validation failure `400`: stable message describing the invalid field; no question is written.

## Update question request

`PUT /questions/:questionId`

Accepts editable question fields plus optional `changeReason`. `changedBy` is intentionally absent and is derived from the token.

Success `200`: updated question representation.

Not found `404`: question does not exist.

## Client session behavior

The admin web client stores the returned access token for the current browser session, attaches it to protected requests, clears it on logout, and returns to `/admin/login` after a `401`. It displays `403` as an authorization error and `400` as field or form validation feedback.
