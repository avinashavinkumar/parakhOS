<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.0.1
- Modified principles: none (new constitution scaffold adopted)
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none
-->

# parakhOS Constitution

## Core Principles

### I. Code Quality Is Non-Negotiable
Every feature, fix, and refactor MUST be readable, maintainable, and aligned with the project’s architecture. Code MUST be small, explicit, and easy to reason about; duplication, dead code, and unexplained complexity are rejected unless they are justified with a clear technical reason. Reviewers MUST call out unclear naming, hidden side effects, and brittle logic before merge.

### II. Test-First Validation Is Mandatory
All user-visible behavior and bug fixes MUST be covered by automated tests before implementation is considered complete. The project follows a red-to-green workflow: write or update a failing test, confirm it fails for the right reason, implement the fix, then verify the targeted test suite passes. Regression tests MUST be kept for previously fixed defects and critical flows.

### III. User Experience Must Be Consistent and Accessible
The interface MUST remain predictable across screens, interactions, and states. Shared patterns for layout, feedback, motion, wording, and accessibility MUST be reused instead of reinventing local conventions. Changes MUST preserve or improve clarity, usability, and inclusion; when a design choice impacts users, the team MUST validate it against the intended experience rather than accepting inconsistency.

### IV. Performance Is a Product Requirement
Features MUST be designed for responsiveness, efficient resource use, and predictable behavior under typical workloads. Performance regressions are treated as defects; teams MUST measure before and after major changes, avoid unnecessary re-rendering and repeated work, and prefer efficient data access patterns. If a tradeoff is required, the justification MUST be documented and validated with measurable impact.

### V. Simplicity and Maintainability Win Over Cleverness
The team MUST favor straightforward solutions that are easier to test, debug, and extend. Complex abstractions, hidden dependencies, and clever shortcuts are not allowed without clear justification and review. If a solution cannot be explained clearly in code and documentation, it is not ready to be merged.

## Quality Standards

The project MUST maintain a baseline of code health through consistent linting, formatting, and review practices. Contributors MUST keep functions focused, naming clear, and error handling explicit; silent failures are not acceptable. Documentation MUST be updated when behavior, interfaces, or user flows change, and code reviews MUST verify the correctness, readability, and maintainability of the work being introduced.

## Delivery Workflow

Every change MUST pass the project’s required validation steps before release. This includes the relevant automated tests, lint and build checks, and a review that confirms compliance with this constitution. Work that changes user experience, performance-sensitive behavior, or critical flows MUST include evidence from testing and review to demonstrate the impact and risk are understood.

## Governance

This constitution governs development decisions across the project and supersedes ad hoc preferences or undocumented exceptions. Amendments require written justification, review by maintainers, and explicit documentation of the impact on implementation and testing expectations. Any deviation from these principles MUST be documented, reviewed, and treated as a temporary exception rather than the new default.

All pull requests and change reviews MUST verify compliance with the quality, testing, UX, and performance standards in this document. Complexity, performance tradeoffs, and UX decisions MUST be justified with evidence, not opinion alone. When governance conflicts arise, the stricter principle applies until the constitution is amended.

**Version**: 1.0.1 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-19
