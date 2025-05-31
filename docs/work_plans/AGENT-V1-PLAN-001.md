# Work Plan: AGENT-V1-PLAN-001 - Define Planner Genkit Flow - Basic Structure & Deployment

*   **Task ID**: AGENT-V1-PLAN-001
*   **Phase**: 4 - Planner Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Genkit init), INFRA-V1-002 (Placeholder CFn, SA, Eventarc Trigger), CORE-V1-001 (Logger, Config), CORE-V1-002 (Schema Interfaces: PlannerTask), SETUP-V1-002 (CI/CD for deployment), Zod library installed.
*   **Related Docs**: `docs/architecture_v2.md` (Sections 3, 5), `docs/product_requirements_v2.md` (Section 3), Genkit documentation.

## Problem Statement

Define the basic structure of the asynchronous Planner Genkit flow (`planner.flow.ts`). This includes setting up the flow definition triggered by Firestore events via Eventarc, parsing the triggering event data (PlannerTask), integrating logging, and ensuring it can be deployed as a Cloud Function v2.

## Components Involved

*   `src/flows/planner.flow.ts` (New file)
*   Genkit Core (`defineFlow`)
*   Genkit Firebase Plugin (`onFlow` for Firestore trigger)
*   Zod (for input/output schemas - input is Firestore event, output might be simple status)
*   `src/config/config.ts`
*   `src/utils/logger.ts`
*   `src/data/schemas.ts` (Interface: `PlannerTask`)
*   Cloud Functions v2 (Deployment target)
*   Eventarc (Trigger mechanism)
*   Firebase Studio (Deployment/Management interface)

## Proposed Solution / Design Approach

1.  **Create Flow File:** Create `src/flows/planner.flow.ts`.
2.  **Define Input Schema:** Use Zod to define the schema for the expected Firestore event payload delivered by Eventarc for a `document.written` (or `.created`) event on the `plannerTasks` subcollection. This typically includes metadata about the event and the `value` (before/after) of the Firestore document (`PlannerTask`).
3.  **Define Output Schema:** Define a simple Zod output schema (e.g., just indicating success/failure, maybe `{ status: string }`).
4.  **Define Genkit Flow:** Use `defineFlow` from `@genkit-ai/core`.
    *   Provide a clear name (e.g., `plannerMain`).
    *   Specify the Zod input (Firestore event) and output schemas.
    *   Implement the main flow function (async).
5.  **Firestore Trigger:** Use `onFlow` from `@genkit-ai/firebase/functions` in `src/index.ts` (or similar) to configure the flow to be triggered by Firestore events.
    *   Specify the `trigger: { firestore: { ... } }` configuration.
    *   Define the `document` path pattern (e.g., `campaigns/{campaignId}/plannerTasks/{taskId}`).
    *   Specify the event type (e.g., `written`, `created`).
6.  **Basic Flow Logic:**
    *   Integrate the logger.
    *   Log the received Firestore event payload.
    *   Extract the relevant `PlannerTask` data from the event payload (e.g., `event.data.value.fields` or similar, structure depends on exact event format).
    *   **(Stub)** Log the extracted task details and intent to process.
    *   **(Stub)** Return a basic success response.
7.  **Error Handling:** Implement a top-level try/catch within the flow function to handle unexpected errors (e.g., parsing event data, task processing), log them, and potentially update the PlannerTask status to `failed` in Firestore (though writing logic is in PLAN-004).
8.  **Deployment Configuration:** Ensure deployment scripts target this flow.
9.  **Initial Deployment:** Deploy the basic flow to the Dev GCP project.
10. **Triggering:** Manually create a document in the `/campaigns/{campaignId}/plannerTasks/` path in the Dev Firestore database to test if the Eventarc trigger invokes the deployed function.

## Implementation Checklist

*   [ ] Create `src/flows/planner.flow.ts`.
*   [ ] **Define Zod Schemas:**
    *   [ ] `FirestoreEventSchema` (Define structure based on Eventarc Firestore trigger payload - consult GCP docs or sample event. Needs fields like `data.value.name`, `data.value.fields`, etc.). Reference `PlannerTask` schema for the `fields` part.
    *   [ ] `PlannerOutputSchema` (e.g., `z.object({ status: z.string() })`).
*   [ ] **Define Flow:**
    *   [ ] `import { defineFlow } from '@genkit-ai/core';`
    *   [ ] `import { FirestoreEventSchema, PlannerOutputSchema } from './schemas';`
    *   [ ] `import logger from '../utils/logger';`
    *   [ ] `import { PlannerTask } from '../data/schemas';` // For type casting
    *   [ ] `export const plannerMain = defineFlow({ name: 'plannerMain', inputSchema: FirestoreEventSchema, outputSchema: PlannerOutputSchema }, async (event) => { ... });`
*   [ ] **Implement Basic Flow Logic:**
    *   [ ] `logger.info({ event }, 'plannerMain flow invoked');`
    *   [ ] `try { ... } catch (error) { ... }` block.
    *   [ ] Inside try: Extract `PlannerTask` data from `event.data.value` (requires careful mapping from Firestore event format to `PlannerTask` interface).
    *   [ ] Inside try: Log extracted task: `logger.info({ plannerTask }, 'Processing planner task');`
    *   [ ] Inside try: **(Stub)** Add placeholder logic based on `taskType`.
    *   [ ] Inside try: `return { status: 'Processed (stub)' };`
    *   [ ] Inside catch: `logger.error({ error }, 'Error in plannerMain flow'); throw error; // Re-throw to let CFn handle retries/failure`
*   [ ] **Register Firestore Trigger (`src/index.ts` or similar):**
    *   [ ] `import { onFlow } from '@genkit-ai/firebase/functions';`
    *   [ ] `import { plannerMain } from './flows/planner.flow';`
    *   [ ] `export const plannerFirestore = onFlow({ flow: plannerMain, name: 'planner-main', trigger: { firestore: { document: 'campaigns/{campaignId}/plannerTasks/{taskId}', eventType: 'google.cloud.firestore.document.v1.written' } } });` // Check eventType string
*   [ ] **Deployment:**
    *   [ ] Verify `genkit.config.ts` includes `firebase()` plugin.
    *   [ ] Verify Eventarc trigger targeting this function is defined in Terraform (INFRA-V1-002).
    *   [ ] Run `npm run build`.
    *   [ ] Run `npm run genkit:deploy:dev`.
    *   [ ] Verify deployment success in Firebase Studio / GCP Console.

## Verification Steps

*   [ ] Flow code compiles without TypeScript errors.
*   [ ] Flow deploys successfully to Cloud Functions v2.
*   [ ] Manually creating/updating a document in `/campaigns/{campaignId}/plannerTasks/{taskId}` in the Dev Firestore database triggers the deployed function (check Cloud Function logs).
*   [ ] Function logs show the received Firestore event payload.
*   [ ] Function logs show the extracted `PlannerTask` data correctly.
*   [ ] Function execution completes successfully (stub logic).
*   [ ] Errors during event processing are logged.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Exact structure of the Firestore event payload from Eventarc (needs verification via logs or docs).
*   Correct `eventType` string for Firestore writes (`google.cloud.firestore.document.v1.written` or `.created`?). `.written` covers creates and updates.
*   Mapping Firestore event data fields to the `PlannerTask` TypeScript interface (might require a helper function).

## Acceptable Tradeoffs

*   Stub logic for actually processing the task.
*   Basic error handling (relying on function retries for transient issues).
*   Using `.written` event type captures more triggers than needed if only creation matters, but is simpler.
