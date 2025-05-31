# Work Plan: TEST-V1-004 - Plan and Execute Manual E2E Testing

*   **Task ID**: TEST-V1-004
*   **Phase**: 5 - Integration, Testing & Refinement (V1)
*   **Status**: Not Started
*   **Estimate**: 2 Days (Cumulative effort throughout refinement)
*   **Author**: Gemini
*   **Dependencies**: All core components deployed to a test environment (e.g., Staging), Discord Bot running, Test Discord Server available.
*   **Related Docs**: `docs/product_requirements_v2.md`, `docs/architecture_v2.md` (UX Section).

## Problem Statement

Plan and execute manual end-to-end (E2E) testing scenarios using the actual Discord interface connected to a deployed version of the application (ideally a Staging environment). This is crucial for validating the real-time voice interaction quality, overall user experience, narrative coherence, and ensuring all integrated components function correctly together in a realistic setting.

## Components Involved

*   Deployed Application (Discord Bot on Cloud Run, Flows on CFn v2) in Staging environment.
*   Discord Client (Desktop/Mobile)
*   Test Discord Server
*   Microphone/Headset
*   Test Plan Document (This work plan serves as the initial basis)
*   Issue Tracking System

## Proposed Solution / Design Approach

1.  **Define Test Scenarios:** Create a checklist of key user journeys and interaction flows to test manually via Discord. Focus on:
    *   **Voice Interaction:** Joining channel, basic conversation flow, GM response latency, voice quality, turn-taking, handling minor interruptions, transcript accuracy.
    *   **Gameplay Loop:** Initiating actions via voice/text, rolling dice (`/roll`), receiving narrative outcomes, interacting with the environment/NPCs (via Narrator voice).
    *   **Commands:** `/roll` usage (valid/invalid), `/reset` functionality.
    *   **Error Handling:** Observe bot behavior during simulated or actual errors (e.g., temporary API unavailability if possible, invalid commands).
    *   **Onboarding:** Experience for joining a campaign/channel for the first time.
    *   **Session Flow:** Starting a session, playing for a period, ending a session (manual stop).
    *   **Planner Influence (Indirect):** Observe if the narrative reflects deeper planning over time (subjective assessment).
2.  **Prepare Test Environment:**
    *   Ensure the application is deployed to the Staging GCP project.
    *   Set up a dedicated Discord test server.
    *   Invite the deployed Staging bot instance to the server.
    *   Prepare any necessary initial campaign/ruleset data in the Staging Firestore database.
3.  **Execute Tests:**
    *   Testers (initially the development team) join the voice/text channels on the test server.
    *   Follow the defined test scenarios, interacting with the bot via voice and text.
    *   Record observations, focusing on UX aspects (latency, clarity, naturalness), functional correctness, and narrative coherence.
    *   Note any bugs, unexpected behavior, or areas for improvement.
4.  **Log Issues:** Document all identified bugs or significant issues in the project's issue tracking system with clear steps to reproduce, expected vs. actual results.
5.  **Iterate:** Re-test scenarios after bug fixes or improvements are deployed to Staging.

## Implementation Checklist

*   [ ] **Define Test Scenarios (Checklist):**
    *   [ ] Scenario: Bot Join & Initial Interaction (Voice)
    *   [ ] Scenario: Basic Question & Answer (Voice)
    *   [ ] Scenario: Player Declares Action (Voice) -> GM Response
    *   [ ] Scenario: Player Uses `/roll` -> Bot Posts Result -> GM Narrates Outcome (Voice)
    *   [ ] Scenario: Player Uses `/roll` (Invalid Syntax) -> Bot Error Message
    *   [ ] Scenario: Multi-turn Conversation Flow (Voice)
    *   [ ] Scenario: NPC Dialogue Delivery (via Narrator Voice) - Clarity of attribution?
    *   [ ] Scenario: Player Sends Text Message -> GM Response (via Voice)
    *   [ ] Scenario: Handling GM Processing Delay (Text notification `Thinking...` appears/disappears?)
    *   [ ] Scenario: `/reset` Command Functionality & Confirmation
    *   [ ] Scenario: Observe Transcript Accuracy in Text Channel
    *   [ ] Scenario: (Longer Play) Subjective Assessment of Narrative Coherence / Planner Influence
    *   [ ] Scenario: Bot leaves channel / Session ends.
*   [ ] **Prepare Test Environment:**
    *   [ ] Confirm successful deployment of all components to Staging GCP Project (via CI/CD or manual deploy).
    *   [ ] Create/designate Test Discord Server & Channels.
    *   [ ] Invite Staging Bot to the server.
    *   [ ] Seed Staging Firestore with necessary Campaign/Ruleset/WorldState data.
*   [ ] **Execute Test Runs:**
    *   [ ] Perform initial run-through of all scenarios.
    *   [ ] Perform exploratory testing (try unexpected inputs/interactions).
    *   [ ] Conduct multiple test sessions, potentially with different testers.
*   [ ] **Log Issues:**
    *   [ ] Record all bugs/UX issues found in issue tracker (e.g., GitHub Issues).
*   [ ] **Retest:**
    *   [ ] Verify bug fixes by re-running relevant scenarios after fixes are deployed.

## Verification Steps

*   [ ] All defined test scenarios have been executed manually.
*   [ ] Critical user flows (voice interaction, dice rolling, basic narration) function as expected in the deployed environment.
*   [ ] Voice interaction latency and quality are subjectively acceptable.
*   [ ] Known bugs and significant UX issues discovered during testing are documented in the issue tracker.
*   [ ] Bot handles basic errors gracefully from a user perspective.

## Decision Authority

Lead Engineer (self), Development Team

## Questions / Uncertainties

*   Subjectivity of voice quality and narrative coherence assessment.
*   Difficulty in reliably testing specific error conditions end-to-end.
*   How to effectively test the impact of the asynchronous Planner agent through manual interaction alone.

## Acceptable Tradeoffs

*   Focusing on core V1 functionality; not exhaustively testing every possible edge case.
*   Qualitative assessment of certain aspects (latency, coherence).
*   Known, documented bugs might exist post-testing if deemed non-critical for V1 launch.
