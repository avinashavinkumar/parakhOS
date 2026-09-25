# Data Model: Admin Question Authoring Access

## User account

Existing table: `users`

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key; token subject |
| `email` | VARCHAR | Optional, unique; identifier |
| `phone` | VARCHAR | Optional, unique; identifier |
| `password_hash` | TEXT | Scrypt hash for password login |
| `role` | VARCHAR | `student`, `parent`, or `admin` |
| `status` | VARCHAR | Only `active` accounts may authenticate |
| `last_login_at` | TIMESTAMPTZ | Updated after successful login |

Admin provisioning creates an active `users` row with `role = 'admin'`; it does not use public signup.

## Admin session claims

Signed bearer token payload:

| Claim | Meaning |
|---|---|
| `sub` | Authenticated user ID |
| `email` | Login email or phone fallback |
| `role` | Must equal `admin` for protected authoring mutations |
| `iat` | Issued-at Unix timestamp |
| `exp` | Expiration Unix timestamp |

The token is transport-only session state. The server remains the authority for authorization.

## Curriculum references

The existing `CurriculumService` establishes the concrete table names used by question authoring:

- `curriculum_boards`
- `curriculum_classes`
- `curriculum_subjects`
- `curriculum_class_subjects`
- `curriculum_topics`
- `curriculum_subtopics`
- `curriculum_learning_objectives`
- `curriculum_syllabus`

The schema task must declare these tables and the relationships required by the service before question-bank foreign keys are added. `class_id`, `subject_id`, and `topic_id` on a question reference `curriculum_classes`, `curriculum_subjects`, and `curriculum_topics` respectively; optional subtopic and learning-objective references target `curriculum_subtopics` and `curriculum_learning_objectives`.

## Question-bank question

Existing service target: `question_bank_questions`; the schema migration must define or reconcile this table.

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `class_id`, `subject_id`, `topic_id` | UUID | Required curriculum references |
| `subtopic_id`, `learning_objective_id`, `competency_id` | UUID | Optional curriculum references |
| `item_type` | enum-like text | One of the existing service item types |
| `prompt` | TEXT | Required and non-blank |
| `difficulty` | enum-like text | `EASY`, `MEDIUM`, or `HARD` |
| `estimated_time_seconds` | integer | Optional |
| `options` | JSONB | Required for `MCQ` and `TRUE_FALSE` |
| `correct_answer_key` | text | Required for selectable item types |
| `rubric`, `expected_evidence` | JSONB | Optional |
| `provenance` | enum-like text | Defaults to `MANUALLY_CREATED` |
| `status` | enum-like text | New records default to draft; approval sets `ACTIVE` |
| `created_by` | UUID | Required; derived from admin token |
| `approved_at` | TIMESTAMPTZ | Set on first approval |
| timestamps | TIMESTAMPTZ | Created and updated timestamps |

## Question version

Existing service target: `question_bank_versions`.

Each update snapshots the prior question content with an incrementing `version_number`, authenticated `changed_by`, `change_reason`, and creation timestamp. The snapshot and current-row update must commit atomically.

## Relationships

- `users (admin) 1 -> many question_bank_questions` through `created_by`.
- `users (admin) 1 -> many question_bank_versions` through `changed_by`.
- `question_bank_questions 1 -> many question_bank_versions` through `question_id`.
- `question_bank_questions.class_id` references `curriculum_classes.id`.
- `question_bank_questions.subject_id` references `curriculum_subjects.id`.
- `question_bank_questions.topic_id` references `curriculum_topics.id`.
- Optional `subtopic_id` and `learning_objective_id` reference `curriculum_subtopics.id` and `curriculum_learning_objectives.id`.

## State transitions

```text
DRAFT --approve--> ACTIVE
DRAFT --archive--> ARCHIVED
ACTIVE --archive--> ARCHIVED
```

Archived questions are not deleted. Updates preserve a prior version and retain the current status unless an explicit status mutation is requested.
