# Product Requirements Document: LLM-Powered Tabletop RPG GM Agent (v2.0)

## 1. High-Level Goal

To create a highly immersive, natural, responsive, and engaging LLM-powered Game Master (GM) agent designed primarily for Discord-based, rules-light tabletop RPGs. The V1 complexity ceiling is defined by systems like "Nice Marines" or "Honey Heist".

The GM will deliver (V1 Scope):

-   Seamless real-time voice interactions for the primary Narrator role via the Google Live Voice API.
-   **(Deferred Post-V1)** Distinct, expressive, and character-appropriate voices for Non-Player Characters (NPCs). For V1, NPCs will use the Narrator's voice channel.
-   Seamless text-based interaction as an alternative or supplement to voice.
-   A distinct GM personality (tunable per campaign) and an adaptive, engaging storytelling style powered by Gemini models.
-   Context-aware integration with player-initiated dice rolls and clear narrative interpretation of results.
-   Proactive and reactive rule clarifications appropriate to player experience levels.
-   Persistent, detailed contextual memory encompassing world state, character details, NPC knowledge, player knowledge, and session history, managed primarily via native Genkit Firestore utilities.
-   Deep, asynchronous narrative planning, world state evolution, and consequence analysis via a dedicated Planner agent utilizing Gemini "2.5 Pro" (or highest available tier).
-   **(Deferred Post-V1)** High-quality, immersive scene visuals automatically generated based on narrative context.
-   An experience built on a robust, maintainable, scalable, and cost-effective cloud backend leveraging **Genkit, Firebase (including Firebase Studio), Google Cloud Functions v2, Gemini Models, and Google Voice APIs.**

## 2. Detailed Product Requirements (Per Module - V1 Scope)

### 2.1. Personality & Player Interaction

-   **GM Persona & Consistency:** The GM shall possess a distinct personality (defined via configuration prompts per campaign) and maintain this persona consistently throughout interactions within a session. Powered by Gemini models.
-   **Player Comfort & Agency:** The GM shall acknowledge and respect reasonable player requests regarding content sensitivities (e.g., avoiding specific phobias) when communicated at the start of a session or campaign. The GM's response should be natural and affirming.
-   **Interaction Clarity & Modes:**
    -   _Narrator Voice (Real-time):_ Handled via the **Google Live Voice API** integrated into the Discord Bot, providing expressive, natural-sounding output based on the defined GM persona. **This channel will also be used for NPC dialogue in V1.**
    -   _NPC Voices (TTS):_ **(Deferred Post-V1)**.
    -   _Text Output:_ All GM communication provided via text (either primary or as subtitles/transcripts) must be explicitly clear, grammatically correct, and unambiguous.
-   **Error Handling & Recovery:** (Unchanged from previous V2 draft)
    -   Natural language clarification preferred.
    -   `/reset` slash command fallback.
    -   Explicit confirmation of debug commands.

### 2.2. Game System Layer

(Unchanged from previous V2 draft)
-   **V1 Complexity Ceiling:** "Nice Marines" / "Honey Heist".
-   **Ruleset Definition & Loading:** JSON in Firestore, loaded by Storyteller flow.
-   **Rule Reminders & Clarifications:** Handled by Storyteller flow.

### 2.3. Narration & Story Management

(Unchanged from previous V2 draft)
-   **Information Reveal & Player Knowledge Tracking:** Managed by Storyteller, state in Firestore (Genkit utils).
-   **Session Flow & Interruption Handling:** Storyteller handles gracefully.
-   **Prompting & Pacing:** Storyteller determines prompts.

### 2.4. Dice & Tool Use

-   **Dice Rolling Mechanics:** Discord slash command (`/roll`), handled by Bot.
-   **Narrative Interpretation:** Numeric result sent to **Storyteller Genkit flow** for interpretation (using Gemini).
-   **Character/NPC Data Management:** Firestore, accessed via **native Genkit Firestore utilities**.
-   **V1 Tools:** Only **native Gemini** is used directly by the Storyteller flow. Tools for TTS and Images are deferred.

### 2.5. Contextual Memory Management

(Unchanged from previous V2 draft)
-   **Persistent State:** Firestore.
-   **Memory Structure & Detail:** Access via **native Genkit Firestore utilities**.
-   **Recall & Recaps:** Supported by Storyteller flow querying Firestore.

### 2.6. Session Lifecycle Management

-   **Prep Phase:** Planner flow bootstraps initial state.
-   **Live Phase:**
    -   Discord bot manages real-time voice via **Google Live Voice API**.
    -   Storyteller flow processes transcripts/intents/text messages, calls **native Gemini**, updates state (Firestore via Genkit utils), reads Planner insights, triggers Planner tasks. **No external tool calls (TTS, DALL-E) in V1.**
-   **Postgame Phase:** Storyteller triggers summary, Planner performs async analysis.

### 2.7. Discord Integration

(Unchanged from previous V2 draft)
-   **Primary Interface:** Discord text/voice.
-   **Interaction Style:** Natural language (Live Voice API / text), minimal slash commands.
-   **Accessibility:** Text transcripts/messages.

## 3. V2 Dual-Agent Architecture Specification (Genkit Native - V1 Scope)

-   **Purpose:** Optimize for real-time interaction feel (Live Voice API + Storyteller) and deep planning (Planner), using Genkit/Firebase Studio.
-   **Compute Target:** Google Cloud Functions v2.
-   **Storyteller Agent (Genkit Flow - Logic Focus):**
    -   _Responsibilities:_ Processes inputs (transcripts/summaries from Live Voice API, text messages, dice results), executes game logic, calls **native Gemini**, updates game state via **native Genkit Firestore utilities**, reads `planner_state`, triggers Planner tasks via Firestore writes. **No custom external tool calls in V1.**
    -   _Implementation:_ **`storyteller.flow.ts`** (CFn v2 via HTTPS).
    -   _LLM/Tools:_ **Native Genkit integration for Google Gemini (e.g., "2.5 Flash")**. No custom tools (`gcloudTtsTool`, `dalleTool`) needed for V1.
    -   _Interaction with Planner:_ Reads `planner_state` (Firestore); Writes `plannerTasks` (Firestore).
-   **Planner Agent (Genkit Flow - Asynchronous Focus):**
    -   _Responsibilities:_ Deep analysis based on `plannerTasks` triggers (Eventarc), updates `planner_state`.
    -   _Implementation:_ **`planner.flow.ts`** (CFn v2 via Eventarc).
    -   _LLM:_ **Native Genkit integration for Google Gemini ("2.5 Pro")**.
    -   _Interaction:_ Reads state/logs (Firestore via Genkit utils); Writes results (Firestore via Genkit utils).

## 4. V2 Voice Interaction Architecture Specification (Google Native - V1 Scope)

-   **Purpose:** Provide a seamless, low-latency Narrator experience using Google Cloud technologies. Distinct NPC voices deferred.
-   **Pipeline 1: Narrator Voice (Google Live Voice API)**
    -   _Technology:_ **Google Live Voice API (Gemini API).**
    -   _Functionality:_ Handles bidirectional audio streaming for GM persona (Narrator and NPCs share this voice in V1).
    -   _Implementation:_ **Discord Bot (`discord.js`)** manages connection, streams audio, plays back response.
    -   _Integration:_ Bot sends final transcript/summary/intent to **Storyteller Genkit Flow** via HTTPS.
-   **Pipeline 2: NPC Character Voices**
    -   **(Deferred Post-V1)**. In V1, NPC dialogue text generated by the Storyteller flow will be spoken using the Narrator's voice via the Live Voice API.

## 5. Visual Generation Specification

-   **(Deferred Post-V1)**. No image generation capabilities in V1.

## 6. Backend & Technology Stack Specification (V2 - V1 Scope)

-   **Primary Language/Runtime:** Node.js (TypeScript).
-   **AI Orchestration Framework:** Genkit.
-   **Primary Backend Platform:** Firebase (Firestore, Firebase Studio) / Google Cloud (CFn v2, Eventarc, Secret Manager).
-   **Core LLM APIs:**
    -   **Google Gemini API** (e.g., "2.5 Pro" Planner, "2.5 Flash" Storyteller) via **native Genkit integration**.
-   **Voice APIs:**
    -   _Narrator/NPC Real-time Voice:_ **Google Live Voice API (Gemini API)**.
    -   _NPC TTS:_ **(Deferred Post-V1)**.
-   **Image API:** **(Deferred Post-V1)**.
-   **Discord Integration:** `discord.js` library (Cloud Run).
-   **Task Queueing (Internal):** Firestore Subcollection (`plannerTasks`) + Eventarc.

## 7. Database & State Management Design (Firestore - Genkit Native Focus)

(Unchanged from previous V2 draft - still prioritize Genkit utils, discourage custom module except for schemas)

## 8. V2 Interaction Flow (Illustrative Example - V1 Scope)

1.  Player speaks in Discord voice channel.
2.  Discord Bot streams audio to **Google Live Voice API**.
3.  Live Voice API interacts with Gemini (Narrator persona) and streams audio back. Bot plays audio.
4.  Interaction concludes. Live Voice API provides transcript/summary/intent to Bot.
5.  Bot POSTs results to **Storyteller Genkit Flow**.
6.  Storyteller Flow (Gemini "2.5 Flash") parses input.
7.  Flow uses **native Genkit Firestore utilities** to retrieve state.
8.  Flow executes game logic. If NPC speaks, flow generates text dialogue. **(No separate TTS call)**.
9.  Flow uses **native Genkit Firestore utilities** to update state and log events.
10. If planning needed, Flow writes `plannerTask` using **native Genkit Firestore utilities**.
11. Flow constructs response for Bot (e.g., text confirmation). **(No audio/image URLs needed in V1 response)**.
12. Bot receives response (e.g., posts text).
13. (Async) `plannerTasks` write triggers Eventarc -> **Planner Genkit Flow**.
14. Planner Flow (Gemini "2.5 Pro") executes analysis using **native Genkit Firestore utilities**.
15. Planner Flow writes results using **native Genkit Firestore utilities**.

## 9. Initialization & Configuration Flow (V2)

(Unchanged from previous V2 draft, though config file won't need TTS/DALL-E keys initially)

## 10. Testing Strategy (V2 - V1 Scope)

-   **Unit Tests:** Jest/Vitest for utils, bot handlers, flow logic helpers. **No custom tool tests needed for V1.**
-   **Integration Tests:**
    -   Test flows with mocked **Live Voice API** results and **native Genkit Firestore utilities** against Firestore Emulator.
    -   Test Bot interaction with mocked flow endpoints and potentially mocked Live Voice API interface.
-   **Agent Simulation (`TEST-001`):** Test sequences against flows using `genkit start` (with emulators).
-   **Manual E2E Testing:** Discord playtesting focusing on voice interaction and core narrative loop.

## 11. Monitoring & Cost Tracking Requirements (V2 - V1 Scope)

(Largely unchanged, but remove metrics/tracking for deferred TTS/DALL-E tools)
-   Focus logging/monitoring on Live Voice API, Gemini API, Flows, Bot, Firestore.

## 12. Future Enhancements (Punted Post-V1)

(Add the deferred items clearly)
-   **Distinct NPC Voices:** Integrate custom Genkit Tool for Google Cloud TTS.
-   **Visual Scene Generation:** Integrate custom Genkit Tool for DALL-E or Google Imagen.
-   Support for complex RPG systems.
-   Advanced player presence/voice activity detection.
-   Meta-talk handling.
-   Sound effects library integration.
-   Player-facing web UI (Potentially using ADK).
-   Vector DB integration.
-   Multi-campaign concurrency optimizations.
-   Dedicated UI for campaign planning.

## 13. V2 Implementation Workplan Overview (V1 Scope)

(High-level - detailed work plans need regeneration)

**Phase 1: Foundational Setup** (Unchanged)
*   Repo, Tooling, Style Guide, IaC (CFn, Eventarc, Firestore, Secrets, IAM), Firestore setup, CI/CD, Core Utilities.

**Phase 2: Core V1 Components**
*   Define Core Firestore Schemas.
*   Implement Discord Bot (Connection, Commands, **Live Voice API integration**, Storyteller calls).
*   Implement Dice Roller.
*   **No custom Genkit tools needed in V1.**

**Phase 3: Storyteller Agent (Genkit Flow - V1)**
*   Define Storyteller Flow structure.
*   Integrate **native Gemini** (Flash/Pro).
*   Integrate **native Genkit Firestore utilities**.
*   Implement Planner interaction (read/write tasks).
*   Implement rule interpretation.
*   Deploy flow.

**Phase 4: Planner Agent (Genkit Flow - V1)** (Unchanged)
*   Define Planner Flow structure.
*   Configure Eventarc trigger.
*   Integrate **native Gemini ("2.5 Pro")**.
*   Integrate **native Genkit Firestore utilities**.
*   Deploy flow.

**Phase 5: Integration, Testing & Refinement (V1)**
*   Setup Agent Simulation Test Framework.
*   Implement Unit & Integration Tests (Flows, Bot, Firestore).
*   Conduct Manual E2E Testing.
*   Implement Monitoring & Cost Tracking hooks.
*   Security Hardening.

**Phase 6: Deployment & Operations (V1)**
*   Staging/Prod Deployment.
*   Operational Runbook.
*   Final Documentation.
