# Work Plan: AGENT-V1-STORY-001 - Define Storyteller Genkit Flow - Basic Structure & Deployment

*   **Task ID**: AGENT-V1-STORY-001
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Genkit init, project structure), INFRA-V1-002 (Placeholder CFn, SA), CORE-V1-001 (Logger, Config), CORE-V1-002 (Schema Interfaces), SETUP-V1-002 (CI/CD for deployment), Zod library installed.
*   **Related Docs**: `docs/architecture_v2.md` (Sections 3, 5), `docs/product_requirements_v2.md` (Section 3), Genkit documentation.

## Problem Statement

Define the basic structure of the main Storyteller Genkit flow (`storyteller.flow.ts`). This includes setting up the flow definition with Zod schemas for input/output validation, configuring it for HTTPS invocation, implementing basic input parsing, integrating logging, and ensuring it can be deployed as a Cloud Function v2 via the Genkit CLI / Firebase Studio.

## Components Involved

*   `src/flows/storyteller.flow.ts` (New file)
*   Genkit Core (`defineFlow`, `runFlow`, etc.)
*   Genkit Firebase Plugin (`onFlow` for HTTPS)
*   Zod (for input/output schemas)
*   `src/config/config.ts`
*   `src/utils/logger.ts`
*   `src/data/schemas.ts` (For payload types)
*   Cloud Functions v2 (Deployment target)
*   Firebase Studio (Deployment/Management interface)

## Proposed Solution / Design Approach

1.  **Create Flow File:** Create `src/flows/storyteller.flow.ts`.
2.  **Define Input/Output Schemas:** Use Zod to define strict schemas for the expected input payload from the Discord Bot (covering `voiceResult`, `textMessage`, `diceResult` types) and the expected output payload back to the Bot (V1 scope: just status/message).
3.  **Define Genkit Flow:** Use `defineFlow` from `@genkit-ai/core`.
    *   Provide a clear name (e.g., `storytellerMain`).
    *   Specify the Zod input and output schemas.
    *   Implement the main flow function (async).
4.  **HTTPS Trigger:** Use `onFlow` from `@genkit-ai/firebase` in `src/index.ts` (or wherever flows are exported/registered) to expose the `storytellerMain` flow as an HTTPS endpoint. Configure authentication to require it (should be default when deployed with Firebase plugin).
5.  **Basic Flow Logic:**
    *   Integrate the logger.
    *   Log the received input payload.
    *   Implement a basic switch or conditional logic based on the `payload.type`.
    *   **(Stub)** For each type, log processing intent (e.g., "Processing voice result...").
    *   **(Stub)** Return a basic success response conforming to the output schema.
6.  **Error Handling:** Implement a top-level try/catch within the flow function to catch unexpected errors, log them with context, and return a standardized error response matching the output schema.
7.  **Deployment Configuration:** Ensure `genkit.config.ts` is configured with the `firebase` plugin. Ensure the deployment script in `package.json` (`genkit:deploy:dev`) targets this flow.
8.  **Initial Deployment:** Deploy the basic flow to the Dev GCP project using `npm run genkit:deploy:dev` (or via CI/CD pipeline if SETUP-V1-002 is complete).
9.  **Obtain URL:** Get the HTTPS invocation URL of the deployed function (available in GCP console or `genkit flow list`). Update configuration (e.g., `.env` file, Secret Manager for Dev) with this URL for the Discord Bot (DISCORD-V1-003) to use.

## Implementation Checklist

*   [ ] `npm install zod`
*   [ ] Create `src/flows/storyteller.flow.ts`.
*   [ ] **Define Zod Schemas:**
    *   [ ] `StorytellerInputSchema` (e.g., `z.object({ type: z.enum(['voiceResult', 'textMessage', 'diceResult']), userId: z.string(), campaignId: z.string(), content: z.any(), timestamp: z.date() })` - Refine `content` type later).
    *   [ ] `StorytellerOutputSchema` (e.g., `z.object({ status: z.enum(['success', 'error']), message: z.string().optional() })`).
*   [ ] **Define Flow:**
    *   [ ] `import { defineFlow } from '@genkit-ai/core';`
    *   [ ] `import { StorytellerInputSchema, StorytellerOutputSchema } from './schemas'; // Or wherever defined`
    *   [ ] `import logger from '../utils/logger';`
    *   [ ] `export const storytellerMain = defineFlow({ name: 'storytellerMain', inputSchema: StorytellerInputSchema, outputSchema: StorytellerOutputSchema }, async (payload) => { ... });`
*   [ ] **Implement Basic Flow Logic:**
    *   [ ] `logger.info({ payload }, 'storytellerMain flow invoked');`
    *   [ ] `try { ... } catch (error) { ... }` block.
    *   [ ] Inside try: `switch (payload.type) { ... }` logging stubs for each type.
    *   [ ] Inside try: `return { status: 'success', message: 'Processed (stub)' };`
    *   [ ] Inside catch: `logger.error({ error }, 'Error in storytellerMain flow'); return { status: 'error', message: 'Internal GM error.' };`
*   [ ] **Register HTTPS Trigger (`src/index.ts` or similar):**
    *   [ ] `import { onFlow } from '@genkit-ai/firebase/functions';`
    *   [ ] `import { storytellerMain } from './flows/storyteller.flow';`
    *   [ ] `export const storytellerHttp = onFlow({ flow: storytellerMain, name: 'storyteller-main' }); // Ensure name matches TF placeholder if needed`
    *   [ ] Configure auth if needed explicitly: `{ name: 'storyteller-main', authPolicy: 'authenticated'}` (default in Firebase plugin).
*   [ ] **Deployment:**
    *   [ ] Verify `genkit.config.ts` includes `firebase()` plugin.
    *   [ ] Ensure `genkit:deploy:dev` script in `package.json` exists and targets the correct Dev project ID.
    *   [ ] Run `npm run build`.
    *   [ ] Run `npm run genkit:deploy:dev`.
    *   [ ] Verify deployment success in Firebase Studio / GCP Console.
*   [ ] **Update Config:**
    *   [ ] Obtain the deployed function's HTTPS URL.
    *   [ ] Update `STORYTELLER_FLOW_URL` in `.env` (local dev) and potentially Secret Manager (for deployed bot dev environment).

## Verification Steps

*   [ ] Flow code compiles without TypeScript errors.
*   [ ] Flow deploys successfully to Cloud Functions v2 via `genkit deploy`.
*   [ ] The deployed function has an HTTPS invocation URL.
*   [ ] Sending a valid JSON payload (matching `StorytellerInputSchema`) via `curl` or Postman to the HTTPS URL (with appropriate auth token - e.g., generated via `gcloud auth print-identity-token`) results in a `200 OK` response matching `StorytellerOutputSchema` (status: 'success').
*   [ ] Logs appear in Cloud Logging / Firebase Studio traces for successful invocations.
*   [ ] Sending an invalid payload results in an appropriate error response (e.g., 4xx).
*   [ ] Sending a valid payload that causes an intentional error inside the flow results in a response with `status: 'error'` and error logs appear.
*   [ ] Invoking without authentication fails (401/403 error).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Need to refine the `content` field schema within `StorytellerInputSchema` as message/result types become clearer.
*   Confirm exact function name used in deployment (`storyteller-main`?) aligns with Terraform placeholders/IAM bindings if TF manages the function resource itself directly (less common with Genkit Firebase deploy).

## Acceptable Tradeoffs

*   Stub logic for handling different payload types initially.
*   Basic error handling.
*   Relying on Genkit Firebase plugin defaults for HTTPS authentication.
