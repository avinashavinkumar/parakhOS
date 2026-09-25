# Feature Specification: Curriculum & Question Bank Management

**Feature Branch**: `002-curriculum-question-bank`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User requirement: "Admin and educators need to load CBSE/NCERT curriculum structure into the system and manage a question bank that is filterable by class, subject, topic, and subtopic. Questions should be importable from CSV files, manually created, and AI-generated, with full traceability to curriculum objectives."

## User Scenarios & Testing

### User Story 1 - Admin imports NCERT curriculum structure (Priority: P1)

An admin uploads the NCERT curriculum definition (classes III–XII, subjects, topics, subtopics) via CSV/JSON file or manual configuration. The system parses and stores the curriculum hierarchy, making it queryable by students and educators for assessment setup and filtering.

**Why this priority**: Without curriculum structure in the database, students cannot filter assessments by subject/topic. This is a blocking dependency for the assessment feature.

**Independent Test**: An admin can import a CBSE curriculum file and verify that all classes, subjects, topics, and subtopics are stored and queryable via API.

**Acceptance Scenarios**:

1. **Given** an admin has a NCERT curriculum file (CSV or JSON), **When** they upload it via the admin endpoint, **Then** the system parses the structure and stores classes, subjects, topics, and subtopics.
2. **Given** the curriculum is imported, **When** an educator queries `/api/v1/curriculum/classes/V/subjects`, **Then** the system returns all subjects for Class V with their topics.
3. **Given** a class or subject is updated in the source file, **When** an admin re-imports the file, **Then** the system detects duplicates and allows merge/update workflows without data loss.

---

### User Story 2 - Educator or admin manages question bank (Priority: P1)

An educator or admin can create, edit, and organize assessment questions in a question bank. Each question is tagged with competency, sub-competency, class level, subject, topic, subtopic, difficulty, and learning objective. Questions are stored in the database and linked to curriculum nodes for easy retrieval.

**Why this priority**: A searchable, well-organized question bank is essential for creating assessments quickly. Without this, assessments cannot be built efficiently.

**Independent Test**: An educator can create a question, tag it to a competency and curriculum node (Class V, Mathematics, Whole Numbers), and retrieve it via API.

**Acceptance Scenarios**:

1. **Given** an educator accesses the question bank, **When** they create a new MCQ question with a prompt, options, correct answer, rubric, and curriculum tags, **Then** the system stores it and assigns a unique ID.
2. **Given** questions are created, **When** an educator filters by class, subject, and topic, **Then** the system returns only matching questions with sorting by difficulty.
3. **Given** a question exists in the database, **When** the educator edits the prompt or rubric, **Then** the system updates the question and maintains an edit history.
4. **Given** a question is used in a live assessment, **When** an educator tries to delete it, **Then** the system prevents deletion and suggests archiving instead.

---

### User Story 3 - Bulk import questions from CSV (Priority: P2)

An admin or curriculum coordinator can bulk-import questions from a CSV file that includes question text, options, correct answer, competency mapping, difficulty, and curriculum tags. The system validates the import, provides a preview, and allows selective import with error reporting.

**Why this priority**: Manual question creation doesn't scale. Bulk import is needed to populate a comprehensive question bank.

**Independent Test**: An admin can import 100 questions from a CSV file and verify all are stored with correct metadata and links to competencies and curriculum nodes.

**Acceptance Scenarios**:

1. **Given** an admin has a CSV with questions (prompt, options, correct answer, class, subject, topic, competency), **When** they upload via the bulk import endpoint, **Then** the system validates and shows a preview of what will be imported.
2. **Given** some questions have validation errors (e.g., missing competency), **When** the system processes the import, **Then** it flags errors clearly and allows the admin to fix and retry without re-importing valid rows.
3. **Given** questions are bulk-imported, **When** they are successfully stored, **Then** the system generates an import report with count, success/failure rate, and timestamp.

---

### User Story 4 - AI-assisted question generation (Priority: P2)

An educator can provide a learning objective and curriculum node (class, subject, topic), and the AI can generate multiple-choice questions aligned to that objective. The educator reviews and approves questions before they enter the question bank. This workflow is tracked for transparency.

**Why this priority**: Speeds up question bank population and ensures alignment to learning objectives.

**Independent Test**: An educator can request AI generation for "Class V, Whole Numbers, addition with carry-over" and receive 3–5 candidate MCQ questions for review.

**Acceptance Scenarios**:

1. **Given** an educator provides a learning objective and curriculum context, **When** they trigger AI question generation, **Then** the system produces candidate questions with prompts, options, and rubrics.
2. **Given** AI questions are generated, **When** the educator reviews them in a staging area, **Then** they can approve, edit, or discard each question before moving to the live bank.
3. **Given** questions are approved, **When** they enter the question bank, **Then** the system marks them as "AI-Assisted" and maintains audit history of the workflow.

---

### Edge Cases

- What happens when the same question exists in the bank already (duplicate detection)?
- How are questions versioned if a curriculum topic definition changes?
- Can a question be linked to multiple topics or competencies?
- What happens to questions if a curriculum node is archived or deleted?
- How do educators manage question bank access across schools or classes?

## Requirements

### Functional Requirements

- **FR-C001**: The system MUST support importing NCERT curriculum structure (classes III–XII, subjects, topics, subtopics) from CSV/JSON files.
- **FR-C002**: The system MUST store curriculum metadata including class, subject, topic, subtopic, learning objectives, and board type (CBSE, ICSE, State boards).
- **FR-C003**: The system MUST provide queryable endpoints to retrieve curriculum structure filtered by class, subject, and topic.
- **FR-C004**: The system MUST allow educators to create, edit, and archive questions with full metadata (competency, class, subject, topic, difficulty, rubric, expected evidence).
- **FR-C005**: The system MUST support bulk import of questions from CSV files with validation and error reporting.
- **FR-C006**: The system MUST maintain version history for questions and curriculum nodes, preventing loss of data when updates occur.
- **FR-C007**: The system MUST link each question to one or more curriculum nodes (class, subject, topic, subtopic) and competencies.
- **FR-C008**: The system MUST provide an AI-assisted question generation workflow where educators can request, review, and approve AI-generated questions before they enter the bank.
- **FR-C009**: The system MUST prevent deletion of questions in use by live assessments; instead, it MUST support archiving with referential integrity.
- **FR-C010**: The system MUST track question provenance (manually created, imported, AI-assisted) for transparency and auditability.
- **FR-C011**: The system MUST provide an admin dashboard or web UI for managing curriculum, questions, and bulk imports (not API-only).

### Key Entities

- **Board**: Represents curriculum standards (CBSE, ICSE, State Board).
- **Class**: Represents a grade level (III, IV, V, ..., XII).
- **Subject**: Represents an academic subject (Mathematics, English, Science, Social Studies).
- **Topic**: Represents a learning unit within a subject (e.g., "Whole Numbers" in Math Class V).
- **SubTopic**: Represents a specific learning area within a topic (e.g., "Addition with Carry-Over").
- **LearningObjective**: Represents what students should achieve (mapped to Bloom's taxonomy or similar framework).
- **Question**: Represents an assessment item with prompt, options, rubric, and metadata.
- **QuestionBank**: Represents a collection of questions organized by school, class, subject, or competency.
- **QuestionImportLog**: Represents bulk import history with timestamps, file names, success/failure counts, and detailed error reports.

## Success Criteria

- **SC-C001**: All CBSE/NCERT curriculum data for classes III–XII can be imported and queried within 2 seconds.
- **SC-C002**: Educators can create or import 100 questions in under 5 minutes via bulk import.
- **SC-C003**: 95% of bulk imports succeed without manual intervention; errors are clearly reported and actionable.
- **SC-C004**: AI-generated questions pass educator review with at least 80% acceptance rate and correctly map to competencies.
- **SC-C005**: The admin dashboard loads question bank and curriculum management interfaces in under 2 seconds.
- **SC-C006**: All question metadata (competency, curriculum tags, difficulty, rubric) is searchable and filterable.

## Assumptions

- CBSE/NCERT curriculum structure is available in standardized format (CSV or JSON).
- Questions will be created incrementally and may come from multiple sources (manual, bulk import, AI-assisted).
- Educators have appropriate permissions to create and review questions.
- The system will initially focus on CBSE but be designed to accommodate other boards.
- AI-generated questions are reviewed by humans before approval; AI is not the final authority.
- Questions are reusable across multiple assessments and schools if appropriate permissions are granted.
