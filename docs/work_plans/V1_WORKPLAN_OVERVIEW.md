# V1 Implementation Work Plan Overview

This document outlines the high-level phases and epics (work plans) for building the V1 LLM-Powered TTRPG GM Agent, as defined in `docs/product_requirements_v2.md` and `docs/architecture_v2.md` (V1 Scope).

**Core V1 Technologies:** Genkit, Firebase Studio, Cloud Functions v2, Firestore (Native Genkit Utilities), Eventarc, Gemini Models (Native Genkit Integration), Google Live Voice API, Discord.js, Node.js/TypeScript, Terraform.

**V1 Exclusions:** Distinct NPC voices (TTS Tool), Image Generation (DALL-E Tool).

## Phase 1: Foundational Setup (Genkit/Firebase Native)

**Goal:** Establish the repository, core tooling, cloud infrastructure, CI/CD basics, and essential utilities needed for development.

*   **`SETUP-V1-001`:** Repository Initialization & Core Tooling (Node, TS, Git, Genkit CLI)
*   **`STYLE-V1-001`:** Define Project Coding Style Guide (TypeScript, Genkit Conventions)
*   **`INFRA-V1-001`:** IaC Setup (Terraform: Core GCP Project, IAM, GCS Backend, Artifact Registry, Secret Manager Placeholders)
*   **`INFRA-V1-002`:** IaC Setup (Terraform: Firestore Instance, Basic Rules, Eventarc Placeholders, CFn v2 Placeholders, Cloud Run Placeholders, Necessary APIs Enabled)
*   **`SETUP-V1-002`:** Basic CI/CD Pipeline (GitHub Actions: Lint, Build, Test Stubs, Deploy Infra via TF)
*   **`CORE-V1-001`:** Core Utility Modules (Structured Logger, Config Loader w/ Secret Manager Integration)
*   **`CORE-V1-002`:** Core Firestore Schema Definitions (TypeScript Interfaces in `src/data/schemas.ts`)

## Phase 2: Core V1 Components

**Goal:** Implement the essential standalone components required for the V1 experience.

*   **`DISCORD-V1-001`:** Discord Bot - Basic Setup (Connection, Command Registration, Event Handling Stubs)
*   **`DISCORD-V1-002`:** Discord Bot - Live Voice API Integration (Connect/Stream Audio, Handle Transcripts)
*   **`DISCORD-V1-003`:** Discord Bot - Storyteller Flow Integration (Make Authenticated HTTPS Calls)
*   **`DISCORD-V1-004`:** Discord Bot - Dice Roller Command (`/roll` implementation)

## Phase 3: Storyteller Agent (Genkit Flow - V1)

**Goal:** Implement the core real-time logic processing flow.

*   **`AGENT-V1-STORY-001`:** Define Storyteller Genkit Flow - Basic Structure & Deployment (HTTPS Trigger, Input Parsing - Zod)
*   **`AGENT-V1-STORY-002`:** Integrate Native Gemini Model (e.g., "2.5 Flash") for Core Narration/Logic.
*   **`AGENT-V1-STORY-003`:** Integrate Native Genkit Firestore Utilities for State Reading (WorldState, Characters, etc.).
*   **`AGENT-V1-STORY-004`:** Integrate Native Genkit Firestore Utilities for State Writing (WorldState Updates, Session Events).
*   **`AGENT-V1-STORY-005`:** Implement Planner Interaction Logic (Reading `planner_state`, Writing `plannerTasks` via Firestore Utils).
*   **`AGENT-V1-STORY-006`:** Implement Game Rule Interpretation Logic (Using loaded `rulesets` data).

## Phase 4: Planner Agent (Genkit Flow - V1)

**Goal:** Implement the asynchronous deep planning agent.

*   **`AGENT-V1-PLAN-001`:** Define Planner Genkit Flow - Basic Structure & Deployment (Eventarc Trigger via Firestore).
*   **`AGENT-V1-PLAN-002`:** Integrate Native Gemini Model (e.g., "2.5 Pro") for Analysis.
*   **`AGENT-V1-PLAN-003`:** Integrate Native Genkit Firestore Utilities for Reading Context (Task Details, WorldState, Session Logs).
*   **`AGENT-V1-PLAN-004`:** Integrate Native Genkit Firestore Utilities for Writing Results (`planner_state`).

## Phase 5: Integration, Testing & Refinement (V1)

**Goal:** Ensure all components work together correctly, implement robust testing, monitoring, and security.

*   **`TEST-V1-001`:** Agent Simulation Test Framework Setup (Leveraging Genkit Test Utils, Firestore Emulator).
*   **`TEST-V1-002`:** Implement Unit Tests (Utilities, Bot Handlers, Flow Helpers).
*   **`TEST-V1-003`:** Implement Integration Tests (Flows <-> Firestore Emulator, Flow Input/Output, Bot <-> Mocked Flow Endpoint).
*   **`TEST-V1-004`:** Plan and Execute Manual E2E Testing (Discord Voice/Text Focus).
*   **`MONITOR-V1-001`:** Monitoring & Alerting Implementation (Cloud Monitoring Metrics/Alerts via Terraform, Genkit Trace Integration).
*   **`MONITOR-V1-002`:** Cost Tracking Implementation Hooks (Logging key API calls/resource usage).
*   **`SECURE-V1-001`:** Security Hardening (Refine Firestore Rules, IAM Roles, Review Dependencies).

## Phase 6: Deployment & Operations (V1)

**Goal:** Deploy the V1 application to staging/production and establish operational procedures.

*   **`DEPLOY-V1-001`:** Staging Environment Deployment & Validation.
*   **`DEPLOY-V1-002`:** Production Environment Deployment (Via CI/CD, Manual Approval).
*   **`DEPLOY-V1-003`:** Operational Runbook & Backup/Restore Procedures (Documentation).
*   **`DOCS-V1-001`:** Final Documentation Updates (Readme, Architecture Doc Consolidation).
