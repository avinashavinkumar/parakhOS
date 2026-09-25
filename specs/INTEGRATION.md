# Curriculum & Question Bank ↔ Assessment Feature Integration

**Date**: 2026-08-20 | **Version**: 1.0

## Overview

The Student OS platform has two interdependent features:

1. **001-student-os-assessment** (Existing): Student assessment, scoring, growth reporting
2. **002-curriculum-question-bank** (New): Curriculum management, question bank, bulk import

This document describes how they work together to form a complete assessment platform.

---

## Dependency Model

```
┌─────────────────────────────────────────┐
│   Assessment Feature (001)               │
│  - Student profiles                      │
│  - Assessment sessions                   │
│  - Scoring & growth                      │
│  - Reporting                             │
└──────────────────┬──────────────────────┘
                   │ depends on
                   ▼
┌─────────────────────────────────────────┐
│   Curriculum & Question Bank (002)       │
│  - Curriculum hierarchy                  │
│  - Question bank (CRUD)                  │
│  - Bulk import & versioning              │
│  - Question search & filtering           │
└─────────────────────────────────────────┘
```

### Implementation Sequence

**Phase 1 (001 MVP)**: Assessment feature with in-memory/demo question data
**Phase 1.5 (002 MVP)**: Curriculum and question bank feature adds persistent storage
**Phase 2 (001 Extension)**: Assessment feature switches to real curriculum and questions
**Phase 2+ (001 & 002 Enhancement)**: AI-assisted question generation, advanced analytics

---

## Data Model Integration

### Assessment Uses Curriculum Context

**Before (001 MVP)**:
```
Assessment → AssessmentItem → Question (in-memory demo data)
```

**After (002 MVP)**:
```
Assessment → AssessmentItem → Question (from database via 002)
           ↓
       filtered by classId, subjectId, topicId
           ↓
       linked to Competency and LearningObjective
```

### Example Query Flow

1. **Student logs in**: System identifies class level (PREPARATORY, MIDDLE, or SECONDARY)
2. **Student selects assessment**: Calls `GET /api/v1/assessments?stage=MIDDLE&domain=ACADEMIC`
3. **System retrieves Assessment** (from 001): Contains blueprint specifying which topics to include
4. **System retrieves Questions** (from 002): Queries `GET /api/v1/questions?classId=X&topicId=Y&status=ACTIVE`
5. **Questions are served**: Student answers; responses stored in AssessmentAttempt
6. **Scoring engine runs** (from 001): Evaluates responses using rubrics from Question entity
7. **Growth report generated** (from 001): Includes curriculum context from Topic/Subject entities (from 002)

---

## Key Entities Interaction

### Student Assessment Lifecycle with Curriculum Context

```
┌──────────────────────────────────────────────────────────────────┐
│ Student Initiates Assessment                                      │
│ ┌─ Curriculum (002)                                               │
│ │  ├─ Get Class V, Subject: Mathematics                          │
│ │  ├─ Get Topic: Whole Numbers                                   │
│ │  └─ Get SubTopic: Addition with Carry-Over                     │
│ │                                                                  │
│ ├─ Assessment (001)                                               │
│ │  ├─ Create Assessment for Class V, Math, Whole Numbers         │
│ │  ├─ Assessment.blueprint specifies:                            │
│ │  │  - Include 5 questions from topic                           │
│ │  │  - Competencies to assess: PROBLEM_SOLVING, PRECISION      │
│ │  │  - Difficulty mix: 2 EASY, 2 MEDIUM, 1 HARD                │
│ │  └─ Assessment links to Curriculum node (Topic)                │
│ │                                                                  │
│ └─ Questions (002)                                                │
│    ├─ Query: classId=Class-V, subjectId=Math, topicId=Whole-Num │
│    ├─ Filter: difficulty in [EASY, MEDIUM, HARD]                │
│    ├─ Filter: competencyId in [PROBLEM_SOLVING, PRECISION]      │
│    └─ Return 5 active questions for assessment                   │
│                                                                    │
│ Assessment Attempt Created (001)                                  │
│ └─ Attempt.assessmentVersionId points to specific question set   │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Student Answers Questions                                         │
│ ├─ Response 1: answers Question-001                              │
│ ├─ Response 2: answers Question-002                              │
│ ├─ Response 3: answers Question-003                              │
│ ├─ Response 4: answers Question-004                              │
│ └─ Response 5: answers Question-005                              │
│    (All questions linked to Topic: "Whole Numbers")              │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Scoring & Growth Reporting (001)                                  │
│ ├─ Score attempt                                                  │
│ ├─ Generate evidence records                                      │
│ ├─ Create ScoreRecords for each competency                       │
│ │   └─ CompetencyScore includes:                                 │
│ │      - Competency: PROBLEM_SOLVING                             │
│ │      - Score: 78/100                                           │
│ │      - Evidence: List of response IDs used to derive score     │
│ │                                                                  │
│ └─ Generate Growth Report                                         │
│    ├─ Current profile: Student's scores this session             │
│    ├─ Prior profile: Student's scores from previous assessment   │
│    ├─ Growth trend: Compare across time                          │
│    └─ Curriculum context: Include Subject, Topic, LearningObj   │
│       (from 002) so educators see "Growth in Whole Numbers"      │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Parent/Educator Views Growth Report                              │
│ ├─ Sees competency growth over time                              │
│ ├─ Sees curriculum context: "Student improved in Addition with  │
│ │   Carry-Over (Whole Numbers, Class V Math)"                   │
│ ├─ Sees recommended actions:                                      │
│ │   "Practice more problems on multiplication"                   │
│ │   "Explore fractional concepts next (next topic)"              │
│ └─ Sees question-level data (if enabled):                        │
│    "Student struggled with Question-003; similar questions:    │
│     [link to Question-008, Question-012 from Question Bank]"   │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Coordination

### Pre-Assessment (Curriculum Setup)

Admin/Educator actions (002 APIs):
```
POST /api/v1/admin/curriculum/import                # Import CBSE curriculum
  → Creates classes, subjects, topics

POST /api/v1/questions                             # Create questions
  → Links to classId, subjectId, topicId
  → Links to competencyId (from 001)

POST /api/v1/admin/questions/bulk-import            # Bulk import questions
  → Validates against existing curriculum and competencies
```

### Assessment Creation (001 API using 002 data)

Educator/System actions (001 APIs with 002 lookup):
```
GET /api/v1/curriculum/classes/{classId}/subjects  # Get available subjects
GET /api/v1/curriculum/subjects/{subjectId}/topics # Get available topics
GET /api/v1/questions?classId=X&topicId=Y          # Get questions for topic

POST /api/v1/assessments                           # Create assessment
  → References curriculum nodes (classId, subjectId, topicId)
  → Specifies competencies to assess
  → Creates blueprint with question selection criteria
```

### Assessment Attempt (001 API fetching 002 data)

System actions (001 API):
```
POST /api/v1/assessment-attempts                   # Create attempt
  → Links AssessmentVersion containing selected questions
  → Each question has metadata from 002 (curriculum tags, competency, rubric)

POST /api/v1/assessment-attempts/{id}/responses    # Record response
  → Stores answer with question metadata

POST /api/v1/assessment-attempts/{id}/complete     # Complete attempt
  → Triggers scoring using question rubrics (from 002)
  → Generates growth report with curriculum context
```

### Growth Reporting (001 API with 002 context)

```
GET /api/v1/students/me/growth                     # Get growth report
  → Includes curriculum context from 002:
    {
      "competency": "PROBLEM_SOLVING",
      "score": 78,
      "topic": "Whole Numbers",
      "subject": "Mathematics",
      "class": "V",
      "improvement": 8
    }
```

---

## Database Schema Integration Points

### Question Entity (002) Links to Assessment (001)

```sql
-- Question (from 002)
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  competency_id UUID NOT NULL,  -- Links to Competency (001)
  class_id UUID NOT NULL,       -- Links to Class (002)
  subject_id UUID NOT NULL,     -- Links to Subject (002)
  topic_id UUID NOT NULL,       -- Links to Topic (002)
  prompt TEXT,
  rubric JSONB,
  ... (other fields)
);

-- AssessmentItem (from 001) 
CREATE TABLE assessment_items (
  id UUID PRIMARY KEY,
  assessment_version_id UUID NOT NULL,  -- Links to AssessmentVersion (001)
  question_id UUID NOT NULL,            -- Links to Question (002)
  competency_id UUID NOT NULL,          -- Links to Competency (001)
  ... (other fields)
);
```

### Curriculum Node (002) Links to Assessment (001)

```sql
-- Topic (from 002)
CREATE TABLE topics (
  id UUID PRIMARY KEY,
  subject_id UUID NOT NULL,
  name VARCHAR(255),
  ... (other fields)
);

-- Assessment (from 001) can reference curriculum
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  class_id UUID,          -- Can link to Class (002)
  subject_id UUID,        -- Can link to Subject (002)
  topic_id UUID,          -- Can link to Topic (002)
  blueprint JSONB,        -- Specifies which topics/questions
  ... (other fields)
);
```

### Score (001) Links to Curriculum (002) via Question

```sql
-- ScoreRecord (from 001)
CREATE TABLE score_records (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL,
  competency_id UUID NOT NULL,
  score_value DECIMAL(5,2),
  evidence_ids UUID[],    -- Array of Response IDs
  ... (other fields)
);

-- Response (from 001) links to Question (002)
CREATE TABLE responses (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL,
  question_id UUID NOT NULL,  -- Links to Question (002)
  answer JSONB,
  ... (other fields)
);

-- Query path:
-- ScoreRecord → Response → Question → Topic/Subject/Class
-- This allows: "Score in PROBLEM_SOLVING for Whole Numbers topic"
```

---

## Workflow Examples

### Scenario 1: Educator Sets Up Assessment for Class V Math

**Step 1**: Curriculum is imported (002)
```bash
curl -X POST http://localhost:3000/api/v1/admin/curriculum/import \
  -F file=@ncert-cbse-curriculum.csv \
  -F boardCode=cbse
# Response: Import created for 10 classes, 35 subjects, 145 topics
```

**Step 2**: Questions are created/imported (002)
```bash
# Manual creation
curl -X POST http://localhost:3000/api/v1/questions \
  -H "Authorization: Bearer JWT" \
  -d '{
    "classId": "class-v-uuid",
    "subjectId": "math-uuid",
    "topicId": "whole-numbers-uuid",
    "competencyId": "problem-solving-uuid",
    "itemType": "MCQ",
    "prompt": "What is 5 + 7?",
    "difficulty": "EASY",
    "options": [...],
    "correctAnswerKey": "B",
    "rubric": {...}
  }'

# Or bulk import
curl -X POST http://localhost:3000/api/v1/admin/questions/bulk-import \
  -F file=@math-questions-batch-001.csv
# Response: Import queued; 248 questions to be processed
```

**Step 3**: Assessment is created (001)
```bash
curl -X POST http://localhost:3000/api/v1/assessments \
  -H "Authorization: Bearer JWT" \
  -d '{
    "title": "Class V Math Assessment - Whole Numbers",
    "classStage": "MIDDLE",
    "classId": "class-v-uuid",
    "subjectId": "math-uuid",
    "blueprint": {
      "topics": ["whole-numbers-uuid"],
      "competencies": ["problem-solving-uuid", "precision-uuid"],
      "questionCount": 5,
      "difficultyMix": {
        "EASY": 2,
        "MEDIUM": 2,
        "HARD": 1
      }
    }
  }'
# Response: Assessment created with ID
```

**Step 4**: Student takes assessment (001)
```bash
# Student starts attempt
curl -X POST http://localhost:3000/api/v1/assessment-attempts \
  -H "Authorization: Bearer JWT-STUDENT" \
  -d '{
    "studentId": "student-uuid",
    "assessmentId": "assessment-uuid"
  }'
# Response: Attempt created; frontend fetches questions for display

# Frontend queries questions (from 002 via 001 assessment)
# Questions include prompt, options, and expected rubric
# Student answers each question

# Student completes attempt
curl -X POST http://localhost:3000/api/v1/assessment-attempts/{attemptId}/complete \
  -H "Authorization: Bearer JWT-STUDENT" \
  -d '{ "finalized": true }'
# Response: Attempt completed; scoring triggered
```

**Step 5**: Growth report generated (001 with 002 context)
```bash
# Scoring engine processes responses
# Uses Question rubrics to generate evidence and scores
# Compares with prior assessment (if exists)

curl -X GET http://localhost:3000/api/v1/students/me/growth \
  -H "Authorization: Bearer JWT-STUDENT"
# Response includes:
# {
#   "competency": "PROBLEM_SOLVING",
#   "score": 78,
#   "trend": [...],
#   "curriculum_context": {
#     "topic": "Whole Numbers",
#     "subject": "Mathematics",
#     "class": "V"
#   }
# }
```

---

## Migration Path from MVP (001) to Full Platform

### Phase 1: 001 MVP (In-Memory Demo)
- Assessment feature works with hardcoded demo questions
- No curriculum structure in database
- Scoring and growth reporting work in isolation

### Phase 1.5: 002 MVP
- Curriculum structure (Board, Class, Subject, Topic) imported to database
- Question bank created; questions stored persistently
- 001 still uses demo data but can access 002 curriculum metadata
- Admin can upload curriculum and manage questions

### Phase 2: 001 Switches to Real Data
- Assessment feature queries 002 for actual questions
- Assessment blueprints reference 002 curriculum nodes
- Scoring engine uses 002 question rubrics
- Growth reporting includes 002 curriculum context

### Phase 2+: Advanced Features
- AI-assisted question generation (002) with educator review
- Question performance analytics (001 + 002)
- Adaptive assessment (001) using curriculum progression (002)
- Recommendation engine (001) suggests next curriculum topic (002)

---

## Backward Compatibility

**For 001 MVP users**:
- Existing assessments and scores remain valid
- Adding 002 does not break existing demo assessments
- Students can still access demo assessments after 002 is deployed
- Growth reports work with or without curriculum context

**For 002 to 001 integration**:
- 001 can operate with partial 002 data (some questions, not all)
- Graceful fallback if 002 is unavailable (serve demo questions)
- No breaking changes to 001 API contracts

---

## Testing Strategy

### Unit Tests
- 002: Curriculum import, question validation, bulk import
- 001: Assessment creation using 002 data, scoring, growth reporting

### Integration Tests
- 001 + 002: Assessment creation with real curriculum
- 001 + 002: Student takes assessment; growth report includes curriculum context
- 002 alone: Curriculum queries, question CRUD, bulk import

### Contract Tests
- 001 API contract (assessment endpoints)
- 002 API contract (curriculum and question endpoints)
- Integration contract: Assessment uses 002 questions correctly

### End-to-End Tests
- Full student journey: Curriculum setup → Assessment → Growth report
- Bulk import → Assessment creation → Student assessment → Growth report

---

## Summary

The Curriculum & Question Bank feature (002) provides the persistent data layer that the Assessment feature (001) needs to scale from MVP to production. Together, they form a complete, explainable, and growth-oriented assessment platform for students.
