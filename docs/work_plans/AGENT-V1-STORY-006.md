# Work Plan: AGENT-V1-STORY-006 - Implement Game Rule Interpretation Logic

*   **Task ID**: AGENT-V1-STORY-006
*   **Phase**: 3 - Storyteller Agent (V1)
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: AGENT-V1-STORY-001 (Flow structure), AGENT-V1-STORY-002 (LLM integration), AGENT-V1-STORY-003 (Reading Ruleset data), CORE-V1-002 (Schema: Ruleset).
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md` (Section 2.2).

## Problem Statement

Implement logic within the Storyteller flow to interpret and apply game rules based on the loaded `Ruleset` data. This primarily involves using the ruleset information to inform the Gemini model when interpreting dice roll outcomes or player actions declared within the context of the specific game system.

## Components Involved

*   `src/flows/storyteller.flow.ts` (Update flow logic)
*   `src/data/schemas.ts` (Interface: `Ruleset`)
*   Gemini Model (via `generate` call)
*   Loaded `Ruleset` data object

## Proposed Solution / Design Approach

1.  **Access Ruleset Data:** Ensure the `Ruleset` object corresponding to the current campaign (loaded in AGENT-V1-STORY-003) is readily available within the flow's execution context.
2.  **Integrate Rules into Prompts:** Modify the prompt engineering logic (from AGENT-V1-STORY-002) to include relevant parts of the `ruleset.mechanics` data when contextually appropriate, especially when handling dice roll results (`payload.type === 'diceResult'`).
    *   Example Prompt Augmentation (for Dice Roll):
        ```
        Context: {scene_description}, {character_info}
        Ruleset Info: {relevant_ruleset_mechanics_summary}
        Action Attempted: Player tried to {action_description}
        Dice Roll: Player rolled {dice_notation} with result {numeric_result}
        Task: Narrate the outcome of the action based on the dice result and the provided ruleset context. Describe what happens clearly.
        ```
3.  **LLM-Based Interpretation:** Rely primarily on the Gemini model (instructed via the augmented prompt) to perform the narrative interpretation of rules and dice results. Avoid implementing complex, hardcoded rule logic in the TypeScript flow itself for V1's rules-light systems.
4.  **Rule Clarifications (Future Consideration):** While full rule clarification logic might be deferred, ensure the loaded `ruleset` data could potentially be used by the LLM to answer player questions about rules if that feature is added later. For V1, the focus is on *applying* rules during outcome narration.
5.  **Testing:** Test with different `Ruleset` examples (e.g., defining success thresholds for dice rolls) and verify that the LLM output reflects those rules.

## Implementation Checklist

*   [ ] **Update `src/flows/storyteller.flow.ts`:**
    *   [ ] Ensure the `ruleset` object (loaded in STORY-003) is accessible in the scope where prompts are built.
    *   [ ] **Modify Prompt Construction Logic (AGENT-V1-STORY-002):**
        *   Identify the prompt template used for handling `diceResult` payloads.
        *   Add a section to the prompt that includes relevant rule information extracted from the `ruleset.mechanics` object. (Start simple: maybe just include the whole `mechanics` JSON stringified, or extract key parts like success thresholds).
        *   Refine the prompt's instructions to explicitly tell the LLM to consider the ruleset when narrating the outcome.
        *   Consider if rules need inclusion for other input types (e.g., interpreting specific actions mentioned in voice/text).
*   [ ] **Testing:**
    *   [ ] **Prerequisite:** Have sample `Ruleset` documents with different simple mechanics (e.g., target numbers for success) created in Firestore Emulator / Dev Firestore.
    *   [ ] **Unit Tests:** Mock `generate`. Test that the prompt construction logic correctly includes ruleset information when handling relevant input types (like `diceResult`).
    *   [ ] **Integration Tests (Local):** Use `genkit start`. Invoke the flow with `diceResult` payloads.
        *   Provide different `rulesetId` values in the campaign data linked to different ruleset documents.
        *   Verify the prompts logged include the correct ruleset information.
        *   Analyze the LLM's generated narration (logged response) to see if it reflects the rules (e.g., narrating success on a high roll according to the ruleset, failure on a low roll).
    *   [ ] **Integration Tests (Deployed):** Deploy flow. Invoke with different dice results and campaign contexts linked to different rulesets. Verify LLM output in logs reflects the rules.

## Verification Steps

*   [ ] Ruleset data (loaded in STORY-003) is correctly included in prompts sent to Gemini when handling dice rolls or other rule-relevant actions.
*   [ ] The LLM's narrative output demonstrably changes based on the provided ruleset context and the dice roll result (e.g., correctly identifying success/failure based on ruleset thresholds).
*   [ ] Flow works correctly with different sample `Ruleset` documents.
*   [ ] Unit tests verify prompt augmentation with ruleset info.
*   [ ] Integration tests confirm rule-influenced LLM output.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   How best to format/summarize `ruleset.mechanics` for inclusion in the prompt? (Experimentation needed. Start with simple JSON string or key values).
*   How capable is the LLM at consistently interpreting and applying diverse rules-light mechanics based solely on prompt context? (Requires testing and potentially prompt refinement).

## Acceptable Tradeoffs

*   Relying entirely on the LLM for rule interpretation rather than hardcoded logic (acceptable for V1's rules-light scope).
*   Simple inclusion of ruleset data in prompts initially.
*   No complex rule clarification features in V1.
