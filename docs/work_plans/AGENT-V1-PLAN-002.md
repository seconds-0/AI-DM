# Work Plan: AGENT-V1-PLAN-002 - Integrate Native Gemini Model (Planner)

*   **Task ID**: AGENT-V1-PLAN-002
*   **Phase**: 4 - Planner Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1.5 Days
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-PLAN-001 (Flow structure, task parsing), CORE-V1-001 (Config), INFRA-V1-002 (SA with AI Platform/Vertex AI permissions), Genkit Google AI Plugin configured.
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, Genkit documentation (`@genkit-ai/googleai`).

## Problem Statement

Integrate the native Genkit Google AI plugin to call a powerful Gemini model (targeting "2.5 Pro" or highest available tier) within the Planner flow. This enables the flow to perform deep analysis based on the received `PlannerTask` context and generate planning suggestions (e.g., plot vectors, NPC actions, world state evolutions).

## Components Involved

*   `src/flows/planner.flow.ts` (Update flow logic)
*   `@genkit-ai/googleai` plugin
*   `generate` function from Genkit core/Google AI plugin
*   Gemini Models (e.g., `gemini-1.5-pro-latest` or specific "2.5 Pro" preview identifier)
*   `src/config/config.ts` (For model name config)
*   `genkit.config.ts` (Ensure Google AI plugin is configured)
*   Loaded context data (Task details, WorldState, Session Logs - from PLAN-003)

## Proposed Solution / Design Approach

1.  **Configure Google AI Plugin:** Ensure plugin is configured (`genkit.config.ts`).
2.  **Select Model:** Define the high-intelligence Gemini model for the Planner (e.g., `gemini-1.5-pro-latest` or the specific identifier for "2.5 Pro"). Make this configurable.
3.  **Develop Analysis Prompts:** Create prompt structures within the flow tailored to different `PlannerTask` types (`analyze_scene`, `evolve_world`, etc.). These prompts need to include:
    *   The specific task request/context from the `PlannerTask`.
    *   Relevant historical context (e.g., summary of recent `LogEvents`).
    *   Current game state (`WorldState`).
    *   Instructions asking the LLM to perform deep analysis and output structured suggestions (e.g., potential plot developments, NPC motivations/plans, consequences of player actions, inconsistencies to resolve).
    *   *Crucially:* Instruct the LLM to provide output in a format (e.g., JSON) that can be reliably parsed to update the `PlannerState` document later.
4.  **Integrate `generate` Call:**
    *   Import `generate` and the specific model reference.
    *   Within the flow logic (after parsing the task and loading context - context loading is in PLAN-003), construct the appropriate analysis prompt.
    *   Call `await generate({ model: config.plannerModel, prompt: constructedPrompt, output: { format: 'json' /* if applicable */, schema: PlannerSuggestionsSchema /* Zod schema for expected output */ }, config: { temperature: 0.5 /* etc - potentially lower temp for analytical tasks */ } })`.
    *   Requesting JSON output and providing a Zod schema (if supported by the model/Genkit integration) is highly recommended for reliable parsing.
5.  **Process Response:**
    *   Parse the LLM response (ideally JSON). Validate against the expected output schema.
    *   Extract the generated suggestions (plot vectors, NPC updates, etc.).
6.  **Logging & Error Handling:** Log prompts and responses. Handle errors during the `generate` call or response parsing.

## Implementation Checklist

*   [ ] **Configuration:**
    *   [ ] Verify `@genkit-ai/googleai` plugin is in `genkit.config.ts`.
    *   [ ] Add `PLANNER_MODEL_NAME` (e.g., 'gemini-1.5-pro-latest' or specific identifier) to `src/config/schema.ts` and `.env.example`/`.env`.
    *   [ ] Ensure Planner SA (INFRA-V1-002) has `roles/aiplatform.user` permission.
*   [ ] **Update `src/flows/planner.flow.ts`:**
    *   [ ] Import `generate` and the model reference.
    *   [ ] Import `config`.
    *   [ ] Define Zod schema(s) (`PlannerSuggestionsSchema`?) for the *expected structured output* from the Planner LLM.
    *   [ ] **Develop Prompt Templates:** Define functions to build detailed analysis prompts based on `plannerTask.taskType` and loaded context data (context from PLAN-003).
        *   Prompts should request structured output (JSON preferred).
    *   [ ] **Modify Flow Logic:**
        *   After parsing the task (PLAN-001) and loading context (PLAN-003):
            *   Construct the analysis prompt.
            *   `logger.debug({ prompt: constructedPrompt }, 'Calling Planner Gemini');`
            *   `const llmResponse = await generate({ model: config.PLANNER_MODEL_NAME, prompt: constructedPrompt, output: { format: 'json', schema: PlannerSuggestionsSchema }, ... });`
            *   `const suggestions = llmResponse.output(); // Already parsed/validated if schema provided`
            *   `if (!suggestions) { throw new Error('Failed to parse suggestions from Planner LLM'); }`
            *   `logger.debug({ suggestions }, 'Received Planner Gemini suggestions');`
            *   **(Stub)** Store/log the `suggestions`. (Writing to PlannerState is in PLAN-004).
    *   [ ] **Error Handling:** Add `try/catch` around `generate` and response parsing. Log errors.
*   [ ] **Testing:**
    *   [ ] **Unit Tests:** Mock `generate`. Test prompt construction based on different task types and contexts. Test response parsing logic (if not handled by Genkit `output.schema`).
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Requires Firestore emulator with sample Campaign, Task, WorldState, LogEvent data. Manually trigger the flow (e.g., by writing a task document to the emulator Firestore, or using Genkit UI if event triggers can be simulated).
        *   Verify correct prompt is logged.
        *   Verify Gemini API call is made via traces.
        *   Verify structured suggestions are received and logged.
        *   Verify error handling for invalid responses or API errors.
    *   [ ] **Integration Tests (Deployed):** Deploy flow. Trigger by writing task document in Dev Firestore. Verify logs/traces in Cloud Logging/Firebase Studio.

## Verification Steps

*   [ ] Flow makes successful calls to the configured high-intelligence Gemini model.
*   [ ] Correct prompts including task details and context are generated and logged.
*   [ ] Genkit traces show the LLM interaction.
*   [ ] Flow successfully receives and parses structured suggestions (JSON) from the LLM.
*   [ ] Logs contain the received suggestions.
*   [ ] The flow handles errors from the `generate` call and response parsing.
*   [ ] Unit tests mocking `generate` pass.
*   [ ] Local and deployed integration tests confirm successful Gemini invocation and suggestion generation.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Exact identifier for "Gemini 2.5 Pro" model and its availability via the API/Genkit.
*   Reliability of forcing JSON output and using `output.schema` with the target model. (Requires testing; may need fallback parsing if unreliable).
*   Optimal prompt structure for complex analytical tasks (requires significant iteration).
*   Appropriate temperature/sampling settings for planning tasks.

## Acceptable Tradeoffs

*   Initial prompts might be less complex.
*   Relying on Genkit's JSON/schema parsing; implementing manual parsing if needed.
*   Default model configuration settings initially.
