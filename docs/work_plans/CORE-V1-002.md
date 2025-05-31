# Work Plan: CORE-V1-002 - Core Firestore Schema Definitions

*   **Task ID**: CORE-V1-002
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 0.5 Days
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Project structure, TS).
*   **Related Docs**: `docs/architecture_v2.md` (Section 6), `docs/product_requirements_v2.md` (Section 7)

## Problem Statement

Define the core TypeScript interfaces representing the structure of documents stored in Firestore. These schemas provide type safety and clarity when interacting with Firestore data using native Genkit Firestore utilities.

## Components Involved

*   `src/data/schemas.ts` (New module)
*   TypeScript Interfaces

## Proposed Solution / Design Approach

1.  Create a dedicated module `src/data/schemas.ts` to hold all Firestore document interfaces.
2.  Define TypeScript interfaces for each primary Firestore collection and key nested objects, based on the high-level descriptions in the PRD and Architecture documents.
3.  Use clear, descriptive names for interfaces and properties.
4.  Employ TypeScript features like optional properties (`?`), unions (`|`), and potentially utility types (`Partial`, `Readonly`) where appropriate.
5.  Keep the schemas focused on data structure; business logic resides in flows.
6.  Export all defined interfaces for use throughout the application (especially within Genkit flows when using Firestore utilities).

## Implementation Checklist

*   [ ] Create the file `src/data/schemas.ts`.
*   [ ] Define and export interfaces based on PRD/Architecture Section 7/6:
    *   [ ] `FirebaseTimestamp` (Type alias for Firestore Timestamp if needed explicitly, or use `Timestamp` from `firebase-admin/firestore` if that library is imported for types only).
    *   [ ] `Campaign`:
        *   `id`: string (Document ID)
        *   `name`: string
        *   `gmPersonaPrompt`: string
        *   `scenarioBrief`: string
        *   `rulesetId`: string
        *   `playerIds`: string[]
        *   `status`: 'preparing' | 'running' | 'paused' | 'completed'
        *   `createdAt`: FirebaseTimestamp
        *   `updatedAt`: FirebaseTimestamp
        *   `worldStateId`: string (Link)
        *   `sessionLogId`: string (Link)
        *   `plannerStateId`: string (Link)
        *   `config?`: Record<string, any> (Optional extra config)
    *   [ ] `Ruleset`:
        *   `id`: string
        *   `name`: string
        *   `description`: string
        *   `mechanics`: Record<string, any> (JSON definition of rules)
    *   [ ] `Character` (Likely nested within WorldState):
        *   `id`: string
        *   `name`: string
        *   `playerId`: string
        *   `description`: string
        *   `inventory`: string[] | Record<string, any>
        *   `stats`: Record<string, number | string>
        *   `knownInfoHashes?`: string[] (Hashes of known facts/events)
    *   [ ] `NPC` (Likely nested within WorldState):
        *   `id`: string
        *   `name`: string
        *   `description`: string
        *   `initialKnowledge?`: string[]
        *   `stats?`: Record<string, number | string>
    *   [ ] `WorldState`:
        *   `id`: string
        *   `campaignId`: string
        *   `facts`: string[]
        *   `locations`: Record<string, { description: string; npcsPresent?: string[] }>
        *   `factions`: Record<string, { description: string; disposition: string }>
        *   `characters`: Record<string, Character> // Map characterId -> Character
        *   `npcs`: Record<string, NPC> // Map npcId -> NPC
        *   `lastUpdatedAt`: FirebaseTimestamp
    *   [ ] `SessionLog` (Metadata Document):
        *   `id`: string
        *   `campaignId`: string
        *   `startedAt`: FirebaseTimestamp
        *   `endedAt?`: FirebaseTimestamp
        *   `summary?`: string
        *   `costEstimate?`: number
    *   [ ] `LogEvent` (Stored in `events` subcollection under SessionLog):
        *   `id`: string (Event ID)
        *   `timestamp`: FirebaseTimestamp
        *   `type`: 'message' | 'voice' | 'roll' | 'state_change' | 'gm_narration' | 'npc_dialogue' | 'system'
        *   `userId?`: string (If player-initiated)
        *   `characterId?`: string
        *   `npcId?`: string
        *   `content`: string | Record<string, any> (Text message, roll details, voice transcript summary, state diff)
        *   `source`: 'player' | 'gm' | 'system'
    *   [ ] `PlannerTask` (Stored in `plannerTasks` subcollection under Campaign):
        *   `id`: string
        *   `createdAt`: FirebaseTimestamp
        *   `status`: 'pending' | 'running' | 'completed' | 'failed'
        *   `taskType`: 'analyze_scene' | 'evolve_world' | 'npc_planning'
        *   `context`: Record<string, any> (e.g., related event IDs, focus area)
        *   `resultRef?`: string (Optional link back to PlannerState analysis)
    *   [ ] `PlannerState`:
        *   `id`: string
        *   `campaignId`: string
        *   `lastUpdatedAt`: FirebaseTimestamp
        *   `plotVectors?`: any[]
        *   `npcIntents?`: Record<string, string>
        *   `worldEvolutions?`: any[]
        *   `analysisLog?`: string[] // Log of recent analyses
*   [ ] Add comments explaining fields where necessary.
*   [ ] Ensure all interfaces are exported.
*   [ ] Commit the `schemas.ts` file.

## Verification Steps

*   [ ] **Command:** `ls src/data/schemas.ts` - **Expected:** Command succeeds, file exists.
*   [ ] **Command:** `npm run build` - **Expected:** Completes with exit code 0, indicating no TypeScript errors in schema definitions or exports.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Need refinement on the exact structure of `Ruleset.mechanics`, `PlannerState` fields, complex `LogEvent.content` types as implementation progresses.
*   Consider using more specific types (e.g., branded types) for IDs? (Keep as string for simplicity initially).

## Acceptable Tradeoffs

*   Some schema details (especially within `Record<string, any>`) might be refined during implementation.
*   Not using dedicated Firestore types library initially if basic TS interfaces suffice with Genkit utils.
