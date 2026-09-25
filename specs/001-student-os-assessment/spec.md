# Feature Specification: Student OS Assessment & Growth Framework

**Feature Branch**: `001-student-os-assessment`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Student OS is an AI-powered competency assessment platform designed to measure, benchmark, and improve the holistic development of students from Classes III to XII. The platform evaluates academic and future-ready skills through adaptive, conversational, and scenario-based assessment experiences and produces explainable growth reports for students, parents, and educators."

Authentication is specified separately in [login.md](login.md), including Student and Parent password login, JWT sessions, and optional Google OAuth.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student completes a class-appropriate competency assessment (Priority: P1)

A student logs in, completes an adaptive assessment aligned to their class stage and competency profile, and receives a transparent summary of strengths and improvement areas. The system supports age-appropriate expectations and explains how the score was derived.
Also, when student logged in, There will ba home dashboard. From that dashboard Assesment section, when student explicitly start the assesment, a new assesment screen should open.  On this screen all assessments assignemed by parents/AI should be displayed. If no assement is assigned by parents, There should be an option to slect the assement. a) Academic assessment b) Future skills. 

After slection from assemement, Student should be able to take test and see the problematic area if any. Also their home dashboard should be updated.

For an Academic assessment, the student first selects a subject, topic, and question count of 5 or 10. The system then generates that number of AI-generated-style multiple-choice questions for the selected learning focus. The student must select an option, check the answer, and then continue. Each answer is checked against its answer key, scored immediately, and submitted to the assessment attempt. After completion, the calculated score is shown on the student home dashboard.

The implementation currently uses deterministic AI-generated-style demo questions so the flow can be tested without an AI provider. In the next phase, questions will be generated or retrieved for the selected class, subject, and topic from the question bank database, while preserving the same answer-checking and progress update contract.

For C
BSC curriculam , ncert sylabus will be base line for a class->Subject->topic. ncert publish the detail curriculam in their pdf.Load that data into a json file and package it wil application. Similar approach we will use for any other board curriculam.  


**Why this priority**: This is the core value proposition of Student OS and the primary outcome the platform must reliably deliver for every learner.

**Independent Test**: A student can complete a single assessment flow from login to final competency summary without any manual intervention and receive a usable score report.

**Acceptance Scenarios**:

1. **Given** a student has valid login access and is assigned to a class level, **When** they start a new assessment, **Then** the system identifies the correct developmental stage and selects relevant competency tasks.
2. **Given** the student completes the assessment, **When** the evaluation is processed, **Then** the system provides competency-wise scores, clear explanations, and recommended next steps.
3. **Given** the student has no prior assessment history, **When** they complete the first assessment, **Then** the system still produces a complete competency profile without requiring historical comparison data.

---

### User Story 2 - Parent reviews a growth-based report across time (Priority: P1)

A parent receives a structured report showing the student’s current competency profile alongside prior assessment performance. The report emphasizes improvement over rankings and highlights strengths, support needs, and recommended actions.

**Why this priority**: Growth and actionable reporting are central to the platform’s value for families and align with the NEP 2020 philosophy of continuous development.

**Independent Test**: A parent can open a report and clearly compare the latest assessment against an earlier one without interpreting raw score data.

**Acceptance Scenarios**:

1. **Given** a student has completed a prior assessment, **When** the parent opens the latest report, **Then** the system compares the current scores with previous scores and highlights competency-level progress.
2. **Given** a student’s score has declined in one area, **When** the report is generated, **Then** the system presents the decline as a support opportunity with specific guidance instead of a punitive outcome.
3. **Given** the student has multiple competency areas, **When** the parent reviews the report, **Then** the system organizes results by domain and clearly identifies the strongest and weakest areas.

---

### User Story 3 - School or educator uses the assessment repository to support holistic evaluation (Priority: P2)

An educator or school administrator uses the assessment repository and scoring framework to understand what is being measured, how student performance is evaluated, and which learning behaviours are being monitored beyond academics.

**Why this priority**: This enables consistent evaluation across multiple classes and supports the school’s role in building a holistic developmental picture alongside academic performance.

**Independent Test**: An educator can view the competency framework and understand which domains and sub-competencies are included in assessment planning.

**Acceptance Scenarios**:

1. **Given** a school is preparing assessments, **When** it reviews the competency model, **Then** it can see academic, future skills, and learning disposition domains with class-appropriate expectations.
2. **Given** a competency has a defined assessment blueprint, **When** a teacher or analyst reviews the item metadata, **Then** they can see learning objective, scoring rubric, and evidence dimensions for that competency.

---

### Edge Cases

- What happens when a student has never completed a prior assessment and there is no baseline for comparison?
- How does the system handle a student who does not fit a clear class-level pattern or has unusually uneven performance across competencies?
- What happens when an assessment item is incomplete, skipped, or cannot be evaluated because of low-quality input or missing context?
- How does the system respond when a competency area has insufficient evidence to produce a reliable score?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST identify the student’s class level and determine the appropriate stage-specific assessment model before evaluation begins.
- **FR-002**: The system MUST assess students across academic, future skills, and learning disposition domains in a manner aligned with holistic development goals.
- **FR-003**: The system MUST support age-appropriate expectations so that competency benchmarks differ meaningfully between preparatory, middle, and secondary stages.
- **FR-004**: The system MUST support adaptive and scenario-based assessment experiences, including conversational, reflective, and problem-solving tasks where relevant.
- **FR-005**: The system MUST generate competency-wise scores with clear explanations, including strengths, improvement opportunities, and recommended actions.
- **FR-006**: The system MUST compare current assessment results with prior assessments to show measurable growth over time without ranking students against one another.
- **FR-007**: The system MUST provide a parent-facing report that summarizes the student’s overall profile, growth trend, support areas, and next-step recommendations.
- **FR-008**: The system MUST maintain a structured assessment repository with information about competency, class, topic, learning objective, difficulty, rubric, and feedback metadata.
- **FR-009**: The system MUST preserve explainability in scoring so that each result can be traced to the competency dimensions and evidence used in evaluation.
- **FR-010**: The system MUST support fairness and age-appropriate design by avoiding misleading or punitive interpretations of performance and by enabling developmental context in reporting.
- **FR-011**: The system MUST provide results in a format that helps students, parents, and educators understand the student’s current profile and the actions needed to support improvement.
- **FR-012**: The assessment experience MUST present MCQ answer choices only after an assessment type and subject/skill focus have been selected.
- **FR-013**: The system MUST check submitted MCQ answers against an answer key, show whether the answer is correct, and include the result in the completed assessment score.
- **FR-014**: Completing an assessment MUST update the student dashboard with the latest assessment score and progress state.
- **FR-015**: The demo MAY use deterministic AI-generated-style questions without an external AI provider; a later implementation MUST retrieve or generate questions from the database question bank for the selected class, subject, and topic.
- **FR-016**: An Academic assessment MUST allow the student to select a subject, topic, and either 5 or 10 questions before generation begins.
- **FR-017**: The generated Academic questions MUST be multiple-choice questions associated with the selected subject and topic, and the session MUST display the configured number of questions.
- **FR-018**: The system MUST authenticate Student and Parent accounts through a backend login endpoint and issue a signed, time-limited JWT access token.
- **FR-019**: The login experience MUST offer Google OAuth sign-in for Student and Parent roles when Google OAuth credentials are configured.
- **FR-020**: On a student's first successful login, the system MUST collect and persist the student's name, father name, mother name, age, class, home address, school name, school address, school place, school city, optional student phone, and mandatory parents phone.
- **FR-021**: Student profile creation MUST be atomic: the student account, parent account, and parent-student relationship are either all persisted or none are persisted.

### Key Entities *(include if feature involves data)*

- **Student**: Represents each learner, including class stage, assessment history, competency profile, and relevant summary data.
- **Assessment**: Represents a single evaluation instance, including date, class level, competency mix, task type, and outcome information.
- **Competency**: Represents a broad ability area such as Language & Communication, Problem Solving, or Growth Mindset.
- **Sub-Competency**: Represents a more specific skill or behavior within a competency, such as vocabulary, collaboration, or self-management.
- **Assessment Repository Item**: Represents a structured question or task with metadata such as competency, class, topic, difficulty, prompt, scoring rubric, and feedback guidance.
- **Growth Report**: Represents a comparative view that explains current performance, prior performance, and recommended next steps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can complete a full competency assessment and receive a usable result in under 15 minutes for a standard guided session.
- **SC-002**: At least 90% of learners can understand their competency summary without requiring external interpretation from a teacher or administrator.
- **SC-003**: The system generates a growth comparison for each student across successive assessments with a clear summary of improvement or support needs in at least 95% of valid assessment records.
- **SC-004**: Parent-facing reports clearly communicate the student’s strongest competencies, areas needing support, and recommended actions in a way that is understandable to non-technical users.
- **SC-005**: At least 90% of completed assessment sessions include explainable scoring details tied to competency dimensions and evidence.
- **SC-006**: The platform supports a minimum set of three competency domains across all class levels, with age-appropriate benchmarks for preparatory, middle, and secondary stages.

## Assumptions

- The platform is designed for schools and families as a complementary assessment tool rather than a replacement for formal board or school examinations.
- Students will be evaluated in class-specific stages, with stage-specific expectations rather than a single universal benchmark.
- Assessment data will be stored and compared over time to support growth-oriented reporting.
- The initial product scope focuses on the core assessment, reporting, and repository functions rather than a full school management system.
- AI-generated assessment and scoring must remain transparent, age-appropriate, and aligned with educational fairness principles.
- The current demo uses a deterministic local question generator to represent AI output; production generation and retrieval will use the question bank database and an approved AI provider when available.
- Password authentication uses the PostgreSQL `users` record, scrypt password hashes, and an HS256 JWT. Google sign-in uses an OAuth authorization-code flow; deployment must provide `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `FRONTEND_URL`.
- First-time student profile data is stored across `users`, `students`, `parents`, and `parent_student` using one database transaction. PostgreSQL must be running for profile submission; the local demo authentication path cannot persist profile data while `DB_ENABLED=false`.
