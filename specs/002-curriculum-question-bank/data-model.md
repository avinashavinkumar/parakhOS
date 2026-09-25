# Data Model: Curriculum & Question Bank Management

## Overview

This model defines the entities needed to store and manage CBSE/NCERT curriculum structure and a queryable question bank. It serves as the upstream data layer for the assessment feature.

## Core Entities

### Board

- id: UUID
- name: string (e.g., "CBSE", "ICSE", "State Board")
- code: string
- country: string
- description: string
- isActive: boolean
- createdAt: datetime

Relationships:
- has many Classes
- has many Subjects
- has many CurriculumNodes

Validation:
- board code must be unique

### Class

- id: UUID
- boardId: UUID
- gradeBand: enum { III, IV, V, VI, VII, VIII, IX, X, XI, XII }
- stage: enum { PREPARATORY, MIDDLE, SECONDARY }
- level: integer (display order)
- name: string (e.g., "Class V")
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Board
- has many Subjects (via CurriculumNode)
- has many Students
- has many Assessments

Validation:
- stage must align with gradeBand
- unique constraint: (boardId, gradeBand)

### Subject

- id: UUID
- boardId: UUID
- code: string (e.g., "MATH", "ENG", "SCI")
- name: string
- description: string
- displayOrder: integer
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Board
- has many Topics (via CurriculumNode)
- has many Questions

Validation:
- unique constraint: (boardId, code)

### Topic

- id: UUID
- subjectId: UUID
- boardId: UUID (denormalized for query efficiency)
- code: string
- name: string (e.g., "Whole Numbers")
- description: string
- displayOrder: integer
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Subject
- has many SubTopics
- has many LearningObjectives
- is referenced by many Questions

Validation:
- unique constraint: (subjectId, code)
- boardId must match subject's boardId

### SubTopic

- id: UUID
- topicId: UUID
- code: string
- name: string (e.g., "Addition with Carry-Over")
- description: string
- displayOrder: integer
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Topic
- has many LearningObjectives
- is referenced by many Questions

Validation:
- unique constraint: (topicId, code)

### LearningObjective

- id: UUID
- topicId: UUID
- subTopicId: UUID | null
- bloomLevel: enum { REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE }
- objective: string (e.g., "Students will be able to add multi-digit numbers with carry-over")
- description: string
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Topic
- may belong to one SubTopic
- is linked by many Questions
- guides AI question generation

### Question

- id: UUID
- bankId: UUID | null
- competencyId: UUID | null
- subCompetencyId: UUID | null
- classId: UUID
- subjectId: UUID
- topicId: UUID
- subTopicId: UUID | null
- learningObjectiveId: UUID | null
- itemType: enum { MCQ, SHORT_ANSWER, REFLECTION, SCENARIO, CONVERSATION, PERFORMANCE, TRUE_FALSE, FILL_BLANK }
- prompt: string
- difficulty: enum { EASY, MEDIUM, HARD }
- estimatedTimeSeconds: integer
- options: JSON (array of option objects with text and metadata)
- correctAnswerKey: string
- rubric: JSON (scoring guide with criteria and weights)
- expectedEvidence: JSON (what constitutes a complete or high-quality answer)
- provenance: enum { MANUALLY_CREATED, BULK_IMPORTED, AI_ASSISTED, AI_GENERATED }
- aiGeneratedFrom: string | null (link to learning objective or prompt used for AI generation)
- status: enum { DRAFT, ACTIVE, ARCHIVED, FLAGGED }
- createdBy: UUID (educator or admin)
- reviewedBy: UUID | null (if AI-assisted or AI-generated, human reviewer ID)
- reviewNotes: string | null
- approvedAt: datetime | null
- createdAt: datetime
- updatedAt: datetime

Relationships:
- may belong to one QuestionBank
- may belong to one Competency
- may belong to one Sub-Competency
- belongs to one Class
- belongs to one Subject
- belongs to one Topic
- may belong to one SubTopic
- may reference one LearningObjective
- is used in many AssessmentItems
- has one QuestionImportLog (if bulk imported)
- has many QuestionVersions (edit history)

Validation:
- prompt must not be empty
- if itemType is MCQ or TRUE_FALSE, options must be populated
- if status is ACTIVE, approvedAt must be set
- if provenance is AI_ASSISTED or AI_GENERATED, reviewedBy must be set

### QuestionVersion

- id: UUID
- questionId: UUID
- versionNumber: integer
- prompt: string
- options: JSON
- correctAnswerKey: string
- rubric: JSON
- expectedEvidence: JSON
- changedBy: UUID
- changeReason: string
- createdAt: datetime

Relationships:
- belongs to one Question
- tracks all historical versions for audit and rollback

### QuestionBank

- id: UUID
- schoolId: UUID | null (null = system-wide bank)
- name: string
- description: string
- owner: UUID (educator or admin)
- isPublic: boolean
- createdAt: datetime

Relationships:
- may belong to one School
- has many Questions
- can be shared across classes or subjects

### QuestionImportLog

- id: UUID
- importId: UUID (unique identifier for this import batch)
- fileName: string
- fileSize: integer
- sourceType: enum { CSV, JSON, GOOGLE_SHEETS, API }
- totalRowsAttempted: integer
- successCount: integer
- failureCount: integer
- status: enum { PENDING, IN_PROGRESS, SUCCESS, PARTIAL_FAILURE, FAILED }
- importedBy: UUID
- createdAt: datetime
- completedAt: datetime | null
- errorReport: JSON (detailed error list per row)

Relationships:
- tracks bulk import history
- references many imported Questions

### QuestionImportDetail

- id: UUID
- importLogId: UUID
- rowNumber: integer
- questionData: JSON (original row data)
- questionId: UUID | null (if successfully imported)
- status: enum { SUCCESS, FAILED, SKIPPED }
- errorMessage: string | null

Relationships:
- belongs to one QuestionImportLog
- links to created Question (if successful)

### AIGenerationRequest

- id: UUID
- requestedBy: UUID
- topicId: UUID
- subTopicId: UUID | null
- learningObjectiveId: UUID
- competencyId: UUID
- count: integer (how many questions to generate)
- prompt: string (custom instructions from educator)
- generatedAt: datetime
- questionsGenerated: integer
- status: enum { PENDING, IN_PROGRESS, COMPLETED, FAILED }
- aiModelVersion: string
- generationNotes: string

Relationships:
- tracks AI generation requests for transparency
- links generated Questions via aiGeneratedFrom field

## Relationships Summary

- Board -> Class: one-to-many
- Board -> Subject: one-to-many
- Class -> Students: one-to-many
- Class -> Questions: one-to-many (via classId)
- Subject -> Topics: one-to-many
- Topic -> SubTopics: one-to-many
- Topic -> LearningObjectives: one-to-many
- SubTopic -> LearningObjectives: one-to-many
- Question -> CompetencyScore: many-to-one (links assessment to curriculum)
- Question -> QuestionVersion: one-to-many
- QuestionBank -> Question: one-to-many
- QuestionImportLog -> QuestionImportDetail: one-to-many
- AIGenerationRequest -> Question: one-to-many (via aiGeneratedFrom)

## State Transitions

### Question lifecycle

- DRAFT → ACTIVE: Educator creates and approves question
- ACTIVE → ARCHIVED: Question is no longer used but kept for history
- ACTIVE → FLAGGED: Data quality issue or needs educator review
- FLAGGED → ACTIVE: Issue resolved and educator re-approves
- FLAGGED → ARCHIVED: Issue unresolvable, question retired

### QuestionImportLog lifecycle

- PENDING → IN_PROGRESS: System begins processing batch
- IN_PROGRESS → SUCCESS: All rows imported successfully
- IN_PROGRESS → PARTIAL_FAILURE: Some rows failed; details in errorReport
- IN_PROGRESS → FAILED: Import aborted due to critical error
- (Any state) → COMPLETED: Process finished (success or failure)

## Validation Rules

- All questions must have a valid classId, subjectId, and topicId
- Questions cannot be deleted if they are used in a live or completed assessment; they must be archived
- Curriculum nodes (Class, Subject, Topic, SubTopic) must belong to an active Board
- LearningObjectives must align with Bloom's taxonomy or a defined pedagogical framework
- AI-generated questions must be reviewed and approved before entering the ACTIVE status
- Bulk import must validate every row before committing; partial success is allowed but flagged
- QuestionBank ownership must be respected in queries (public vs. private banks)

## Denormalization Notes

- Question includes classId, subjectId, topicId for efficient filtering (denormalized from Board → Class → Subject → Topic hierarchy)
- This allows single-table queries like: `WHERE classId = ? AND subjectId = ? AND topicId = ?`
- Maintain referential integrity triggers to ensure consistency

## Integration with Assessment Feature

- AssessmentItem references Question (via questionId or direct embedding)
- Assessment queries filter by classId, subjectId, topicId to select relevant questions
- Growth reporting can map competency improvements back to specific curriculum nodes and questions used
- Question edit history allows audit trails for assessments that reference old versions

## Design Decisions

1. **Separate Board/Class/Subject/Topic entities**: Allows flexibility for multi-board support and complex curriculum structures
2. **Question versioning**: Maintains immutable snapshots for assessments; edit history for transparency
3. **LearningObjective entity**: Links curriculum to pedagogy; supports AI generation and educator planning
4. **QuestionImportLog with detail tracking**: Enables bulk operations at scale with full error reporting and retry capability
5. **AIGenerationRequest entity**: Tracks AI involvement for transparency and compliance
6. **Question.provenance field**: Documents source (manual, imported, AI) for transparency
7. **Denormalization of curriculum path in Question**: Optimizes the most common query pattern (find questions for a class/subject/topic)
