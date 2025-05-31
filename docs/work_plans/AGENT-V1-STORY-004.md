# Work Plan: AGENT-V1-STORY-004 - Integrate Native Genkit Firestore Utilities for State Writing

*   **Task ID**: AGENT-V1-STORY-004
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-STORY-001 (Flow structure), AGENT-V1-STORY-002 (LLM integration to suggest state changes), AGENT-V1-STORY-003 (State reading), CORE-V1-002 (Schema Interfaces), INFRA-V1-002 (Firestore DB, SA permissions).
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, Genkit documentation (`@genkit-ai/firebase`, Firestore utilities).

## Problem Statement

Integrate native Genkit Firestore utilities (`save`, `update`) into the Storyteller flow to persist changes to the game state (WorldState, Character/NPC updates) and to log significant events (LogEvent documents) based on the outcomes of player actions and LLM processing.

## Components Involved

*   `src/flows/storyteller.flow.ts` (Update flow logic)
*   `@genkit-ai/firebase` plugin (Firestore utilities)
*   `save`, `update` functions from Genkit
*   `src/data/schemas.ts` (Interfaces: WorldState, LogEvent, etc.)
*   Firestore Database

## Proposed Solution / Design Approach

1.  **Identify State Changes:** After processing player input and receiving suggestions from the Gemini model (AGENT-V1-STORY-002), determine the necessary updates to the game state. This might involve modifying facts, character inventories, NPC locations, etc., within the `WorldState` object loaded in AGENT-V1-STORY-003.
2.  **Determine Events to Log:** Identify key events that should be recorded chronologically in the `SessionLog`'s `events` subcollection (e.g., player message, voice interaction summary, dice roll, GM narration, significant state changes).
3.  **Implement State Updates:**
    *   Modify the in-memory `worldState` object (retrieved in STORY-003) based on the LLM output or game logic.
    *   Use `await update({ path: worldStatePath, value: updatedWorldState, schema: WorldState })` to save the entire modified `WorldState` document. Include `updateMask` if optimizing writes to specific fields becomes necessary later.
    *   Add/update the `lastUpdatedAt` timestamp on the `WorldState`.
4.  **Implement Event Logging:**
    *   For each event to be logged, construct a `LogEvent` object conforming to the `LogEvent` schema (from CORE-V1-002).
    *   Generate a unique ID for the event document (e.g., using a timestamp + random suffix or a dedicated ID generator).
    *   Use `await save({ path: \`/session_logs/${campaign.sessionLogId}/events/${eventId}\`, value: logEventData, schema: LogEvent })` to write the new event document to the subcollection.
5.  **Error Handling:** Wrap `save` and `update` calls in try/catch blocks. Log any errors encountered during Firestore writes.
6.  **Placement:** Perform state updates and event logging *after* the core logic and LLM calls are complete, just before returning the final response to the Bot.

## Implementation Checklist

*   [ ] **Configuration:**
    *   [ ] Verify `firebase()` plugin is configured in `genkit.config.ts`.
    *   [ ] Ensure Storyteller SA has `roles/datastore.user` permission.
*   [ ] **Update `src/flows/storyteller.flow.ts`:**
    *   [ ] `import { save, update } from '@genkit-ai/core';`
    *   [ ] Import necessary schema interfaces (`WorldState`, `LogEvent`).
    *   [ ] Import ID generation utility if needed (e.g., `nanoid` or similar, or use Firestore auto-IDs if `save` supports it directly on subcollections).
    *   [ ] **After LLM response processing:**
        *   [ ] **Determine State Changes:** Add logic to parse LLM response or apply game rules to determine modifications needed for the `worldState` object (loaded in STORY-003).
        *   [ ] **Update WorldState:**
            *   `worldState.lastUpdatedAt = Timestamp.now(); // Or serverTimestamp()`
            *   `const worldStatePath = \`/world_states/${campaign.worldStateId}\`;`
            *   `logger.info(\`Updating world state: ${worldStatePath}\`);`
            *   `await update({ path: worldStatePath, value: worldState, schema: WorldState });`
        *   [ ] **Log Events:**
            *   Identify points where events should be logged (e.g., log player input, log GM response, log dice roll event).
            *   Construct `LogEvent` objects for each.
            *   `const eventId = generateUniqueId(); // Implement helper`
            *   `const eventPath = \`/session_logs/${campaign.sessionLogId}/events/${eventId}\`;`
            *   `logger.info(\`Saving log event: ${eventPath}\`);`
            *   `await save({ path: eventPath, value: logEvent, schema: LogEvent });`
    *   [ ] **Error Handling:** Wrap Firestore write operations (`save`, `update`) in try/catch blocks. Log errors.
*   [ ] **Testing:**
    *   [ ] **Prerequisite:** Firestore Emulator running, sample Campaign/WorldState/SessionLog data exists.
    *   [ ] **Unit Tests:** Mock the `save` and `update` functions to verify they are called with the correct paths and data based on flow logic.
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Invoke the flow via the UI with inputs designed to trigger state changes and event logging.
        *   Verify Firestore Emulator data shows the `WorldState` document being updated (check `lastUpdatedAt` and modified fields).
        *   Verify new documents are created in the `events` subcollection with the expected structure.
        *   Verify flow logs show successful write operations.
        *   Test error handling by simulating Firestore write failures (if possible via mocks or emulator controls).
    *   [ ] **Integration Tests (Deployed):** Deploy flow. Invoke via `curl`/Postman/Bot. Verify data updates in the Dev project Firestore.

## Verification Steps

*   [ ] Flow successfully updates the `WorldState` document in Firestore using `update`.
*   [ ] Flow successfully creates new `LogEvent` documents in the correct subcollection using `save`.
*   [ ] Written data conforms to the defined TypeScript schemas.
*   [ ] Flow logs indicate successful Firestore write operations.
*   [ ] Flow handles Firestore write errors gracefully (logs error, potentially affects response).
*   [ ] Unit tests mocking `save`/`update` pass.
*   [ ] Local and deployed integration tests confirm successful Firestore writes.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Best strategy for generating unique `eventId`s? (Timestamp + random suffix, `nanoid`, or let Firestore auto-generate if `save` allows?).
*   How to handle potential race conditions if multiple flow instances try to update the same `WorldState` simultaneously? (Use transactions via `runTransaction` from `@google-cloud/firestore` imported into Genkit, or accept last-write-wins for V1 if contention is unlikely). Assume last-write-wins for V1 simplicity.
*   Optimizing writes: Use `update` with specific fields instead of overwriting the whole `WorldState`? (Keep full update for V1 simplicity unless performance dictates otherwise).

## Acceptable Tradeoffs

*   Using `update` to write the entire `WorldState` document instead of targeted field updates initially.
*   Simple unique ID generation for events.
*   No explicit transaction handling for state updates in V1 (accepting last-write-wins).
