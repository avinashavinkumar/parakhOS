# Research: Admin Question Authoring Access

## Decision: Reuse the existing authentication endpoint for admin login

**Rationale**: `AuthService.login()` already handles email-or-phone lookup, password verification, active-account filtering, signed bearer responses, and the existing student/parent flows. Extending its role set to include `admin` preserves one response contract and avoids duplicated credential logic.

**Alternatives considered**: A separate `/admin/login` endpoint would make the boundary explicit but would duplicate authentication behavior and increase the API surface. The admin UI can still expose a distinct `/admin/login` route while calling the shared API endpoint with `role: admin`.

## Decision: Keep public signup restricted to student and parent

**Rationale**: The database already supports `admin`, but public signup must not grant administrative capability. Admins will be provisioned through a server-side seed or controlled operator command.

**Alternatives considered**: Allowing an admin checkbox or role in signup is unsafe. An admin-only provisioning API can be added later, but a seed mechanism is the smallest first release.

## Decision: Authorize question mutations with a reusable bearer role guard

**Rationale**: Question create, update, approve, archive, and import mutations currently have no protection. A Nest guard can consistently verify the token and role at the controller boundary, while the service remains responsible for domain validation. Token verification must return claims including `sub` and `role`, and must reject malformed, expired, or tampered tokens as controlled authentication errors.

**Alternatives considered**: Service-only checks are easier to miss when new routes are added. Database lookup on every request would support immediate revocation but adds query cost and is not consistent with the current lightweight signed-token implementation; account status can be revisited with a revocation strategy.

## Decision: Derive creator and change actor from verified claims

**Rationale**: `createdBy` and `changedBy` are currently client-controlled. Controllers will pass the authenticated subject into the service, and the public mutation DTOs will no longer trust those fields.

**Alternatives considered**: Keeping client actor fields is backward-compatible but permits audit impersonation and violates the feature requirement.

## Decision: Make the question-bank schema explicit before relying on persistence

**Rationale**: `QuestionsService` writes `question_bank_questions` and `question_bank_versions`, but the checked-in schema currently defines only the older `questions` model. The plan will add the intended question-bank tables or an equivalent migration before treating question authoring as runnable.

**Alternatives considered**: Refactoring immediately to the older `questions` table would lose curriculum references, provenance, and versioning already modeled by the service. Retaining the service contract and adding its required schema is less disruptive.

## Decision: Add authenticated API handling to the admin client

**Rationale**: The admin dashboard currently loads public data, silently falls back to demo questions, and shows a placeholder for New question. A shared fetch helper will attach the bearer token, redirect on `401`, distinguish `403` and validation failures, and avoid hiding protected-request failures behind demo data.

**Alternatives considered**: Client-only route protection cannot secure the API. HttpOnly cookies would improve token exposure but require a wider session, CORS, and CSRF redesign than this feature needs.

## Decision: Preserve the established admin visual language

**Rationale**: Existing login cards, panels, buttons, modal patterns, and responsive styles already provide a coherent admin experience. The new login and authoring flow should reuse them rather than introduce a second design system.

**Alternatives considered**: A new component library would increase scope and styling inconsistency without improving the authorization behavior.
