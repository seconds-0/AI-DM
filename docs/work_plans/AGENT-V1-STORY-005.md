# Work Plan: AGENT-V1-STORY-005 - Implement Planner Interaction Logic (Storyteller)

*   **Task ID**: AGENT-V1-STORY-005
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-STORY-001 (Flow structure), AGENT-V1-STORY-003 (Reading PlannerState), AGENT-V1-STORY-004 (Writing PlannerTasks), CORE-V1-002 (Schemas: PlannerState, PlannerTask), INFRA-V1-002 (Firestore, Eventarc placeholder setup).
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, Genkit documentation.

## Problem Statement

Implement the logic within the Storyteller flow to interact with the Planner agent asynchronously via Firestore. This involves reading the latest suggestions from the `PlannerState` document and writing new tasks to the `plannerTasks` subcollection when deeper analysis is required.

## Components Involved

*   `src/flows/storyteller.flow.ts` (Update flow logic)
*   Genkit Firestore Utilities (`retrieve`, `save`)
*   `src/data/schemas.ts` (Interfaces: `PlannerState`, `PlannerTask`)
*   Firestore Database (`planner_states` collection, `plannerTasks` subcollection)

## Proposed Solution / Design Approach

1.  **Reading Planner State:**
    *   The `PlannerState` document is already being read as part of AGENT-V1-STORY-003.
    *   Incorporate the information from the loaded `plannerState` (e.g., `plotVectors`, `npcIntents`) into the context provided to the Storyteller's Gemini model (AGENT-V1-STORY-002) prompts. This allows the LLM to leverage the Planner's asynchronous analysis.
2.  **Triggering Planner Tasks:**
    *   Identify conditions within the Storyteller flow where deeper, non-real-time analysis by the Planner would be beneficial. Examples:
        *   A significant plot point is reached.
        *   A major unexpected player action occurs.
        *   A certain amount of in-game time passes or number of turns occur.
        *   A specific NPC interaction warrants deeper planning of their reaction.
    *   When such a condition is met, construct a `PlannerTask` object.
    *   Define the `taskType` (e.g., `analyze_scene`, `evolve_world`) and include relevant `context` (e.g., recent event IDs, character/NPC IDs involved, specific questions for the planner).
    *   Set the initial `status` to `pending`.
    *   Generate a unique ID for the task.
    *   Use the `save` utility to write the new `PlannerTask` document to the `/campaigns/{campaignId}/plannerTasks/{taskId}` subcollection.
    *   This Firestore write will trigger the Eventarc trigger (defined in INFRA-V1-002), invoking the Planner flow (to be implemented in Phase 4).

## Implementation Checklist

*   [ ] **Update `src/flows/storyteller.flow.ts`:**
    *   [ ] Import `save` from `@genkit-ai/core`.
    *   [ ] Import `PlannerTask` interface from `src/data/schemas.ts`.
    *   [ ] Import ID generation utility (if needed).
    *   [ ] **Integrate PlannerState into Context:**
        *   Ensure the `plannerState` object (loaded in STORY-003) is included or referenced in the prompts constructed for the Storyteller's Gemini call (STORY-002). Update prompt templates as needed.
    *   [ ] **Implement Planner Task Trigger Logic:**
        *   Identify points in the flow logic (after LLM response processing, before returning) where a Planner task should be triggered.
        *   `if (conditionForPlannerTask) { ... }` block.
        *   Inside the block:
            *   Construct the `PlannerTask` object (`newTask: PlannerTask = { ... }`). Fill in `createdAt`, `status: 'pending'`, `taskType`, `context`.
            *   `const taskId = generateUniqueId(); // Or Firestore auto-ID`
            *   `const taskPath = \`/campaigns/${payload.campaignId}/plannerTasks/${taskId}\`;`
            *   `logger.info({ taskPath, task: newTask }, 'Creating new planner task');`
            *   `try { await save({ path: taskPath, value: newTask, schema: PlannerTask }); } catch (error) { logger.error({ error, taskPath }, 'Failed to save planner task'); }`
*   [ ] **Testing:**
    *   [ ] **Prerequisite:** Firestore Emulator running. Sample Campaign data exists.
    *   [ ] **Unit Tests:** Mock `save` function. Verify that the task trigger logic calls `save` with the correct path and a valid `PlannerTask` object when specific conditions are met in the flow.
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Invoke the flow with inputs designed to trigger planner tasks.
        *   Verify a new document is created in the `/campaigns/{campaignId}/plannerTasks/` subcollection in the Firestore Emulator.
        *   Verify the created task document has the correct structure and data.
        *   Verify logs show the task creation attempt.
        *   **(Later)** Verify this write triggers the (yet to be implemented) Planner flow via Eventarc (requires emulator support or deployed testing).
    *   [ ] **Integration Tests (Deployed):** Deploy flow. Invoke to trigger task creation. Verify task document appears in Dev Firestore. Verify Eventarc trigger fires (check Cloud Audit Logs or Planner function logs later).

## Verification Steps

*   [ ] `PlannerState` data is successfully incorporated into prompts sent to the Storyteller's Gemini model (verify via logs).
*   [ ] Flow correctly identifies conditions requiring Planner input.
*   [ ] Flow successfully creates new `PlannerTask` documents in the correct Firestore subcollection using `save`.
*   [ ] Created task documents have the correct status (`pending`), type, and contextual information.
*   [ ] Flow logs indicate successful task creation.
*   [ ] Flow handles errors during task creation gracefully.
*   [ ] Unit tests mocking `save` pass.
*   [ ] Local and deployed integration tests confirm successful task document creation in Firestore.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Specific conditions for triggering planner tasks (needs refinement based on gameplay feel).
*   Detailed structure of the `context` field within `PlannerTask` (evolve as needed).
*   Reliability of Eventarc triggering from Firestore writes (verify during Planner implementation/testing).

## Acceptable Tradeoffs

*   Simple trigger conditions initially (e.g., trigger every 5 turns).
*   Basic context included in tasks initially.
