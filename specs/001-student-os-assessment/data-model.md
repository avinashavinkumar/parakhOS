# Data Model: Student OS Assessment & Growth Framework

## Overview

This model defines the key entities needed to support stage-aware assessment, explainable scoring, and growth-oriented reporting across a student lifecycle.

## Core Entities

### Student

- id: UUID
- userId: UUID
- schoolId: UUID
- classId: UUID
- currentStage: enum { PREPARATORY, MIDDLE, SECONDARY }
- dateOfBirth: date
- status: enum { ACTIVE, INACTIVE, ARCHIVED }
- createdAt: datetime
- updatedAt: datetime

Relationships:
- belongs to one School
- belongs to one Class
- has many AssessmentAttempts
- has one CompetencyProfile
- has many GrowthReports

Validation rules:
- student must have a valid school and class assignment
- stage must match the assigned class or be explicitly overridden with governance approval
- no duplicate active student records for the same user in the same school

### Parent

- id: UUID
- userId: UUID
- studentIds: UUID[]
- relationshipType: enum { MOTHER, FATHER, GUARDIAN, OTHER }
- consentStatus: enum { GRANTED, PENDING, REVOKED }
- createdAt: datetime

Relationships:
- may have many linked Students
- receives report access and recommendation notifications

### School

- id: UUID
- name: string
- boardType: string
- region: string
- status: enum { ACTIVE, INACTIVE }
- createdAt: datetime

Relationships:
- has many Students
- has many Assessments
- owns educational metadata and audit history

### ClassLevel

- id: UUID
- schoolId: UUID
- gradeBand: enum { III, IV, V, VI, VII, VIII, IX, X, XI, XII }
- stage: enum { PREPARATORY, MIDDLE, SECONDARY }
- curriculumVersion: string
- createdAt: datetime

Relationships:
- many Students belong to one ClassLevel
- can define default benchmark rules for assessment selection

### Competency

- id: UUID
- domainId: UUID
- code: string
- name: string
- description: string
- category: enum { ACADEMIC, FUTURE_SKILLS, LEARNING_DISPOSITION }
- isActive: boolean
- createdAt: datetime

Relationships:
- belongs to one Domain
- has many SubCompetencies
- is referenced by AssessmentItems and ScoreRecords

### SubCompetency

- id: UUID
- competencyId: UUID
- code: string
- name: string
- description: string
- rubricId: UUID
- evidenceLabels: string[]

Relationships:
- belongs to one Competency
- contributes to final competency score formation

### Assessment

- id: UUID
- schoolId: UUID
- versionId: UUID
- title: string
- classStage: enum { PREPARATORY, MIDDLE, SECONDARY }
- domainMix: string[]
- status: enum { DRAFT, ACTIVE, ARCHIVED }
- publishedAt: datetime | null
- createdAt: datetime

Relationships:
- has many AssessmentVersions
- is associated with many AssessmentAttempts

### AssessmentVersion

- id: UUID
- assessmentId: UUID
- versionNumber: integer
- blueprintJson: JSON
- scoringModelId: UUID
- validFrom: datetime
- validTo: datetime | null
- createdAt: datetime

Relationships:
- belongs to one Assessment
- defines a publishable snapshot of item composition and scoring logic

### AssessmentItem

- id: UUID
- assessmentVersionId: UUID
- competencyId: UUID
- subCompetencyId: UUID | null
- itemType: enum { MCQ, SHORT_ANSWER, REFLECTION, SCENARIO, CONVERSATION, PERFORMANCE }
- prompt: string
- difficulty: enum { EASY, MEDIUM, HARD }
- rubric: JSON
- expectedEvidence: JSON
- createdAt: datetime

Relationships:
- belongs to one AssessmentVersion
- maps to a competency and optional sub-competency
- has many Responses

### AssessmentAttempt

- id: UUID
- studentId: UUID
- assessmentVersionId: UUID
- startedAt: datetime
- completedAt: datetime | null
- status: enum { DRAFT, IN_PROGRESS, SUBMITTED, EVALUATING, COMPLETED, FLAGGED }
- sessionMetadata: JSON
- scoreSummary: JSON | null

Relationships:
- belongs to one Student
- belongs to one AssessmentVersion
- has many Responses
- produces ScoreRecords

### Response

- id: UUID
- assessmentAttemptId: UUID
- itemId: UUID
- answer: JSON
- qualityFlags: string[]
- isSkipped: boolean
- evaluationStatus: enum { PENDING, EVALUATED, INSUFFICIENT_EVIDENCE, INVALID_INPUT }
- submittedAt: datetime

Relationships:
- belongs to one Attempt and one Item
- is used as evidence input for scoring

### EvidenceRecord

- id: UUID
- attemptId: UUID
- competencyId: UUID
- subCompetencyId: UUID | null
- source: enum { RESPONSE, AI_ANALYSIS, TEACHER_REVIEW, AGGREGATE }
- content: JSON
- confidence: float
- createdAt: datetime

Relationships:
- belongs to one assessment attempt and competency area
- feeds the score engine and explainability output

### ScoreRecord

- id: UUID
- attemptId: UUID
- competencyId: UUID
- subCompetencyId: UUID | null
- scoreValue: decimal(5,2)
- scoreBand: enum { EMERGING, DEVELOPING, PROFICIENT, ADVANCED }
- explanation: string
- evidenceIds: UUID[]
- modelVersion: string
- generatedAt: datetime

Relationships:
- belongs to one attempt and one competency area
- supports historical comparisons and report generation

### GrowthReport

- id: UUID
- studentId: UUID
- reportDate: datetime
- currentProfile: JSON
- priorProfile: JSON | null
- trendSummary: JSON
- recommendations: UUID[]
- generatedBy: enum { SYSTEM, EDUCATORS, PARENT }

Relationships:
- belongs to one Student
- aggregates competency history and recommendations

### Recommendation

- id: UUID
- studentId: UUID
- competencyId: UUID
- recommendationType: enum { PRACTICE, SUPPORT, ENRICHMENT, PARENT_GUIDANCE }
- title: string
- summary: string
- priority: enum { LOW, MEDIUM, HIGH }
- createdAt: datetime

Relationships:
- belongs to one Student and one Competency
- can be attached to one or more GrowthReports

## Relationships Summary

- Student -> School: many-to-one
- Student -> ClassLevel: many-to-one
- School -> Assessment: one-to-many
- Assessment -> AssessmentVersion: one-to-many
- AssessmentVersion -> AssessmentItem: one-to-many
- AssessmentAttempt -> Student: many-to-one
- AssessmentAttempt -> AssessmentVersion: many-to-one
- AssessmentAttempt -> Response: one-to-many
- AssessmentAttempt -> ScoreRecord: one-to-many
- AssessmentAttempt -> EvidenceRecord: one-to-many
- Student -> GrowthReport: one-to-many
- Student -> Recommendation: one-to-many

## State Transitions

### AssessmentAttempt lifecycle

- DRAFT -> IN_PROGRESS when the student starts a session
- IN_PROGRESS -> SUBMITTED when responses are saved and the attempt is submitted
- SUBMITTED -> EVALUATING when scoring work begins
- EVALUATING -> COMPLETED when scoring is finalized
- COMPLETED -> FLAGGED when there is insufficient evidence or a data-quality issue

### Score lifecycle

- provisional score created during evaluation
- finalized score stored as immutable ScoreRecord
- historical comparison reads prior ScoreRecords only; it does not overwrite earlier snapshots

## Validation Rules

- Any score record must map to a valid competency and a valid assessment attempt.
- A completed assessment attempt must include all required item responses or explicit skip metadata.
- No final score may be generated without evidence or a justified insufficient-evidence flag.
- Growth reporting must compare against the latest valid prior assessment only when historical data exists.
- Incomplete or low-quality inputs must never result in a hidden score; they must be captured with a corresponding evaluation status.

## Notes

This model supports the core product promise: stage-aware, explainable, and longitudinal evaluation without ranking students against each other.
