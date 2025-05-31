# Work Plan: STYLE-V1-001 - Define Project Coding Style Guide

*   **Task ID**: STYLE-V1-001
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 0.5 Days
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (ESLint/Prettier config files exist).
*   **Related Docs**: `docs/architecture_v2.md`

## Problem Statement

Establish and document a clear, consistent coding style guide for the project. This includes TypeScript best practices, formatting conventions, naming conventions, and specific guidelines for writing Genkit flows and utilizing Genkit features effectively.

## Components Involved

*   `docs/STYLE_GUIDE.md` (New document)
*   `.eslintrc.json` (Update rules)
*   `.prettierrc.json` (Verify settings)

## Proposed Solution / Design Approach

1.  Create the `docs/STYLE_GUIDE.md` document.
2.  Document core TypeScript/Node.js conventions (e.g., naming, modules, async/await usage, error handling patterns, logging standards).
3.  Define specific conventions for Genkit development:
    *   Naming and structuring Genkit flows (`defineFlow`).
    *   Input/Output schema definition using Zod (recommended by Genkit).
    *   Consistent use of flow state and context (`FlowState`, context object).
    *   Best practices for using native Genkit utilities (e.g., Firestore helpers, Gemini model calls).
    *   Error handling within flows (using `genkit.trace` and standard error types).
    *   Logging within flows (integrating with the structured logger from CORE-V1-001).
4.  Define testing conventions (unit, integration).
5.  Update `.eslintrc.json` to enforce key style decisions where possible (e.g., naming conventions, promise handling).
6.  Ensure Prettier handles automatic formatting.

## Implementation Checklist

*   [ ] Create `docs/STYLE_GUIDE.md`.
*   [ ] Add sections for:
    *   Introduction/Purpose
    *   General Principles (Readability, Consistency, Simplicity)
    *   Formatting (Handled by Prettier - reference `.prettierrc.json`)
    *   Naming Conventions (variables, functions, classes, interfaces, files, flows, etc. - e.g., camelCase, PascalCase)
    *   TypeScript Best Practices (Type safety, interfaces vs types, avoid `any`, utility types, readonly properties, etc.)
    *   Modules & Imports (Use ES Modules, consistent import paths/aliases if set up)
    *   Async/Await Usage (Prefer async/await, error handling with try/catch)
    *   Error Handling (Standard error types, logging errors, avoid swallowing errors)
    *   Logging (Reference CORE-V1-001 logger, required context fields)
*   [ ] Add **Genkit Conventions** section:
    *   [ ] Flow Definition (`defineFlow` usage, naming, clear input/output schemas with Zod).
    *   [ ] Input/Output Schemas (Use Zod, define schemas near flow or in a shared location, export types).
    *   [ ] Flow Logic (Break down complex flows into smaller, testable functions).
    *   [ ] State Management (Explicitly use FlowState vs. relying on closures).
    *   [ ] Firestore Utilities (Emphasize use of native `retrieve`, `save`, `update`, `delete`. Document discouraged custom module usage).
    *   [ ] Gemini Integration (Use native `generate` calls, manage model selection via config).
    *   [ ] Tracing (`genkit.trace()` usage for key operations, standard metadata: `campaignId`, `userId`, `stepName`).
    *   [ ] Error Handling in Flows (Catch errors, log with trace context, return standardized error responses).
*   [ ] Add Testing Conventions section (Unit test structure, mocking, integration test setup).
*   [ ] Review and update `.eslintrc.json` rules based on the guide (e.g., `@typescript-eslint/naming-convention`, `no-floating-promises`).
*   [ ] Verify `.prettierrc.json` settings align with formatting goals.
*   [ ] Commit the style guide and any linter config changes.

## Verification Steps

*   [ ] **Command:** `ls docs/STYLE_GUIDE.md` - **Expected:** Command succeeds, file exists.
*   [ ] **Manual Check:** Review content of `docs/STYLE_GUIDE.md` for completeness covering key areas.
*   [ ] **Command:** `npm run lint` - **Expected:** Command succeeds, reflecting any new rules from updated `.eslintrc.json` (fix any new errors introduced by rule changes).
*   [ ] **Command:** `npm run format -- --check` - **Expected:** Command succeeds, indicating code adheres to formatting rules.

## Decision Authority

Lead Engineer (self), requires adherence from the team.

## Questions / Uncertainties

*   Specific Zod schema organization strategy (e.g., co-located with flows vs. central schema file)? (Recommendation: Co-locate simple schemas, centralize widely reused ones in `src/data/schemas.ts` or similar).

## Acceptable Tradeoffs

*   Not defining every possible edge case initially; the guide can evolve.
*   Relying on developers to follow conventions not automatically enforceable by linters.
