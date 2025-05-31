# Work Plan: TEST-V1-002 - Implement Unit Tests

*   **Task ID**: TEST-V1-002
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 2 Days
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Testing framework placeholder), CORE-V1-001, CORE-V1-002, DISCORD-V1-*, AGENT-V1-* (Modules/Code to test).
*   **Related Docs**: `docs/architecture_v2.md` (Section 13.4), `docs/STYLE_GUIDE.md` (Testing Conventions).

## Problem Statement

Implement comprehensive unit tests for individual functions, classes, and modules across the codebase. This ensures that core logic within utilities, Discord bot handlers, and Genkit flow helper functions behaves correctly in isolation, independent of external services or complex integrations.

## Components Involved

*   Testing Framework (Jest or Vitest)
*   Code Modules (`src/utils`, `src/config`, `src/discord`, `src/flows` helper functions)
*   Mocking libraries/features (built into Jest/Vitest)

## Proposed Solution / Design Approach

1.  **Identify Testable Units:** Review the codebase (`src/`) and identify functions or classes with non-trivial logic that can be tested in isolation. Focus on:
    *   Utility functions (e.g., ID generation, data transformation).
    *   Config loader logic (mocking env vars, secrets).
    *   Discord command parsing and payload creation logic (mocking `discord.js` objects).
    *   Discord Live Voice API integration helpers (mocking API client, voice connection).
    *   Storyteller client logic (mocking auth, HTTP calls).
    *   Genkit flow helper functions (e.g., prompt construction logic, state merging logic - mocking `generate`, `retrieve`, `save`, `update`).
2.  **Write Test Cases:** For each unit, create a corresponding test file (e.g., `logger.test.ts`, `commandHandler.test.ts`, `storyteller.flow.test.ts`).
3.  **Use Mocking:** Utilize the testing framework's mocking capabilities (`jest.fn()`, `vi.fn()`, `jest.mock`, `vi.mock`) to replace dependencies (like external API clients, Genkit functions, Firestore utilities, `discord.js` objects) with controlled mocks.
4.  **Arrange, Act, Assert:** Structure tests using the Arrange-Act-Assert pattern:
    *   **Arrange:** Set up mocks, define input data, instantiate classes.
    *   **Act:** Call the function or method being tested.
    *   **Assert:** Use assertion functions (`expect(...)`) to verify that the output, return value, or mock function calls match expectations.
5.  **Coverage:** Aim for good test coverage of critical business logic, complex conditions, and common error paths.
6.  **CI Integration:** Ensure unit tests are run automatically as part of the CI pipeline (`build_and_test` job).

## Implementation Checklist

*   [ ] **Testing Framework Setup:** (Done in TEST-V1-001, ensure config is suitable for unit tests).
*   [ ] **Write Unit Tests for `src/utils`:**
    *   [ ] Test logger creation/configuration (if applicable).
    *   [ ] Test any other utility functions.
*   [ ] **Write Unit Tests for `src/config`:**
    *   [ ] Test `configSchema` validation.
    *   [ ] Test `loadConfig` function (mock `process.env`, `SecretManagerServiceClient`, `dotenv`). Verify correct loading order, secret fetching, and validation.
*   [ ] **Write Unit Tests for `src/discord`:**
    *   [ ] Test command registration payload generation (`commandHandler.ts`).
    *   [ ] Test command handler logic (`commandHandler.ts` - mock interaction object, dice library, `callStorytellerFlow`).
    *   [ ] Test Live Voice API handler helpers (`liveVoiceHandler.ts` - mock `@discordjs/voice`, Live Voice API client, `callStorytellerFlow`).
    *   [ ] Test Storyteller client (`storytellerClient.ts` - mock `google-auth-library`, `axios`).
    *   [ ] Test basic event handlers in `bot.ts` (mock client, logger).
*   [ ] **Write Unit Tests for `src/flows` (Helper Functions):**
    *   [ ] Test prompt construction logic (verify output based on different inputs/state, mock state objects).
    *   [ ] Test logic for determining state changes based on LLM response (mock LLM response).
    *   [ ] Test logic for creating `LogEvent` or `PlannerTask` objects.
    *   **Note:** Do not unit test the main Genkit flow functions directly end-to-end; test the helper functions they call. The main flow structure is tested via simulation/integration tests.
*   [ ] **Refine Test Scripts:** Ensure `npm run test` (or similar) targets only unit tests.
*   [ ] **Run Tests:** Execute tests locally and ensure they pass.
*   [ ] **Integrate with CI:** Verify unit tests run and pass in the `build_and_test` job of the CI pipeline.
*   [ ] **Coverage Reporting:** Configure test runner to generate coverage reports (optional but recommended).

## Verification Steps

*   [ ] Unit tests exist for major utility functions, bot handlers, and flow helper logic.
*   [ ] Tests effectively mock external dependencies.
*   [ ] Tests cover success paths, failure paths, and edge cases where applicable.
*   [ ] All unit tests pass locally (`npm run test`).
*   [ ] Unit tests pass as part of the CI pipeline.
*   [ ] Code coverage meets target goals (if set).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Complexity of accurately mocking certain dependencies (e.g., complex `discord.js` objects, Genkit context).
*   Defining clear boundaries for what constitutes a "unit" vs. integration test, especially for flow logic.

## Acceptable Tradeoffs

*   Not aiming for 100% code coverage, but focusing on critical paths and complex logic.
*   Some complex mocking scenarios might be simplified.
*   Testing flow helpers rather than the entire `defineFlow` function wrapper itself in unit tests.
