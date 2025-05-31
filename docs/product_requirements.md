# Product Requirements Document: LLM-Powered Tabletop RPG GM Agent (v1.0)

## 1. High-Level Goal

To create a highly immersive, natural, responsive, and engaging LLM-powered Game Master (GM) agent designed primarily for Discord-based, rules-light tabletop RPGs. The V1 complexity ceiling is defined by systems like "Nice Marines" or "Honey Heist".

The GM will deliver:

- Seamless real-time voice interactions for the primary Narrator role, prioritizing low latency.
- Distinct, expressive, and character-appropriate voices for Non-Player Characters (NPCs) via high-quality Text-to-Speech (TTS).
- Seamless text-based interaction as an alternative or supplement to voice.
- A distinct GM personality (tunable per campaign) and an adaptive, engaging storytelling style.
- Context-aware integration with player-initiated dice rolls and clear narrative interpretation of results.
- Proactive and reactive rule clarifications appropriate to player experience levels.
- Persistent, detailed contextual memory encompassing world state, character details, NPC knowledge, player knowledge, and session history.
- Deep, asynchronous narrative planning, world state evolution, and consequence analysis via a dedicated Planner agent utilizing a large context window model.
- High-quality, immersive scene visuals automatically generated based on narrative context.
- An experience built on a robust, maintainable, scalable, and cost-effective cloud backend leveraging Firebase, Google Cloud, Genkit, and OpenAI services.

## 2. Detailed Product Requirements (Per Module)

### 2.1. Personality & Player Interaction

- **GM Persona & Consistency:** The GM shall possess a distinct personality (defined via configuration prompts per campaign) and maintain this persona consistently throughout interactions within a session.
- **Player Comfort & Agency:** The GM shall acknowledge and respect reasonable player requests regarding content sensitivities (e.g., avoiding specific phobias) when communicated at the start of a session or campaign. The GM's response should be natural and affirming.
- **Interaction Clarity & Modes:**
  - _Narrator Voice (Real-time):_ Output shall be expressive, natural-sounding, and maintain the defined GM persona. Low latency is critical.
  - _NPC Voices (TTS):_ Output shall be distinctive per NPC, expressive, match configured character descriptions/style prompts, and clearly distinguishable from the Narrator voice.
  - _Text Output:_ All GM communication provided via text (either primary or as subtitles) must be explicitly clear, grammatically correct, and unambiguous.
- **Error Handling & Recovery:**
  - The primary method for handling misunderstandings or errors in interaction shall be through natural language clarification and correction within the agent's flows.
  - Explicit slash commands (e.g., `/reset`) shall be available as a fallback mechanism for severe issues or debugging. Players will be informed of these commands at the start of a session.
  - The GM (via Discord Bot Interface) shall provide explicit textual confirmation in Discord when a debug command is successfully invoked (e.g., "System: Reset command received. Attempting to reset state...").

### 2.2. Game System Layer

- **V1 Complexity Ceiling:** The system must support rulesets with mechanics comparable to "Nice Marines". Complex systems are out of scope for V1.
- **Ruleset Definition & Loading:** Game system rules defined in structured JSON format stored within `rulesets` collection in Firestore. Loaded and interpreted by the Storyteller flow.
- **Rule Reminders & Clarifications:** Handled within the Storyteller flow, adapting based on perceived player experience. Clarifications via text message should always be possible. Voice clarifications deferred naturally.

### 2.3. Narration & Story Management

- **Information Reveal & Player Knowledge Tracking:** Managed by the Storyteller flow, differentiating GM/Planner knowledge from player/character knowledge. Uses `known_info_hashes` in Firestore (`characters` document).
- **Session Flow & Interruption Handling:** Storyteller flow must handle interruptions gracefully, maintaining immersion and guiding players back.
- **Prompting & Pacing:** Storyteller narration concludes with clear prompts (handled by the flow's output generation).

### 2.4. Dice & Tool Use

- **Dice Rolling Mechanics:** Players use Discord slash commands (`/roll`). The Discord Bot Interface handles the command, uses a library for rolling, posts the numeric result.
- **Narrative Interpretation:** The numeric result is sent to the **Storyteller Genkit flow**, which is solely responsible for the narrative interpretation and state update.
- **Character/NPC Data Management:** Handled via Firestore, accessed by Genkit flows using the custom data access module and/or Genkit Firestore utilities.

### 2.5. Contextual Memory Management

- **Persistent State:** Firestore is the single source of truth.
- **Memory Structure & Detail:** Flows access current scene details from loaded state/recent logs. Older events/facts accessed from Firestore (`session_log` subcollection).
- **Recall & Recaps:** Supported by Storyteller flow querying Firestore data. Proactive recap offers at session start.

### 2.6. Session Lifecycle Management

- **Prep Phase:** Planner flow bootstraps initial state based on config, triggered during campaign setup.
- **Live Phase:** Storyteller flow manages interactive session, calling tools (LLMs, TTS, DALL-E) and reading/writing state. Pulls insights from `planner_state`.
- **Postgame Phase:** Storyteller flow triggers summary generation. Planner flow performs deeper async analysis based on completed session events.

### 2.7. Discord Integration

- **Primary Interface:** Discord text/voice channels.
- **Interaction Style:** Natural language primary. Slash commands minimal (dice, debug).
- **Accessibility:** Text subtitles generated concurrently with GM audio output (orchestrated by Storyteller flow sending text + triggering TTS).

## 3. Dual-Agent Architecture Specification (Revised for Genkit/Firebase Studio)

- **Purpose:** To optimize for both real-time responsiveness (Storyteller) and deep planning (Planner), leveraging **Genkit** for AI flow orchestration and **Firebase Studio** for management.
- **Compute Target:** Primarily **Google Cloud Functions v2** hosted via Firebase Studio for Genkit flows. Fallback to Cloud Run only if CFn v2 proves insufficient (e.g., Planner timeouts).
- **Storyteller Agent (Genkit Flow - Real-time Focus):**
  - _Responsibilities:_ Orchestrates direct player interactions (text, commands, voice events), triggers external tools (LLMs, TTS, DALL-E), updates immediate state via Firestore (using custom module/Genkit utils), manages interaction pacing.
  - _Implementation:_ **`storyteller.flow.ts`** containing Genkit flows (e.g., `handlePlayerInputFlow`, `generateNpcSpeechFlow`, `generateSceneImageFlow`) deployed to Cloud Functions v2.
  - _LLM/Tools:_ Uses **custom Genkit tools** wrapping OpenAI API (GPT-4o, DALL-E). Coordinates with client/Discord bot for Realtime voice interaction (flow handles processing, not persistent connection).
  - _Interaction with Planner:_ Reads `planner_state` from Firestore; Writes tasks to `plannerTasks` subcollection.
- **Planner Agent (Genkit Flow - Asynchronous Focus):**
  - _Responsibilities:_ Performs deep analysis based on `plannerTasks` triggers, updates `planner_state` with suggestions, evolves world state asynchronously.
  - _Implementation:_ **`planner.flow.ts`** containing Genkit flows (e.g., `analyzeSceneFlow`) deployed to Cloud Functions v2, triggered by **Eventarc** listening to Firestore `plannerTasks` creation.
  - _LLM:_ Uses **native Genkit integration for Google Gemini 2.5 Pro**.
  - _Interaction:_ Reads `world_state`, `session_log/events`, `plannerTasks` from Firestore; Writes results to `planner_state`.

## 4. Voice Interaction Architecture Specification (Revised for Genkit)

- **Purpose:** Provide distinct audio experiences for Narrator and NPCs, adapted for Genkit flows.
- **Pipeline 1: Narrator Voice (Real-Time Coordination)**
  - _Technology:_ **OpenAI `gpt-4o-realtime-preview` API** coordinated via client/bot and a **Genkit flow**.
  - _Functionality:_ Low-latency Narrator voice.
  - _Implementation:_ Client/Bot manages WebSocket connection and VAD -> Sends transcript/events to an HTTPS endpoint -> Triggers `storytellerRealtimeInputFlow` (Genkit flow on CFn v2) -> Flow processes text (potentially quick LLM call via `gpt4oTool`), determines response -> Returns instructions/audio URL (from TTS tool if needed) -> Client plays audio. **The Genkit flow orchestrates, but does not hold the WebSocket.**
  - _Fallback Mechanism:_ Use **Genkit flow** triggered by STT output -> Calls GPT-4o/Gemini tool -> Calls TTS tool -> Returns audio URL. (Fits standard request/response flow model).
- **Pipeline 2: NPC Character Voices (Expressive TTS via Genkit Tool)**
  - _Technology:_ **Google Cloud Text-to-Speech API** wrapped in a **custom Genkit tool (`gcloudTtsTool`)**.
  - _Functionality:_ Distinctive NPC voices generated asynchronously.
  - _Implementation:_ Storyteller flow calls `gcloudTtsTool` with text and parameters -> Tool calls GCloud TTS API -> Returns audio URL/data -> Storyteller flow instructs Discord Bot Interface (via HTTP response) to play the audio.

## 5. Visual Generation Specification (via Genkit Tool)

- **Technology:** **OpenAI DALL·E API** wrapped in a **custom Genkit tool (`dalleTool`)**.
- **Triggers:** Triggered contextually within the Storyteller Genkit flow.
- **Style Consistency:** Base style prompt applied within the flow/tool call.
- **Delivery:** Storyteller flow calls `dalleTool` -> Tool calls DALL-E API -> Returns image URL -> Flow instructs Discord Bot Interface (via HTTP response) to post the image.
- **Fallback:** Handled within the Genkit flow (log error, proceed without image).

## 6. Backend & Technology Stack Specification (Revised for Genkit/Firebase Studio)

- **Primary Language/Runtime:** **Node.js (using TypeScript)**.
- **AI Orchestration Framework:** **Genkit** (open-source, managed via Firebase Studio).
- **Primary Backend Platform:** **Firebase**
  - _Database:_ **Firestore**.
  - _Compute:_ **Cloud Functions v2** (via Firebase Studio/Genkit deployment). Potentially Cloud Run as fallback if needed.
  - _Management/Monitoring:_ **Firebase Studio**.
  - _Eventing:_ **Eventarc** (for Firestore triggers).
- **Core LLM APIs:**
  - _Planner Agent:_ **Google Gemini 2.5 Pro (Preview) API** (via **native Genkit integration**).
  - _Storyteller Agent (Text):_ **OpenAI GPT-4o API** (via **custom `gpt4oTool` Genkit tool**).
- **Voice APIs:**
  - _Narrator Real-time Voice:_ **OpenAI `gpt-4o-realtime-preview` API** (coordinated via Genkit flow, client manages connection).
  - _NPC TTS:_ **Google Cloud Text-to-Speech API** (via **custom `gcloudTtsTool` Genkit tool**).
  - _Fallback STT:_ **Google Cloud Speech-to-Text API** (potentially via a Genkit tool or client-side).
- **Image API:** **OpenAI DALL·E API** (via **custom `dalleTool` Genkit tool**).
- **Discord Integration:** **`discord.js`** Node.js library (running as a separate service/bot, potentially Cloud Run or other host, acting as a client to Genkit flows).
- **Task Queueing (Internal):** Firestore Subcollection (`plannerTasks`), triggering Eventarc -> Genkit Planner Flow.

## 7. Database & State Management Design (Firestore)

- **Core Principle:** Firestore is the single source of truth. Flows are largely stateless, reading/writing state from Firestore.
- **Interaction:** Flows use **Genkit's built-in Firestore utilities** for simple operations and the **custom Firestore Data Access module (`src/data/...`)** for complex queries, typed access, and standardized operations.
- **Top-Level Collections:** `campaigns`, `rulesets`, `world_states`, `session_logs`, `planner_states`.
- **Document Linking:** Via IDs.
- **Key Schemas (High-Level):** (Unchanged from original)
  - _`campaigns`_: Metadata, config, player list, status, pointers, `plannerTasks` subcollection.
  - _`rulesets`_: Game system definitions.
  - _`world_states`_: Dynamic snapshot (facts, locations, factions, `characters` map, `npcs` map).
  - _`session_logs`_: Metadata doc + `events` subcollection.
  - _`session_logs/{logId}/events`_: Chronological event documents.
  - _`planner_states`_: Planner outputs.
- **Flexibility:** Leverage Firestore schemaless nature.

## 8. Inter-Agent Communication Protocol (Flow-Based)

- **Mechanism:** Primarily via **Shared State updates in Firestore** and **Eventarc triggers** based on Firestore writes.
- **Workflow:**
  1.  Discord Bot Interface calls Storyteller Flow (CFn v2 endpoint) via HTTPS.
  2.  Storyteller Flow reads `world_state`, `planner_state` (using Genkit utils / custom module).
  3.  Storyteller Flow executes logic, calls LLM/tools (GPT-4o, DALL-E, TTS tools).
  4.  Storyteller Flow updates `world_state`, writes `LogEvent` documents to `session_logs/.../events` (using custom module / Genkit utils).
  5.  If Planner input needed, Storyteller Flow writes a task document to `plannerTasks` subcollection.
  6.  Firestore write to `plannerTasks` triggers Eventarc.
  7.  Eventarc invokes Planner Flow (CFn v2 endpoint).
  8.  Planner Flow reads task details, `world_state`, `session_log/events`.
  9.  Planner Flow calls Gemini (native Genkit integration).
  10. Planner Flow writes analysis/suggestions to `planner_state` document, updates task status document.
  11. Storyteller Flow (on subsequent invocations) reads updated `planner_state`.

## 9. Initialization & Configuration Flow

- **Mechanism:** External config file (YAML/JSON) + setup script remains valid.
- **Configuration:** Specifies `rulesetId`, GM personality, visuals, scenario brief, Firebase/GCP project config.
- **Process:** (Largely unchanged)
  1.  Run setup script.
  2.  Validates config.
  3.  Creates `campaigns`, loads `rulesets`.
  4.  Creates linked `world_state`, `session_log`, `planner_state` docs.
  5.  Assigns initial task to Planner via `plannerTasks` write.
  6.  Outputs Campaign ID.
- **Agent Startup:**
    *   **Genkit Flows:** Deployed via Firebase Studio/`genkit flow deploy`. Configuration loaded via `src/config` module within the Cloud Function environment.
    *   **Discord Bot:** Started as a separate process, points to Campaign ID and deployed flow endpoints via config.

## 10. Testing Strategy (Genkit Aware)

- **Unit Tests:** Jest/Vitest for testing functions, **Genkit tools**, custom modules (mocking dependencies).
- **Integration Tests:**
  - Test flow interactions with mocked external APIs (using Genkit mocking utilities where available).
  - Test flow interactions with Firestore Emulator (both Genkit utils and custom module).
  - Test Discord Bot interaction with mocked Genkit flow endpoints.
- **Agent Simulation (`TEST-001`):** Framework to test sequences of inputs against flows running locally (using `genkit start` with emulators), asserting actions, state changes, and outputs. **Leverage Genkit's tracing and testing features.**
- **Manual End-to-End (E2E) Testing:** Discord playtesting remains essential.
- **Load Testing (Future).**

## 11. Monitoring & Cost Tracking Requirements

- **Status:** First-Class Requirements.
- **Logging:** Structured JSON logging via `src/utils/logger`, integrated with Cloud Logging. **Leverage Genkit's built-in tracing and Firebase Studio's monitoring views.**
- **API Usage Tracking:** Implement within Genkit tools and flow logic. Log usage metrics.
- **Cost Calculation:** Cloud Function/logic based on logged metrics.
- **Session Cost Storage:** Store in `session_log` metadata.
- **Cloud Billing Alerts:** Essential.
- **Configurable Internal Limits:** Via `campaigns` config.

## 12. Future Enhancements (Punted Post-V1)

(Unchanged from original)
- Support for complex RPG systems.
- Advanced player presence/voice detection.
- Meta-talk handling.
- Sound effects library.
- Cinematic visuals.
- Player-facing web UI.
- Vector DB for memory.
- Multi-campaign concurrency.

## 13. Implementation Workplan (V1 - Genkit Based)

This section outlines the high-level workplans derived from the `docs/work_plans/workplanaggregate.md` document, reflecting the Genkit/Firebase Studio architecture. Refer to the individual workplan files for detailed checklists and status.

**Phase 1: Project Setup & Core Infrastructure**
*   `SETUP-001`: Repository Initialization and Tooling (incl. Genkit Init)
*   `STYLE-001`: Define Project Coding Style Guide (incl. Genkit Conventions)
*   `INFRA-001`: IaC Setup (Terraform - Supporting Genkit/CFn v2/Eventarc)
*   `INFRA-002`: Firestore Schema & Rules Setup (Genkit Aware)
*   `SETUP-002`: Basic CI/CD Pipeline (GitHub Actions - Incl. Genkit/TF Deploy Stubs)
*   `CORE-001`: Core Utility Modules (Logging, Config - Genkit Compatible)

**Phase 2: Core Component Implementation**
*   `CORE-002`: Firestore Data Access Module (V1 Schemas - Hybrid Approach)
*   `CORE-003`: Discord Bot Interface (Basic Connection & Target Genkit Flows)
*   `CORE-004`: Dice Roller Integration (Calls Storyteller Flow if needed)
*   `TOOL-001-OPENAI-GPT4O`: Create Custom Genkit Tool for OpenAI GPT-4o API
*   `TOOL-002-OPENAI-DALLE`: Create Custom Genkit Tool for OpenAI DALL-E API
*   `TOOL-003-GCLOUD-TTS`: Create Custom Genkit Tool for Google Cloud TTS API

**Phase 3: Storyteller Agent Implementation (Genkit Flows)**
*   `AGENT-001-GENKIT`: Define Storyteller Genkit Flows & Base Deployment (CFn v2)
*   `AGENT-003-GENKIT`: Integrate `gpt4oTool` into Storyteller Flow
*   `AGENT-005-GENKIT-TTS`: Integrate `gcloudTtsTool` into Storyteller Flow
*   `AGENT-006-GENKIT-DALLE`: Integrate `dalleTool` into Storyteller Flow
*   `AGENT-007-REALTIME`: Design/Implement Realtime Voice Orchestration (Flow/Client Interaction)
*   `AGENT-009-STORYTELLER-CONTEXT`: Implement Storyteller Context Handling (State Loading, History Mgt in Flow)
*   `AGENT-010-STORYTELLER-RULES`: Implement Rule Interpretation Logic in Flow
*   `AGENT-011-STORYTELLER-KNOWLEDGE`: Implement Player Knowledge Tracking in Flow
*   `AGENT-012-STORYTELLER-PLANNER-INT`: Implement Storyteller <-> Planner Interaction (Read `planner_state`, Write `plannerTasks`)

**Phase 4: Planner Agent Implementation (Genkit Flow)**
*   `AGENT-002-GENKIT`: Define Planner Genkit Flow & Eventarc Trigger (CFn v2)
*   `AGENT-004-GENKIT`: Integrate Gemini Natively via Genkit in Planner Flow
*   `AGENT-008-PLANNER-CONTEXT`: Implement Planner Contextual Analysis (Fetching Firestore data for prompts)

**Phase 5: Integration, Testing & Refinement**
*   `TEST-001`: Agent Simulation Test Framework Setup (Genkit Aware)
*   `TEST-002-UNIT-COVERAGE`: Implement Comprehensive Unit Tests (Modules, Tools, Flows)
*   `TEST-003-INTEGRATION`: Implement Full Integration Tests (Flows, Firestore Emulator, Mocks)
*   `TEST-004-E2E-MANUAL`: Plan and Execute Manual E2E Testing
*   `MONITOR-001`: Monitoring & Alerting Implementation (Leveraging Studio/Cloud Monitoring)
*   `MONITOR-002`: Cost Tracking Implementation (Via Logs/Metrics)
*   `SECURE-001`: Security Hardening (Firestore Rules Refinement, IAM Review)

**Phase 6: Deployment & Operations Setup**
*   `DEPLOY-001`: Staging Environment Deployment & Validation
*   `DEPLOY-002`: Production Environment Deployment (Via IaC / Genkit Deploy)
*   `DEPLOY-003`: Operational Runbook & Backup/Restore Procedures
*   `DOCS-001`: Final Documentation Updates (Readme, Architecture)
