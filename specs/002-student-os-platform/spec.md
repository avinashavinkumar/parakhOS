# Feature Specification: Admin Question Authoring Access

**Feature Branch**: `002-student-os-platform`
**Created**: 2026-09-22
**Status**: Draft
**Input**: "Let's build Admin login, who will be having access to put the question in database."

## User Scenarios & Testing

### User Story 1 - Admin signs in (Priority: P1)

An approved administrator can sign in to the admin application with an email or phone and password and receive a bearer session. Non-admin accounts cannot use the admin login path.

**Independent Test**: Seed an active admin account, sign in with valid credentials, and verify a bearer response; repeat with a student or parent account and verify rejection.

### User Story 2 - Admin creates a question (Priority: P1)

An authenticated administrator can create a question with its curriculum references, item type, prompt, difficulty, answer data, and provenance. The question is stored as a draft and records the creating admin.

**Independent Test**: Call the protected question-create endpoint with an admin token and valid input, then verify the persisted record and creator identity.

### User Story 3 - Unauthorized access is denied (Priority: P1)

Requests to create, edit, approve, archive, or import questions without a valid admin bearer token are rejected. Student and parent bearer tokens cannot perform admin question-management actions.

**Independent Test**: Exercise each protected mutation with no token, a malformed token, and a valid non-admin token; verify no database mutation occurs.

### User Story 4 - Admin uses the web login and authoring entry point (Priority: P2)

An administrator can use the admin web app login screen, receive clear validation and authentication errors, and reach the question-bank authoring flow after successful sign-in. The session is retained for subsequent protected API calls and can be ended explicitly.

**Independent Test**: Run the admin app, sign in with a seeded admin, open New question, submit a valid question, and verify success or a useful server validation message.

### Edge Cases

- Disabled, missing, or wrong-role accounts cannot authenticate as admins.
- Empty credentials and passwords below the existing account policy return validation errors without querying for a user.
- Expired, malformed, or tampered bearer tokens are rejected.
- Duplicate admin identifiers are rejected during provisioning.
- Invalid question item types, difficulty values, missing MCQ options, and missing selectable answers are rejected before persistence.
- A failed question write must not create a partial record.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST support an `admin` role in authentication and issue the same signed bearer-session shape used by existing accounts.
- **FR-002**: Admin accounts MUST be provisioned by a controlled server-side mechanism or seed process; public signup MUST NOT create admin accounts.
- **FR-003**: Admin login MUST accept the existing identifier style (email or phone), require an active account, and return a generic invalid-credentials response for failed authentication.
- **FR-004**: Question creation, update, approval, archive, and any question import mutation MUST require a valid bearer token whose role is `admin`.
- **FR-005**: The authenticated admin identity MUST be used as the question creator or change actor; clients MUST NOT be trusted to choose another creator for protected mutations.
- **FR-006**: A created question MUST preserve the existing question-bank validation rules and default to draft status until explicitly approved.
- **FR-007**: The admin client MUST provide a login screen, authenticated session handling, logout, and an entry point for creating a question.
- **FR-008**: The admin client MUST display loading, validation, authentication, authorization, and persistence failure states without exposing secrets.
- **FR-009**: The API MUST return documented status codes and response shapes for admin login and protected question-management operations.
- **FR-010**: Automated tests MUST cover successful admin login, rejected non-admin access, protected question mutations, creator attribution, and invalid question input.

### Key Entities

- **Admin account**: An active `users` row with role `admin`, identifier, password hash, and lifecycle timestamps.
- **Admin session**: A signed bearer token carrying admin identity, role, issue time, and expiration.
- **Question**: A question-bank record linked to curriculum entities and carrying content, answer data, difficulty, status, provenance, creator, and timestamps.
- **Question version**: An immutable prior question state recorded when an admin edits a question.

## Success Criteria

- **SC-001**: A valid seeded admin can sign in and reach the protected admin workspace in one browser flow.
- **SC-002**: 100% of tested question-management mutations reject unauthenticated and non-admin requests.
- **SC-003**: Every newly created or edited question records the authenticated admin identity, independent of any client-supplied creator field.
- **SC-004**: Existing student and parent login and assessment flows remain passing after admin support is added.
- **SC-005**: The focused backend test suite and admin production build pass.
