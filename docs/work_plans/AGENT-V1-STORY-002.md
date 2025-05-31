# Work Plan: AGENT-V1-STORY-002 - Integrate Native Gemini Model (Storyteller)

*   **Task ID**: AGENT-V1-STORY-002
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-STORY-001 (Flow structure), CORE-V1-001 (Config), INFRA-V1-002 (SA with AI Platform/Vertex AI permissions), Genkit Google AI Plugin configured.
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, Genkit documentation (`@genkit-ai/googleai`).

## Problem Statement

Integrate the native Genkit Google AI plugin to call a Gemini model (targeting "2.5 Flash" or similar fast model) within the Storyteller flow. This enables the flow to generate narrative text, process player input contextually, and make basic decisions based on the game state and GM persona.

## Components Involved

*   `src/flows/storyteller.flow.ts` (Update flow logic)
*   `@genkit-ai/googleai` plugin
*   `generate` function from Genkit core/Google AI plugin
*   Gemini Models (e.g., `gemini-1.5-flash-latest` or specific preview)
*   `src/config/config.ts` (Potentially for model name config)
*   `genkit.config.ts` (Ensure Google AI plugin is configured)

## Proposed Solution / Design Approach

1.  **Configure Google AI Plugin:** Ensure the `@genkit-ai/googleai` plugin is configured in `genkit.config.ts` and potentially initialized with the project ID.
2.  **Select Model:** Define which Gemini model to use for the Storyteller (e.g., `gemini-1.5-flash-latest`). Make this configurable via `src/config/config.ts` or environment variables.
3.  **Develop Basic Prompts:** Create initial prompt structures within the flow for different scenarios:
    *   Processing a `voiceResult` payload (containing results from the Bot's Gemini Live API interaction): Include context (current scene, recent events, player character info), the final user transcript, and Gemini's text response from the Live API turn. Instruct the Storyteller's Gemini call to perform any necessary *secondary processing* (e.g., extract entities for game state, determine subtle consequences, log a summary for the Planner). In some cases, if the Live API interaction provided sufficient textual output for the bot, an LLM call in the Storyteller might not be needed for this payload type.
    *   Processing a `textMessage` input: Include context, the player's text input, and instructions to generate the GM's response/narration.
    *   Interpreting a `diceResult` input: Include context, the action attempted, the dice result, and instructions to narrate the outcome.
    *   Generating NPC dialogue (V1: To be spoken by Narrator voice via Live API): If a separate NPC dialogue generation step is needed within the Storyteller flow (e.g., if the initial Live API turn didn't cover it), include NPC persona, context, and instructions for dialogue. The output text would then be sent back to the bot, which would use the Live API for TTS in the *next* interaction.
4.  **Integrate `generate` Call:**
    *   Import `generate` from `@genkit-ai/core` and the specific model reference (e.g., `gemini15Flash`) from `@genkit-ai/googleai`.
    *   Within the flow logic (e.g., inside the `switch` statement from AGENT-V1-STORY-001), construct the appropriate prompt based on the input type and the considerations above. If an LLM call is needed for the specific payload type:
    *   Call `await generate({ model: config.storytellerModel, prompt: constructedPrompt, config: { temperature: 0.7 /* etc */ } })`.
    *   Process the response: Extract the generated text content.
5.  **Update Flow Output:** Modify the flow's return value to potentially include the generated text, though for V1 the primary output channel is the Live Voice API managed by the Bot. The main goal here is internal processing and state update preparation.
6.  **Logging:** Log the prompt sent to Gemini and the raw response received for debugging.
7.  **Error Handling:** Add error handling around the `generate` call.

## Implementation Checklist

*   [ ] **Configuration:**
    *   [ ] `npm install @genkit-ai/googleai`
    *   [ ] Verify `@genkit-ai/googleai` plugin is added in `genkit.config.ts`.
    *   [ ] Add `STORYTELLER_MODEL_NAME` (e.g., 'gemini-1.5-flash-latest') to `src/config/schema.ts` and `.env.example`/`.env`.
    *   [ ] Ensure Storyteller SA (INFRA-V1-002) has `roles/aiplatform.user` or similar permission.
*   [ ] **Update `src/flows/storyteller.flow.ts`:**
    *   [ ] Import `generate` from `@genkit-ai/core`.
    *   [ ] Import the specific model reference (e.g., `gemini15Flash`) from `@genkit-ai/googleai` or reference it by name string from config.
    *   [ ] Import `config`.
    *   [ ] **Develop Prompt Templates:** Define basic string templates or functions to build prompts for:
        *   Handling player voice/text input.
        *   Handling dice roll results.
        *   (Potentially others as logic evolves).
    *   [ ] **Modify Flow Logic:**
        *   Inside the `switch (payload.type)` block:
            *   Construct the relevant prompt based on `payload` and potentially loaded game state (State loading is in STORY-003).
            *   `logger.debug({ prompt: constructedPrompt }, 'Calling Gemini');`
            *   `const llmResponse = await generate({ model: config.STORYTELLER_MODEL_NAME, prompt: constructedPrompt, ... });`
            *   `const generatedText = llmResponse.text();`
            *   `logger.debug({ response: generatedText }, 'Received Gemini response');`
            *   **(Stub)** Log the `generatedText`. (Actual use in state updates/responses comes later).
    *   [ ] **Error Handling:** Add `try/catch` around the `generate` call, log errors specifically related to the LLM call.
*   [ ] **Testing:**
    *   [ ] **Unit Tests:** Mock the `generate` function to test prompt construction logic and flow control without making real API calls.
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Manually invoke the flow (e.g., via the Genkit UI's flow runner) with sample payloads. Verify:
        *   Correct prompts are logged.
        *   Gemini API call is made (visible in Genkit traces).
        *   Response text is logged.
        *   Errors during generation are handled gracefully.
    *   [ ] **Integration Tests (Deployed):** Deploy the updated flow. Call via `curl`/Postman. Verify logs in Cloud Logging / Firebase Studio traces.

## Verification Steps

*   [ ] Flow makes successful calls to the configured Gemini model when invoked.
*   [ ] Genkit traces show the LLM interaction (prompt, response, model used).
*   [ ] Logs contain the prompts sent and responses received.
*   [ ] The flow handles errors from the `generate` call appropriately.
*   [ ] Unit tests mocking `generate` pass.
*   [ ] Local and deployed integration tests confirm successful Gemini invocation.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Optimal prompt structure for different tasks (requires iteration).
*   Best temperature/configuration settings for the Storyteller model (start with defaults, tune later).
*   Exact model name for "2.5 Flash" if available in preview (use `gemini-1.5-flash-latest` as a starting point).

## Acceptable Tradeoffs

*   Very basic prompt engineering initially.
*   Limited processing of the LLM response in this step (just logging text).
*   Default model configuration settings.
