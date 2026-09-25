# API Contract: Curriculum & Question Bank v1

## Base Information

- Base path: `/api/v1`
- Authentication: JWT bearer token
- Request format: JSON (or multipart/form-data for file uploads)
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

---

## 1. Curriculum Endpoints

### GET /api/v1/curriculum/boards

List all active curriculum boards.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "CBSE",
      "code": "cbse",
      "country": "India"
    },
    {
      "id": "uuid",
      "name": "ICSE",
      "code": "icse",
      "country": "India"
    }
  ]
}
```

---

### GET /api/v1/curriculum/boards/{boardId}/classes

List all classes for a given board.

Query parameters:
- `stage` (optional): PREPARATORY, MIDDLE, SECONDARY

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "boardId": "uuid",
      "gradeBand": "V",
      "stage": "MIDDLE",
      "name": "Class V",
      "level": 3
    }
  ]
}
```

---

### GET /api/v1/curriculum/classes/{classId}/subjects

List all subjects for a given class.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "MATH",
      "name": "Mathematics",
      "description": "Foundational math concepts"
    },
    {
      "id": "uuid",
      "code": "ENG",
      "name": "English",
      "description": "Language and literature"
    }
  ]
}
```

---

### GET /api/v1/curriculum/subjects/{subjectId}/topics

List all topics for a given subject.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "whole_numbers",
      "name": "Whole Numbers",
      "description": "Introduction to whole numbers and basic operations"
    }
  ]
}
```

---

### GET /api/v1/curriculum/topics/{topicId}/subtopics

List all subtopics for a given topic.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "addition_carry",
      "name": "Addition with Carry-Over",
      "description": "Multi-digit addition with carry"
    }
  ]
}
```

---

### GET /api/v1/curriculum/topics/{topicId}/learning-objectives

List all learning objectives for a given topic.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "bloomLevel": "APPLY",
      "objective": "Students will be able to add multi-digit numbers with carry-over",
      "description": "..."
    }
  ]
}
```

---

### POST /api/v1/admin/curriculum/import

Admin endpoint to import curriculum structure from CSV/JSON file.

Request (multipart/form-data):
```
- file: CSV or JSON file
- boardCode: "cbse" or "icse"
- mergeStrategy: "KEEP_OLD" | "REPLACE" | "VERSION"
```

Response:
```json
{
  "importId": "uuid",
  "status": "PENDING",
  "fileName": "ncert-cbse-curriculum.csv",
  "totalRows": 145,
  "createdAt": "2026-08-20T10:00:00Z"
}
```

Get import status:
```
GET /api/v1/admin/curriculum/imports/{importId}
```

Response:
```json
{
  "importId": "uuid",
  "status": "COMPLETED",
  "totalRows": 145,
  "successCount": 145,
  "failureCount": 0,
  "classesCreated": 10,
  "subjectsCreated": 35,
  "topicsCreated": 145,
  "completedAt": "2026-08-20T10:05:30Z",
  "errors": []
}
```

---

## 2. Question Bank Endpoints

### POST /api/v1/questions

Create a new question.

Request body:
```json
{
  "competencyId": "uuid",
  "classId": "uuid",
  "subjectId": "uuid",
  "topicId": "uuid",
  "subTopicId": "uuid | null",
  "learningObjectiveId": "uuid | null",
  "itemType": "MCQ",
  "prompt": "What is 5 + 7?",
  "difficulty": "EASY",
  "estimatedTimeSeconds": 30,
  "options": [
    { "key": "A", "text": "10" },
    { "key": "B", "text": "12" },
    { "key": "C", "text": "13" },
    { "key": "D", "text": "14" }
  ],
  "correctAnswerKey": "B",
  "rubric": {
    "points": 1,
    "criteria": [
      {
        "description": "Correct answer",
        "points": 1
      }
    ]
  },
  "expectedEvidence": {
    "selectedCorrectOption": true
  }
}
```

Success response:
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "createdAt": "2026-08-20T10:00:00Z"
}
```

---

### GET /api/v1/questions

List or search questions.

Query parameters:
- `classId` (optional)
- `subjectId` (optional)
- `topicId` (optional)
- `competencyId` (optional)
- `difficulty` (optional): EASY, MEDIUM, HARD
- `status` (optional): DRAFT, ACTIVE, ARCHIVED, FLAGGED
- `provenance` (optional): MANUALLY_CREATED, BULK_IMPORTED, AI_ASSISTED, AI_GENERATED
- `search` (optional): keyword search on prompt
- `limit` (optional): default 20, max 100
- `offset` (optional): default 0

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "prompt": "What is 5 + 7?",
      "itemType": "MCQ",
      "difficulty": "EASY",
      "status": "ACTIVE",
      "provenance": "MANUALLY_CREATED",
      "createdBy": "uuid",
      "createdAt": "2026-08-20T10:00:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

### GET /api/v1/questions/{questionId}

Get a single question with full details.

Response:
```json
{
  "id": "uuid",
  "competencyId": "uuid",
  "classId": "uuid",
  "subjectId": "uuid",
  "topicId": "uuid",
  "itemType": "MCQ",
  "prompt": "What is 5 + 7?",
  "difficulty": "EASY",
  "options": [...],
  "correctAnswerKey": "B",
  "rubric": {...},
  "expectedEvidence": {...},
  "status": "ACTIVE",
  "provenance": "MANUALLY_CREATED",
  "createdBy": "uuid",
  "reviewedBy": "uuid | null",
  "approvedAt": "2026-08-20T10:05:00Z",
  "createdAt": "2026-08-20T10:00:00Z",
  "updatedAt": "2026-08-20T10:05:00Z"
}
```

---

### PUT /api/v1/questions/{questionId}

Edit an existing question (creates a new version).

Request body: (same as POST)

Response:
```json
{
  "id": "uuid",
  "versionNumber": 2,
  "status": "DRAFT",
  "updatedAt": "2026-08-20T10:10:00Z"
}
```

---

### GET /api/v1/questions/{questionId}/versions

Get version history of a question.

Response:
```json
{
  "items": [
    {
      "versionNumber": 1,
      "prompt": "What is 5 + 7?",
      "changedBy": "uuid",
      "changeReason": "Initial creation",
      "createdAt": "2026-08-20T10:00:00Z"
    },
    {
      "versionNumber": 2,
      "prompt": "What is the sum of 5 and 7?",
      "changedBy": "uuid",
      "changeReason": "Improved clarity",
      "createdAt": "2026-08-20T10:10:00Z"
    }
  ]
}
```

---

### PUT /api/v1/questions/{questionId}/approve

Approve a question (change status from DRAFT to ACTIVE).

Request body:
```json
{
  "reviewNotes": "Question is clear and well-aligned to learning objective"
}
```

Response:
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "approvedAt": "2026-08-20T10:15:00Z",
  "reviewedBy": "uuid"
}
```

---

### PUT /api/v1/questions/{questionId}/archive

Archive a question (change status to ARCHIVED).

Response:
```json
{
  "id": "uuid",
  "status": "ARCHIVED"
}
```

---

## 3. Bulk Question Import

### POST /api/v1/admin/questions/bulk-import

Bulk import questions from CSV file.

Request (multipart/form-data):
```
- file: CSV file with columns:
  - prompt (required)
  - itemType (required): MCQ, SHORT_ANSWER, REFLECTION, SCENARIO, CONVERSATION, PERFORMANCE
  - classId or className (required)
  - subjectId or subjectName (required)
  - topicId or topicName (required)
  - subTopicId or subTopicName (optional)
  - competencyId or competencyName (required)
  - difficulty (optional): EASY, MEDIUM, HARD (default MEDIUM)
  - options (required for MCQ): pipe-separated, e.g., "A|Option text|10|B|Option text 2|20"
  - correctAnswerKey (required): A, B, C, D, etc.
  - rubric (optional): JSON or reference to template
  - estimatedTimeSeconds (optional)
```

Response (immediate):
```json
{
  "importId": "uuid",
  "status": "PENDING",
  "fileName": "questions-batch-001.csv",
  "totalRows": 250,
  "createdAt": "2026-08-20T10:00:00Z"
}
```

Get import status:
```
GET /api/v1/admin/questions/bulk-imports/{importId}
```

Response (during processing):
```json
{
  "importId": "uuid",
  "status": "IN_PROGRESS",
  "totalRows": 250,
  "processedRows": 150,
  "successCount": 148,
  "failureCount": 2,
  "progressPercent": 60
}
```

Response (after completion):
```json
{
  "importId": "uuid",
  "status": "SUCCESS",
  "totalRows": 250,
  "successCount": 248,
  "failureCount": 2,
  "questionsCreated": 248,
  "completedAt": "2026-08-20T10:05:30Z",
  "errorReport": [
    {
      "rowNumber": 45,
      "error": "Invalid itemType: MCQMultiple",
      "questionData": {...}
    },
    {
      "rowNumber": 127,
      "error": "Competency not found: UNKNOWN_COMPETENCY",
      "questionData": {...}
    }
  ]
}
```

---

## 4. Question Bank Management

### POST /api/v1/question-banks

Create a new question bank.

Request body:
```json
{
  "name": "Class V Mathematics Bank",
  "description": "MCQ and short-answer questions for Class V math",
  "isPublic": false
}
```

Response:
```json
{
  "id": "uuid",
  "name": "Class V Mathematics Bank",
  "isPublic": false,
  "owner": "uuid",
  "createdAt": "2026-08-20T10:00:00Z"
}
```

---

### POST /api/v1/question-banks/{bankId}/questions/{questionId}

Add a question to a question bank.

Response:
```json
{
  "success": true,
  "message": "Question added to bank"
}
```

---

## 5. Error Handling

Common status codes:
- `200` OK
- `201` Created
- `400` Validation error (e.g., missing required field, invalid enum)
- `401` Unauthorized
- `403` Forbidden (e.g., cannot delete in-use question)
- `404` Resource not found
- `409` Duplicate (e.g., question already exists)
- `422` Import validation failure (detailed errors provided)
- `500` Internal server error

---

## 6. Contract Notes

- Curriculum data is immutable after import; old versions are archived, not overwritten
- Questions cannot be deleted if they are in use by live assessments; they must be archived
- All question edits create new version records; the original version is never modified
- Bulk import is asynchronous; clients must poll the importId to track progress
- AI-generated questions must be reviewed and approved before entering ACTIVE status
- All changes are logged with user ID and timestamp for full auditability
- Question search is case-insensitive and supports fuzzy matching on prompt text
- Curriculum queries are cacheable (recommend client-side caching with 1-hour TTL)
