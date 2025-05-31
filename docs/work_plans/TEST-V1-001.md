# Work Plan: TEST-V1-001 - Agent Simulation Test Framework Setup

*   **Task ID**: TEST-V1-001
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 2 Days
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Testing framework placeholder - Jest/Vitest), AGENT-V1-STORY-001, AGENT-V1-PLAN-001 (Flows defined), Genkit CLI (`genkit start`), Firestore Emulator configured.
*   **Related Docs**: `docs/architecture_v2.md` (Section 10, 13.4), Genkit Testing Documentation.

## Problem Statement

Set up a testing framework to simulate interactions with the deployed Genkit flows running locally via `genkit start` and the Firestore Emulator. This framework should allow defining test scenarios involving sequences of inputs (simulated voice results, text messages, commands) and asserting expected outcomes, state changes in Firestore, and logged events/traces.

## Components Involved

*   Testing Framework (Jest or Vitest)
*   Genkit CLI (`genkit start`)
*   Genkit Testing Utilities (Mocking, trace inspection - if available)
*   Firestore Emulator
*   `firebase-admin` (potentially, for direct emulator interaction/setup/teardown in tests)
*   Test scenario definition files (e.g., YAML, JSON, or directly in test code)
*   Helper functions for interacting with local flow endpoints and emulator.

## Proposed Solution / Design Approach

1.  **Choose Test Runner:** Finalize choice between Jest and Vitest. Set up its configuration.
2.  **Emulator Setup/Teardown:** Implement test setup hooks (e.g., `beforeAll`, `beforeEach` in Jest/Vitest) to:
    *   Start the Firestore Emulator (or ensure it's running).
    *   Clear emulator data before each test suite or test case.
    *   Seed the emulator with necessary initial data for specific test scenarios (e.g., Campaign, WorldState, Ruleset documents) - potentially using `firebase-admin` SDK or Firestore REST API calls.
3.  **Local Flow Interaction:** Implement helper functions to make HTTP requests to the Genkit flows running locally via `genkit start` (typically `http://localhost:3400/...` or similar, need to confirm port/path exposed by Genkit). These helpers should handle sending payloads matching the flow input schemas.
4.  **State Assertion:** Implement helper functions to read data directly from the Firestore Emulator (using `firebase-admin` or REST API) to verify state changes after a flow interaction.
5.  **Trace/Log Assertion (Optional but Recommended):** Explore Genkit's testing capabilities for inspecting traces generated during local runs. If possible, assert that specific traces were created or logs were emitted.
6.  **Scenario Definition:** Define test cases that represent common interaction sequences:
    *   Example: Player sends voice input -> Storyteller processes -> Assert WorldState update and LogEvent creation.
    *   Example: Player rolls dice -> Storyteller processes -> Assert LogEvent and PlannerTask creation.
    *   Example: Planner task created -> Planner flow runs -> Assert PlannerState update and Task status change.
7.  **CI Integration:** Ensure these simulation tests can be run as part of the CI/CD pipeline (requires starting emulator and `genkit start` in CI environment).

## Implementation Checklist

*   [ ] **Setup Test Runner:**
    *   [ ] `npm install --save-dev jest @types/jest ts-jest` (Or Vitest equivalents).
    *   [ ] Configure Jest (`jest.config.js`) or Vitest (`vitest.config.ts`) for TypeScript.
    *   [ ] Add test script to `package.json`: `"test:sim": "jest --config jest.sim.config.js"` (Use separate config if needed).
*   [ ] **Emulator Handling:**
    *   [ ] `npm install --save-dev firebase-admin` (For direct emulator interaction).
    *   [ ] Add scripts to `package.json` to start/stop Firestore emulator (`firebase emulators:start --only firestore`, `kill-port 8080`). Port might differ.
    *   [ ] In test setup file (e.g., `tests/simulation/setup.ts`):
        *   Implement `beforeAll` to potentially start emulator if not running.
        *   Implement `beforeEach` or helper `clearFirestore()` to delete all data from the emulator (using `firebase-admin` or REST API).
        *   Implement helper `seedFirestore(data)` to populate emulator with test data.
        *   Set `FIRESTORE_EMULATOR_HOST` environment variable for Genkit/SDKs to connect to emulator.
*   [ ] **Local Flow Client (`tests/simulation/flowClient.ts`):**
    *   [ ] `npm install axios`
    *   [ ] Get base URL for local Genkit flows (e.g., `http://localhost:3400`).
    *   [ ] Implement `invokeStoryteller(payload)` async function making POST request to the local Storyteller endpoint.
    *   [ ] (Optional) Implement way to trigger Eventarc-based flows like Planner if `genkit start` doesn't handle this automatically (might need direct function call if possible or rely on emulator writes).
*   [ ] **Firestore Assertion Helpers (`tests/simulation/firestoreVerifier.ts`):**
    *   [ ] Use `firebase-admin` initialized for the emulator host.
    *   [ ] Implement `getFirestoreDoc(path)` async function.
    *   [ ] Implement `listFirestoreCollection(path)` async function.
*   [ ] **Genkit Trace Inspection (Explore):**
    *   [ ] Investigate if Genkit provides APIs or hooks to access/assert trace data during local runs.
*   [ ] **Write Test Scenarios (`tests/simulation/*.sim.test.ts`):**
    *   [ ] Create test files using Jest/Vitest syntax.
    *   [ ] Use setup hooks (`beforeEach`, `afterEach`).
    *   [ ] Define `it(...)` blocks for specific scenarios.
    *   [ ] Inside tests: Seed data -> Invoke flow(s) -> Verify Firestore state changes -> (Optional) Verify traces/logs.
*   [ ] **CI Integration:**
    *   [ ] Update `.github/workflows/ci.yaml` `build_and_test` job (or add separate job):
        *   Start Firestore emulator (`npm run start:emulator &`).
        *   Start Genkit locally (`npm run genkit:start &`). Wait for it to be ready.
        *   Run the simulation tests (`npm run test:sim`).
        *   Stop emulator/Genkit processes.

## Verification Steps

*   [ ] Firestore emulator starts and clears correctly via test setup.
*   [ ] Test data can be seeded into the emulator.
*   [ ] Helper function can successfully call the locally running Storyteller flow.
*   [ ] Helper functions can successfully read data from the emulator.
*   [ ] Basic test scenarios pass locally:
    *   Flow invocation modifies Firestore state as expected.
    *   Flow invocation creates expected documents (LogEvents, PlannerTasks).
*   [ ] Simulation tests run successfully within the CI pipeline.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Exact local endpoint URLs exposed by `genkit start` for flows.
*   How to reliably trigger and test Eventarc-triggered flows (Planner) locally? Does `genkit start` + emulator handle this, or does it require manual invocation or direct function calls?
*   Availability and ease of use of Genkit trace inspection utilities for testing.
*   Complexity of running emulators and `genkit start` reliably within CI.

## Acceptable Tradeoffs

*   Focusing tests on Storyteller flow initially if testing Planner trigger locally is too complex.
*   Relying on Firestore state assertions primarily, with trace/log verification as optional enhancement.
*   Using `firebase-admin` for emulator interaction, adding a non-dev dependency just for testing.
