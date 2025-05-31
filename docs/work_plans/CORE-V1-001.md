# Work Plan: CORE-V1-001 - Core Utility Modules (Logger, Config Loader)

*   **Task ID**: CORE-V1-001
*   **Phase**: 1 - Foundational Setup
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Project structure, TS), INFRA-V1-001 (Secret Manager placeholders exist), INFRA-V1-002 (IAM roles for secret access), STYLE-V1-001 (Logging standards defined).
*   **Related Docs**: `docs/architecture_v2.md` (Sections 5.9, 9.8, 11.1), `docs/STYLE_GUIDE.md`

## Problem Statement

Implement reusable core utility modules for standardized structured logging integrated with Google Cloud Logging, and for loading application configuration from environment variables and Google Secret Manager. These modules must be compatible with both Genkit flows running in Cloud Functions and the Discord bot running in Cloud Run.

## Components Involved

*   `src/utils/logger.ts` (New module)
*   `src/config/config.ts` (New module)
*   `src/config/schema.ts` (New module for Zod schema)
*   `pino` library
*   `pino-pretty` (for local dev logging)
*   `dotenv` library
*   `@google-cloud/secret-manager` library
*   `zod` library
*   Google Cloud Logging
*   Google Secret Manager

## Proposed Solution / Design Approach

1.  **Logger (`src/utils/logger.ts`):**
    *   Use `pino` for high-performance structured logging.
    *   Configure `pino` to output JSON formatted according to Google Cloud Logging expectations (severity mapping, message field).
    *   In development (e.g., `NODE_ENV !== 'production'`), pipe output through `pino-pretty` for readable local logs.
    *   Create a singleton logger instance exported for use throughout the application.
    *   Provide helper functions or demonstrate pattern to inject context (like `campaignId`, `traceId`) into log entries where available.
2.  **Config Loader (`src/config/`):**
    *   Define a Zod schema (`src/config/schema.ts`) representing the expected application configuration (e.g., `NODE_ENV`, `GCP_PROJECT_ID`, `DISCORD_BOT_TOKEN_SECRET`, `STORYTELLER_FLOW_URL`, etc.).
    *   Create a `config.ts` module that:
        *   Loads environment variables (using `dotenv` for local development via `.env` file).
        *   Fetches necessary secrets from Google Secret Manager based on names defined in the schema/env vars (using `@google-cloud/secret-manager`). Ensure this works with the runtime service account's permissions.
        *   Validates the loaded configuration against the Zod schema.
        *   Exports a frozen, validated configuration object for application-wide use.
        *   Handles potential errors during loading (e.g., missing secrets, invalid values) by throwing a critical error on startup.
    *   Ensure `.env` file is added to `.gitignore`.

## Implementation Checklist

*   **Logger:**
    *   [ ] `npm install pino`
    *   [ ] `npm install --save-dev pino-pretty @types/pino`
    *   [ ] Create `src/utils/logger.ts`.
    *   [ ] Configure `pino` instance:
        *   Set `level` based on `process.env.LOG_LEVEL` or a default ('info').
        *   Use `formatters` to map levels (`pinoLevel` to `severity`).
        *   Set `messageKey: 'message'`.
        *   Conditionally set `transport` to use `pino-pretty` if `process.env.NODE_ENV !== 'production'`.
    *   [ ] Export the configured logger instance.
    *   [ ] Add basic unit tests for logger creation and formatting (optional but good).
    *   [ ] Document usage pattern for adding context in `STYLE_GUIDE.md`.
*   **Config Loader:**
    *   [ ] `npm install dotenv zod @google-cloud/secret-manager`
    *   [ ] Create `.env.example` file listing required environment variables.
    *   [ ] Create `.env` file for local development (add to `.gitignore`). Populate with local/dev values (e.g., placeholder secret names).
    *   [ ] Create `src/config/schema.ts`:
        *   Define Zod schema (`configSchema`) covering all expected env vars and secret values.
        *   Include transformations if needed (e.g., string to number).
        *   Define required secrets (e.g., `discordBotTokenSecret: z.string()`).
    *   [ ] Create `src/config/config.ts`:
        *   Import `configSchema`.
        *   Load `.env` using `dotenv.config()`.
        *   Instantiate `SecretManagerServiceClient`.
        *   Implement async function `loadSecrets()`:
            *   Iterate through required secret names.
            *   Construct full secret path (e.g., `projects/${process.env.GCP_PROJECT_ID}/secrets/${secretName}/versions/latest`).
            *   Call `accessSecretVersion` for each.
            *   Decode payload (base64).
            *   Return map of secret names to values.
        *   Implement async `loadConfig()` function:
            *   Get secrets using `loadSecrets()`.
            *   Combine `process.env` and loaded secrets into a single object.
            *   Parse/validate using `configSchema.parse()`.
            *   Return the validated config.
        *   Call `loadConfig()` at module initialization (top-level await or an async getter pattern).
        *   Export the frozen, validated config object.
    *   [ ] Add unit tests for config loading logic (mocking `process.env`, `SecretManagerServiceClient`).
*   **Integration:**
    *   [ ] Ensure Service Accounts (from INFRA-V1-002) have `roles/secretmanager.secretAccessor` binding added in Terraform (`infra/iam.tf`). Re-apply Terraform (`terraform apply`).
    *   [ ] **Manual Step:** Add at least one test secret version in Secret Manager via GCP Console for the Dev project.
    *   [ ] Test config loading in a simple local script (`ts-node test-config.ts`) and potentially a basic Genkit flow running locally (`npx genkit start`).

## Verification Steps

*   [ ] **Command:** `npm run test` (assuming unit tests exist for config loader) - **Expected:** Tests pass, verifying schema validation and mock secret fetching.
*   [ ] **Command:** `NODE_ENV=development ts-node src/utils/logger-test.ts` (Create simple test script) - **Expected:** Outputs human-readable (pretty-printed) logs to console.
*   [ ] **Command:** `NODE_ENV=production ts-node src/utils/logger-test.ts` - **Expected:** Outputs structured JSON logs to console.
*   [ ] **Command:** `ts-node src/config/config-test.ts` (Create script to load & print config) - **Expected:** Script runs successfully, prints config loaded from `.env`. Throws error if `.env` is invalid.
*   [ ] **Integration Test (Local):** Run a basic Genkit flow (`npx genkit start`, invoke flow) that imports and uses the config. Ensure SA key or ADC is configured for local testing. **Expected:** Flow runs, successfully loads config including fetching the manually added secret from Secret Manager (verify via logs or flow output).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Best pattern for handling async config loading at module top-level? (Async getter or top-level await).
*   Need to confirm exact secret names required for V1.

## Acceptable Tradeoffs

*   Basic logger context injection initially.
*   Error handling on startup might be simple initially (just crash).
