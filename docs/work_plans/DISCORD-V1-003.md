# Work Plan: DISCORD-V1-003 - Discord Bot - Storyteller Flow Integration

*   **Task ID**: DISCORD-V1-003
*   **Phase**: 2 - Core V1 Components
*   **Status**: Not Started
*   **Estimate**: 0.5 Days
*   **Author**: Gemini
*   **Dependencies**: DISCORD-V1-001 (Bot structure), DISCORD-V1-002 (Handles getting transcript/result from Live Voice API), CORE-V1-001 (Config Loader, Logger), INFRA-V1-002 (Bot SA with invoker role for Storyteller CFn, Storyteller CFn placeholder), AGENT-V1-STORY-001 (Storyteller flow deployed with HTTPS endpoint).
*   **Related Docs**: `docs/architecture_v2.md` (Sections 5.7, 7.1), `docs/product_requirements_v2.md` (Section 8)

## Problem Statement

Implement the mechanism within the Discord Bot to make authenticated HTTPS POST requests to the deployed Storyteller Genkit Flow endpoint. This involves constructing the correct payload, obtaining a GCP Identity Token for the Bot's Service Account, and handling the response from the Storyteller flow.

## Components Involved

*   `src/discord/storytellerClient.ts` (New module or part of `liveVoiceHandler.ts` / `commandHandler.ts`)
*   Google Auth Library (Node.js)
*   `axios` or `node-fetch` (HTTP client library)
*   `src/config/config.ts` (To get Storyteller Flow URL)
*   `src/utils/logger.ts`
*   Storyteller Cloud Function v2 HTTPS Endpoint

## Proposed Solution / Design Approach

1.  **Install Dependencies:** Add `google-auth-library` and an HTTP client like `axios`.
2.  **Configuration:** Ensure the URL of the deployed Storyteller Cloud Function is available via the Config Loader.
3.  **Authentication Token Fetching:**
    *   Use the `google-auth-library` to fetch a GCP Identity Token.
    *   Instantiate `GoogleAuth`.
    *   Call `getIdTokenClient()` specifying the `targetAudience` as the URL of the Storyteller Cloud Function.
    *   The library will use the application default credentials (ADC) provided by the Cloud Run environment (Bot's Service Account) to generate the token.
4.  **API Client Logic:**
    *   Create a function (e.g., `callStorytellerFlow(payload)`) that:
        *   Fetches the identity token.
        *   Constructs the JSON payload based on the input (e.g., voice transcript, text message, dice result, `userId`, `campaignId`).
        *   Uses `axios` (or `fetch`) to make a POST request to the Storyteller Flow URL.
        *   Includes the `Authorization: Bearer <ID_TOKEN>` header.
        *   Includes the JSON payload in the request body.
        *   Handles the response (success or error) from the Storyteller flow.
        *   Logs the request, response status, and any errors.
5.  **Integration Points:**
    *   Call `callStorytellerFlow` from `liveVoiceHandler.ts` after receiving the final transcript from the Live Voice API.
    *   Call `callStorytellerFlow` from `commandHandler.ts` after processing a `/roll` command (to send the numeric result for narrative interpretation).
    *   Call `callStorytellerFlow` from the `MessageCreate` event handler if processing raw text messages.

## Implementation Checklist

*   [ ] `npm install google-auth-library axios` (or `node-fetch`)
*   [ ] **Configuration:**
    *   [ ] Add `STORYTELLER_FLOW_URL` to `src/config/schema.ts` and `.env.example`/`.env`.
    *   [ ] Verify Bot SA has `roles/run.invoker` on the Storyteller function (from INFRA-V1-002).
*   [ ] **Create `src/discord/storytellerClient.ts` (or integrate into handlers):**
    *   [ ] Import `GoogleAuth` from `google-auth-library`.
    *   [ ] Import `axios`.
    *   [ ] Import `config`.
    *   [ ] Import `logger`.
    *   [ ] Implement `fetchIdentityToken()` async function:
        *   `const auth = new GoogleAuth();`
        *   `const client = await auth.getIdTokenClient(config.STORYTELLER_FLOW_URL);`
        *   `const token = await client.idTokenProvider.fetchIdToken(config.STORYTELLER_FLOW_URL);`
        *   `return token;`
        *   (Add caching for the token if appropriate, respecting expiry time).
    *   [ ] Implement `callStorytellerFlow(payload: Record<string, any>)` async function:
        *   `const token = await fetchIdentityToken();`
        *   Log initiating call.
        *   `try { ... } catch (error) { ... }` block.
        *   Inside try: `const response = await axios.post(config.STORYTELLER_FLOW_URL, payload, { headers: { Authorization: \`Bearer ${token}\` } });`
        *   Log success response status/data.
        *   Return response data.
        *   Inside catch: Log error details.
        *   Throw or return error indicator.
*   [ ] **Integration:**
    *   [ ] In `liveVoiceHandler.ts` (from DISCORD-V1-002), after getting transcript, call `callStorytellerFlow` with appropriate payload (type 'voiceResult', content=transcript, ...).
    *   [ ] In `commandHandler.ts`, update `/roll` handler: After rolling dice locally and posting the result, call `callStorytellerFlow` with appropriate payload (type 'diceResult', content={notation, result}, ...).
    *   [ ] In `bot.ts` (`MessageCreate` handler), if handling text messages, call `callStorytellerFlow` (type 'textMessage', content=messageText, ...).
*   [ ] **Testing:**
    *   [ ] Unit test `fetchIdentityToken` (mocking `google-auth-library`).
    *   [ ] Unit test `callStorytellerFlow` (mocking `fetchIdentityToken` and `axios`).
    *   [ ] **Integration Test:** Requires the Storyteller flow to be deployed to a dev environment. Run the bot locally (ensuring ADC or SA key is available for auth lib) and trigger an action (e.g., `/roll`) to verify a successful authenticated POST request reaches the deployed flow (check flow logs).

## Verification Steps

*   [ ] Unit tests pass.
*   [ ] Bot successfully obtains a GCP identity token when running with appropriate credentials.
*   [ ] Bot makes a POST request to the configured Storyteller URL with the correct `Authorization: Bearer <token>` header and JSON payload when triggered (verified via logs or mock server).
*   [ ] Bot correctly handles success and error responses from the Storyteller flow API call (verified via logs).
*   [ ] End-to-end test (local bot -> deployed dev flow) shows successful invocation in flow logs.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Need the actual deployed URL for the Storyteller flow (will be available after AGENT-V1-STORY-001 is deployed).
*   Token caching strategy (simple fetching on each call might be acceptable initially).

## Acceptable Tradeoffs

*   No sophisticated token caching in the first version.
*   Basic error handling for API call failures.
