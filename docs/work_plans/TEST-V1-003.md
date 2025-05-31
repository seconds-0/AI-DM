# Work Plan: TEST-V1-003 - Implement Integration Tests

*   **Task ID**: TEST-V1-003
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 3 Days
*   **Author**: Gemini
*   **Dependencies**: TEST-V1-001 (Simulation framework, Emulator handling), TEST-V1-002 (Unit tests provide base), All core components implemented (Bot structure, Flows defined).
*   **Related Docs**: `docs/architecture_v2.md` (Section 13.4), Genkit Testing Documentation, Firestore Emulator Documentation.

## Problem Statement

Implement integration tests to verify the interactions between different components of the system, focusing primarily on the Genkit flows interacting with the Firestore Emulator and mocked external AI APIs. These tests ensure that flows correctly read from and write to the database and handle responses from mocked services.

## Components Involved

*   Testing Framework (Jest or Vitest)
*   Genkit Flows (`storyteller.flow.ts`, `planner.flow.ts`)
*   Genkit Testing Utilities (Mocking external calls like `generate`)
*   Firestore Emulator
*   Test setup/teardown logic (from TEST-V1-001)
*   Firebase Admin SDK (potentially, for direct verification)

## Proposed Solution / Design Approach

1.  **Leverage Simulation Framework:** Build upon the framework established in TEST-V1-001 (emulator handling, local flow invocation, Firestore verification helpers).
2.  **Mock External AI APIs:** Use Genkit's mocking capabilities (or Jest/Vitest mocks) to replace calls to `generate` (for Gemini) and potentially the Live Voice API client (if interactions need mocking at that level, though less common for *flow* integration tests). Configure mocks to return predefined responses based on the test scenario.
3.  **Focus on Flow <-> Firestore Interaction:** Design tests primarily to validate:
    *   **Storyteller Flow:** Can it correctly read initial state (Campaign, WorldState, Ruleset, PlannerState) from the emulator? Does it correctly write updated WorldState, LogEvents, and PlannerTasks back to the emulator based on mocked LLM input/logic?
    *   **Planner Flow:** Can it correctly read the triggering PlannerTask, WorldState, and LogEvents from the emulator? Does it correctly write updated PlannerState and update the PlannerTask status back to the emulator based on mocked LLM analysis?
4.  **Test Scenarios:** Define integration test cases covering key flow paths:
    *   Storyteller: Process voice input -> Mock LLM response -> Verify WorldState update + LogEvent creation in Emulator.
    *   Storyteller: Process dice roll -> Mock LLM interpretation -> Verify LogEvent + PlannerTask creation in Emulator.
    *   Planner: Trigger flow -> Read context -> Mock LLM analysis -> Verify PlannerState update + Task status update in Emulator.
5.  **Assertions:** Use Firestore verification helpers (from TEST-V1-001) to assert the state of the Firestore Emulator after the flow execution completes.
6.  **CI Integration:** Ensure these integration tests run in the CI pipeline, requiring the Firestore emulator.

## Implementation Checklist

*   [ ] **Testing Framework Setup:** (Ensure framework from TEST-V1-001 is ready).
*   [ ] **Mocking External APIs:**
    *   [ ] Implement test setup logic (e.g., in `beforeEach`) to mock the `generate` function using Jest/Vitest or Genkit's testing utils.
    *   [ ] Configure mocks to return specific, predictable responses needed for different test scenarios.
*   [ ] **Write Integration Test Files (`tests/integration/*.int.test.ts`):**
    *   [ ] Create test files for `storyteller.flow.int.test.ts`, `planner.flow.int.test.ts`.
    *   [ ] Use setup hooks (`beforeEach`, `afterEach`) for emulator clearing and seeding.
*   [ ] **Storyteller Flow Tests:**
    *   [ ] Test Case: Read initial state correctly.
        *   Seed emulator -> Invoke flow -> Assert flow doesn't error on reads.
    *   [ ] Test Case: Process input, update state, log event.
        *   Seed emulator -> Mock `generate` response -> Invoke flow -> Assert `WorldState` update in emulator -> Assert `LogEvent` creation in emulator.
    *   [ ] Test Case: Process dice roll, create planner task.
        *   Seed emulator -> Mock `generate` response -> Invoke flow -> Assert `PlannerTask` creation in emulator.
*   [ ] **Planner Flow Tests:**
    *   [ ] Test Case: Read task and context correctly.
        *   Seed emulator (including Task, WorldState, Events) -> Invoke Planner flow (how? See uncertainties) -> Assert flow reads correct data (verify via logs/mocks if needed).
    *   [ ] Test Case: Process task, update planner state, update task status.
        *   Seed emulator -> Mock `generate` response -> Invoke Planner flow -> Assert `PlannerState` update in emulator -> Assert `PlannerTask` status update in emulator.
*   [ ] **Refine Test Scripts:** Ensure `npm run test:integration` (or similar) targets only integration tests.
*   [ ] **Run Tests:** Execute tests locally against emulator and ensure they pass.
*   [ ] **Integrate with CI:** Verify integration tests run and pass in the CI pipeline (after emulator setup).

## Verification Steps

*   [ ] Integration tests exist covering key flow interactions with Firestore.
*   [ ] External AI API calls (`generate`) are effectively mocked during tests.
*   [ ] Tests correctly verify data reads from and writes to the Firestore emulator.
*   [ ] Tests cover different flow logic paths based on mocked inputs/responses.
*   [ ] All integration tests pass locally.
*   [ ] Integration tests pass as part of the CI pipeline.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   **Triggering Planner Flow Locally:** How to reliably trigger the Eventarc-based Planner flow during local integration tests running against the emulator? May need to manually invoke the exported flow function directly in tests, bypassing Eventarc for the test execution context.
*   **Genkit Mocking Utilities:** Maturity and capability of Genkit's specific utilities for mocking `generate` and potentially other Genkit functions vs. standard Jest/Vitest mocking.

## Acceptable Tradeoffs

*   Manually invoking the Planner flow function in tests instead of relying on Eventarc emulation if the latter is too complex.
*   Focusing assertions primarily on Firestore state changes, as mocking/verifying exact LLM interactions is less the goal here than verifying the flow's integration points.
