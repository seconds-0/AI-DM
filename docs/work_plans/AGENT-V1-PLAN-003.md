# Work Plan: AGENT-V1-PLAN-003 - Integrate Native Genkit Firestore Utilities for Reading Context (Planner)

*   **Task ID**: AGENT-V1-PLAN-003
*   **Phase**: 4 - Planner Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-PLAN-001 (Flow structure, task parsing), CORE-V1-002 (Schema Interfaces), INFRA-V1-002 (Firestore DB, SA permissions), Genkit Firebase Plugin configured.
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, Genkit documentation (`@genkit-ai/firebase`).

## Problem Statement

Implement the logic within the Planner flow to read necessary context data from Firestore using native Genkit Firestore utilities (`retrieve`, potentially `list`). This data (WorldState, Session Logs/Events) is required to provide sufficient context to the Gemini model for its analysis based on the triggering PlannerTask.

## Components Involved

*   `src/flows/planner.flow.ts` (Update flow logic)
*   `@genkit-ai/firebase` plugin (Firestore utilities)
*   `retrieve`, `list` (if needed) functions from Genkit
*   `src/data/schemas.ts` (Interfaces: WorldState, LogEvent, Campaign, etc.)
*   Firestore Database

## Proposed Solution / Design Approach

1.  **Identify Required Context:** Based on the `PlannerTask` type and its context field, determine what additional information needs to be fetched from Firestore for the analysis prompt (AGENT-V1-PLAN-002). This typically includes:
    *   The current `WorldState` document associated with the campaign.
    *   Relevant recent `LogEvent` documents from the session log (e.g., last N events, events related to entities mentioned in the task context).
    *   Possibly the main `Campaign` document for global context.
2.  **Implement Context Fetching:**
    *   After parsing the `PlannerTask` data (in PLAN-001), use `await retrieve()` to fetch the necessary documents (Campaign, WorldState).
    *   To fetch recent events from the `events` subcollection:
        *   Use `query()` and `list()` from `@genkit-ai/firebase/firestore` (or potentially core Genkit if simplified helpers exist) to construct and execute a Firestore query.
        *   The query should target the correct `events` subcollection path (`/session_logs/{logId}/events`).
        *   Apply filters (e.g., based on timestamps, involved entities mentioned in task context) and limits (e.g., `limit(20)`) to retrieve only relevant recent events.
        *   Order by timestamp descending (`orderBy('timestamp', 'desc')`).
3.  **Assemble Context:** Combine the triggering `PlannerTask` details, the fetched `WorldState`, recent `LogEvents`, and any other relevant data into a consolidated context object or string suitable for injection into the Gemini prompt.
4.  **Error Handling & Logging:** Add error handling for `retrieve`/`list` calls and log fetched data summaries.

## Implementation Checklist

*   [ ] **Configuration:**
    *   [ ] Verify `firebase()` plugin is configured in `genkit.config.ts`.
    *   [ ] Ensure Planner SA has `roles/datastore.user` permission.
*   [ ] **Update `src/flows/planner.flow.ts`:**
    *   [ ] `import { retrieve } from '@genkit-ai/core';`
    *   [ ] `import { query, list } from '@genkit-ai/firebase/firestore';` // Or core if available
    *   [ ] Import necessary schemas (`WorldState`, `LogEvent`, `Campaign`).
    *   [ ] **Inside the main flow function (after parsing PlannerTask):**
        *   [ ] Extract `campaignId` from the task document path or event metadata.
        *   [ ] Fetch Campaign: `const campaign = await retrieve({ path: \`/campaigns/${campaignId}\`, schema: Campaign });` (Needed for WorldState/SessionLog IDs).
        *   [ ] Fetch WorldState: `const worldState = await retrieve({ path: \`/world_states/${campaign.worldStateId}\`, schema: WorldState });`
        *   [ ] Fetch Recent Events:
            *   `const eventsPath = \`/session_logs/${campaign.sessionLogId}/events\`;`
            *   `const recentEventsQuery = query(eventsPath, orderBy('timestamp', 'desc'), limit(20));` // Adjust limit/filters based on task context
            *   `const recentEvents = await list({ query: recentEventsQuery, schema: LogEvent });`
            *   `logger.debug({ count: recentEvents.length }, 'Fetched recent events');`
        *   [ ] **Assemble Context:** Create a context object containing `plannerTask`, `worldState`, `recentEvents`, potentially `campaign` details.
        *   [ ] **Pass Context** to the prompt building logic (PLAN-002).
    *   [ ] **Error Handling:** Add try/catch blocks around Firestore calls. Log errors.
*   [ ] **Testing:**
    *   [ ] **Prerequisite:** Firestore Emulator running. Sample Campaign, WorldState, SessionLog with subcollection of `events`, and PlannerTask data exists.
    *   [ ] **Unit Tests:** Mock `retrieve`, `query`, `list` functions. Verify that context fetching logic calls these mocks correctly based on the input task.
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Trigger the flow (e.g., by writing task to emulator Firestore).
        *   Verify flow logs show successful retrieval of Campaign, WorldState, and LogEvents.
        *   Verify the correct number of events are fetched based on limits/filters.
        *   Verify assembled context (logged before prompt building) contains the expected data.
        *   Test error handling for missing data.
    *   [ ] **Integration Tests (Deployed):** Deploy flow. Trigger via Firestore write. Verify logs in Cloud Logging / Firebase Studio.

## Verification Steps

*   [ ] Flow successfully retrieves Campaign and WorldState documents using `retrieve`.
*   [ ] Flow successfully queries and retrieves recent LogEvent documents from the subcollection using `query` and `list`.
*   [ ] Fetched data is correctly assembled into a context object.
*   [ ] Context object is passed correctly to the LLM prompt generation step (verify via logs in PLAN-002).
*   [ ] Flow handles Firestore read errors gracefully.
*   [ ] Unit tests mocking Firestore utilities pass.
*   [ ] Local and deployed integration tests confirm successful context data fetching from Firestore.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Specific query patterns needed for fetching relevant `LogEvents` based on different `PlannerTask` types (may need refinement).
*   Performance implications of querying/listing events frequently (indexes on timestamp are crucial).
*   Exact API for `query`/`list` within Genkit (assuming `@genkit-ai/firebase/firestore` or similar exists).

## Acceptable Tradeoffs

*   Fetching a fixed number of recent events initially, rather than complex context-based filtering.
*   Not optimizing query performance heavily in V1 unless necessary.
