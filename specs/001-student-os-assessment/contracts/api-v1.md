# API Contract: Student OS v1

## Base Information

- Base path: `/api/v1`
- Authentication: JWT bearer token
- Request format: JSON
- Response format: JSON
- Error format:
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "A human-readable explanation",
      "details": []
    }
  }
  ```

## 1. Authentication

### POST /api/v1/auth/login

Request body:
```json
{
  "email": "student@example.com",
  "password": "secure-password"
}
```

Success response:
```json
{
  "user": {
    "id": "uuid",
    "role": "STUDENT",
    "name": "Aarav Sharma"
  },
  "token": "jwt-token"
}
```

## 2. Student Profile

### GET /api/v1/students/me

Response:
```json
{
  "id": "uuid",
  "schoolId": "uuid",
  "classId": "uuid",
  "stage": "MIDDLE",
  "profile": {
    "strengths": ["Problem Solving", "Self Management"],
    "supportNeeds": ["Reading Fluency"]
  }
}
```

## 3. Assessment Lifecycle

### GET /api/v1/assessments

Query parameters:
- `stage` (optional)
- `domain` (optional)
- `classId` (optional)

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Stage 7 Growth Assessment",
      "stage": "MIDDLE",
      "domainMix": ["ACADEMIC", "FUTURE_SKILLS"],
      "status": "ACTIVE"
    }
  ]
}
```

### POST /api/v1/assessment-attempts

Request body:
```json
{
  "studentId": "uuid",
  "assessmentId": "uuid",
  "sessionMetadata": {
    "deviceType": "mobile",
    "language": "en"
  }
}
```

Success response:
```json
{
  "id": "uuid",
  "status": "IN_PROGRESS",
  "startedAt": "2026-08-18T10:00:00Z"
}
```

### POST /api/v1/assessment-attempts/{attemptId}/responses

Request body:
```json
{
  "itemId": "uuid",
  "answer": {
    "selectedOption": "B"
  },
  "isSkipped": false,
  "qualityFlags": []
}
```

Success response:
```json
{
  "id": "uuid",
  "attemptId": "uuid",
  "evaluationStatus": "PENDING"
}
```

### POST /api/v1/assessment-attempts/{attemptId}/complete

Request body:
```json
{
  "finalized": true,
  "notes": "Student completed the assessment session"
}
```

Success response:
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "scoreSummary": {
    "totalCompetencies": 3,
    "observedDomains": ["ACADEMIC", "FUTURE_SKILLS", "LEARNING_DISPOSITION"]
  }
}
```

## 4. Reporting and Growth

### GET /api/v1/students/me/growth

Response:
```json
{
  "studentId": "uuid",
  "currentAssessmentDate": "2026-08-18",
  "compareAgainst": "2026-06-15",
  "summary": {
    "improvedDomains": ["Problem Solving"],
    "supportNeeds": ["Reading Comprehension"],
    "strongestDomain": "Language & Communication"
  },
  "trend": [
    {
      "date": "2026-06-15",
      "scores": { "language": 72, "problemSolving": 68 }
    },
    {
      "date": "2026-08-18",
      "scores": { "language": 80, "problemSolving": 76 }
    }
  ]
}
```

### GET /api/v1/students/me/recommendations

Response:
```json
{
  "recommendations": [
    {
      "id": "uuid",
      "competencyId": "uuid",
      "type": "PRACTICE",
      "title": "Reading practice",
      "summary": "Use short guided reading tasks to improve comprehension and confidence.",
      "priority": "HIGH"
    }
  ]
}
```

## 5. Error Handling

Common status codes:
- `200` OK
- `201` Created
- `400` Validation error
- `401` Unauthorized
- `403` Forbidden
- `404` Resource not found
- `409` Duplicate or conflicting state
- `422` Evaluation quality validation failure
- `500` Internal server error

## 6. Contract Notes

- Parent and educator views must read from the same underlying score and evidence records; the system should vary only by role-based access and presentation.
- The score engine must expose version metadata to ensure explainability and historical traceability.
- Growth comparison endpoints must never present raw numbers without contextual interpretation or developmental guidance.
