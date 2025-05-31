# Work Plan: AGENT-V1-STORY-003 - Integrate Native Genkit Firestore Utilities for State Reading

*   **Task ID**: AGENT-V1-STORY-003
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-STORY-001 (Flow structure), CORE-V1-002 (Schema Interfaces defined), INFRA-V1-002 (Firestore DB exists, SA with Firestore permissions), Genkit Firebase Plugin configured.
*   **Related Docs**: `docs/architecture_v2.md` (Section 6, 7), `docs/product_requirements_v2.md` (Section 7), Genkit documentation (`@genkit-ai/firebase`, Firestore utilities).

## Problem Statement

Integrate native Genkit Firestore utilities (`retrieve`) into the Storyteller flow to read necessary game state data from Firestore before processing input or calling the LLM. This includes fetching campaign data, world state, character information, rulesets, and potentially recent events or planner state.

## Components Involved

*   `src/flows/storyteller.flow.ts` (Update flow logic)
*   `@genkit-ai/firebase` plugin (Firestore utilities)
*   `retrieve` function from Genkit
*   `src/data/schemas.ts` (Interfaces for type safety)
*   Firestore Database

## Proposed Solution / Design Approach

1.  **Identify Required Data:** Determine what state information is needed at the beginning of the Storyteller flow to process different input types (e.g., for Gemini prompts, rule lookups):
    *   Campaign details (persona prompts, ruleset ID).
    *   World State (facts, locations, NPCs, characters).
    *   Ruleset details (based on `campaign.rulesetId`).
    *   Planner State (recent suggestions/analysis).
    *   Potentially recent `LogEvents` for short-term context.
2.  **Import Firestore Utilities:** Ensure the `firebase` plugin is configured in `genkit.config.ts` and import `retrieve` from `@genkit-ai/core`.
3.  **Implement State Loading:**
    *   At the beginning of the `storytellerMain` flow function (after initial input logging), use `await retrieve()` calls to fetch the required documents.
    *   Provide the document path (e.g., `/campaigns/${payload.campaignId}`).
    *   Specify the expected data type using the imported TypeScript interfaces from `schemas.ts` (e.g., `await retrieve({ path: campaignPath, schema: Campaign })`).
    *   Fetch linked documents based on IDs (e.g., fetch `WorldState` using `campaign.worldStateId`).
    *   Fetch the relevant `Ruleset` document.
    *   Fetch the `PlannerState` document.
4.  **Context Building:** Combine the loaded state data into a context object or make it available for subsequent logic (like prompt building in AGENT-V1-STORY-002).
5.  **Error Handling:** Wrap `retrieve` calls in try/catch blocks or handle potential errors (e.g., document not found) appropriately. Log errors.
6.  **Logging:** Log successfully retrieved data summaries (e.g., document IDs fetched) for debugging.

## Implementation Checklist

*   [ ] **Configuration:**
    *   [ ] Verify `firebase()` plugin is configured in `genkit.config.ts`.
    *   [ ] Ensure Storyteller SA (INFRA-V1-002) has `roles/datastore.user` permission.
    *   [ ] Ensure Firestore database exists and is accessible.
*   [ ] **Update `src/flows/storyteller.flow.ts`:**
    *   [ ] `import { retrieve } from '@genkit-ai/core';`
    *   [ ] Import necessary schema interfaces (`Campaign`, `WorldState`, `Ruleset`, `PlannerState`, etc.) from `src/data/schemas.ts`.
    *   [ ] **Inside the main flow function (after input logging):**
        *   [ ] Define document paths based on `payload.campaignId`.
        *   [ ] `try { ... } catch (error) { ... }` block for data fetching.
        *   [ ] `logger.info(\`Fetching campaign: ${payload.campaignId}\`);`
        *   [ ] `const campaign = await retrieve({ path: \`/campaigns/${payload.campaignId}\`, schema: Campaign });`
        *   [ ] `if (!campaign) { throw new Error(\`Campaign ${payload.campaignId} not found\`); }`
        *   [ ] `logger.info(\`Fetching world state: ${campaign.worldStateId}\`);`
        *   [ ] `const worldState = await retrieve({ path: \`/world_states/${campaign.worldStateId}\`, schema: WorldState });`
        *   [ ] `logger.info(\`Fetching ruleset: ${campaign.rulesetId}\`);`
        *   [ ] `const ruleset = await retrieve({ path: \`/rulesets/${campaign.rulesetId}\`, schema: Ruleset });`
        *   [ ] `logger.info(\`Fetching planner state: ${campaign.plannerStateId}\`);`
        *   [ ] `const plannerState = await retrieve({ path: \`/planner_states/${campaign.plannerStateId}\`, schema: PlannerState });`
        *   [ ] (Add fetching for recent events if needed later).
        *   [ ] Log success: `logger.debug({ campaign, worldState /* ... */ }, 'Successfully retrieved state');`
        *   [ ] **Pass loaded data** to subsequent logic (e.g., prompt building in STORY-002).
        *   [ ] Handle errors in catch block (log detailed error, potentially return error response).
*   [ ] **Testing:**
    *   [ ] **Prerequisite:** Manually create sample data (Campaign, WorldState, Ruleset, PlannerState documents) in the Firestore Emulator or Dev project Firestore matching the schemas.
    *   [ ] **Unit Tests:** Mock the `retrieve` function to test flow logic under different data conditions (data found, data not found, errors).
    *   [ ] **Integration Tests (Local):** Use `genkit start` (which should use Firestore Emulator if configured). Invoke the flow via the UI.
        *   Verify flow logs show successful retrieval of data.
        *   Verify flow logs show appropriate errors if data is missing.
        *   Verify flow proceeds with the retrieved data (check logs from subsequent steps like prompt building).
    *   [ ] **Integration Tests (Deployed):** Deploy the updated flow. Invoke via `curl`/Postman. Verify Cloud Logging shows successful data retrieval or errors.

## Verification Steps

*   [ ] Flow successfully retrieves required documents from Firestore using `retrieve` when invoked.
*   [ ] Type safety is enforced using the defined schemas.
*   [ ] Flow logs indicate successful data fetching.
*   [ ] Flow handles cases where documents are not found gracefully (logs error, returns error response).
*   [ ] Retrieved data is correctly used in subsequent flow steps (e.g., included in LLM prompts - check logs from STORY-002).
*   [ ] Unit tests mocking `retrieve` pass.
*   [ ] Local and deployed integration tests confirm successful Firestore reads.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Optimal way to structure multiple `retrieve` calls (sequentially vs. `Promise.all` if performance becomes critical - start sequentially for simplicity).
*   Exact error handling strategy for missing critical data (e.g., Campaign not found - should immediately fail).

## Acceptable Tradeoffs

*   Fetching all required state at the beginning, even if some parts aren't used in every code path (simpler than conditional fetching).
*   Sequential reads initially.
