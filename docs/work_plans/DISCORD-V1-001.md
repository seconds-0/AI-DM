# Work Plan: DISCORD-V1-001 - Discord Bot - Basic Setup

*   **Task ID**: DISCORD-V1-001
*   **Phase**: 2 - Core V1 Components
*   **Status**: Not Started
*   **Estimate**: 1 Day
*   **Author**: Gemini
*   **Dependencies**: SETUP-V1-001 (Project structure, TS, npm), CORE-V1-001 (Config Loader for Bot Token, Logger), INFRA-V1-002 (Bot Service Account, Cloud Run placeholder), Secret Manager (Bot token added).
*   **Related Docs**: `docs/architecture_v2.md`, `docs/product_requirements_v2.md`, `discord.js` documentation.

## Problem Statement

Implement the basic structure for the Discord bot using `discord.js`. This includes setting up the client, connecting to the Discord Gateway, handling basic lifecycle events (ready, error), registering slash commands, and setting up initial event handlers for messages and interactions (stubs).

## Components Involved

*   `src/discord/bot.ts` (Main client logic)
*   `src/discord/commandHandler.ts` (Slash command registration/handling)
*   `src/discord/index.ts` (Bot entry point)
*   `discord.js` library
*   `src/config/config.ts` (To load bot token)
*   `src/utils/logger.ts`
*   Discord API / Gateway

## Proposed Solution / Design Approach

1.  Install the `discord.js` library.
2.  Create an entry point script (`src/discord/index.ts`) that loads configuration, initializes the logger, creates the Discord client, registers commands, attaches event listeners, and logs into Discord.
3.  Implement the main bot logic (`src/discord/bot.ts`) including client instantiation with necessary intents (Guilds, GuildMessages, MessageContent, GuildVoiceStates).
4.  Add event listeners for `ClientReady` (log successful login), `Error` (log errors), `Warn` (log warnings).
5.  Implement command registration logic (`src/discord/commandHandler.ts`) to register defined slash commands (initially `/roll`, `/reset`) with Discord upon startup.
6.  Add an event listener for `InteractionCreate` to handle incoming slash command interactions, delegating to specific command handlers (initially stubs).
7.  Add an event listener for `MessageCreate` to handle regular text messages (initially just logging or ignoring).
8.  Use the Config Loader (CORE-V1-001) to securely fetch the Discord Bot Token from Secret Manager.
9.  Integrate the Logger (CORE-V1-001) for all bot logging.
10. Prepare basic Dockerfile for containerizing the bot later (for Cloud Run deployment).

## Implementation Checklist

*   [ ] `npm install discord.js`
*   [ ] Create `src/discord/index.ts`:
    *   [ ] Import necessary modules (config, logger, bot, commandHandler).
    *   [ ] Load config & initialize logger.
    *   [ ] Call command registration function.
    *   [ ] Create bot client instance.
    *   [ ] Attach event listeners from `bot.ts`.
    *   [ ] Call `client.login()` with token from config.
*   [ ] Create `src/discord/bot.ts`:
    *   [ ] Import `discord.js` (Client, GatewayIntentBits, Events).
    *   [ ] Define necessary `intents` (Guilds, GuildMessages, MessageContent, GuildVoiceStates).
    *   [ ] Create `initializeBot()` function returning a configured `Client` instance.
    *   [ ] Implement `setupEventListeners(client)` function:
        *   `client.once(Events.ClientReady, ...)`: Log bot tag and readiness.
        *   `client.on(Events.InteractionCreate, ...)`: Basic handling - check if chat input command, delegate to `commandHandler` (stub initially).
        *   `client.on(Events.MessageCreate, ...)`: Basic handling - ignore bots, log message (or ignore for V1 focus).
        *   `client.on(Events.Error, ...)`: Log errors using logger.
        *   `client.on(Events.Warn, ...)`: Log warnings using logger.
*   [ ] Create `src/discord/commandHandler.ts`:
    *   [ ] Import `discord.js` (SlashCommandBuilder, REST, Routes).
    *   [ ] Define commands array using `SlashCommandBuilder` (for `/roll`, `/reset`).
    *   [ ] Implement `registerCommands(config)` async function:
        *   Create `REST` instance.
        *   Set token.
        *   Use `Routes.applicationGuildCommands` or `applicationCommands` to PUT the command definitions (use config for clientId, potentially guildId for dev).
        *   Log success or errors.
    *   [ ] Implement `handleInteraction(interaction)` async function (stub for now - log command name).
*   [ ] Update `package.json` with a start script for the bot: `"start:bot": "ts-node src/discord/index.ts"`.
*   [ ] **Secret Management:** Ensure `DISCORD_BOT_TOKEN_SECRET` name is defined in `src/config/schema.ts` and the actual token is stored in Secret Manager (requires manual setup in GCP Console).
*   [ ] **Dockerfile (Basic):**
    *   [ ] Create `Dockerfile` in project root.
    *   [ ] Use `node:lts-alpine` base image.
    *   [ ] Set working directory, copy `package.json`, `package-lock.json`.
    *   [ ] `npm ci --only=production`.
    *   [ ] Copy `dist/` (built code).
    *   [ ] Define `CMD ["node", "dist/discord/index.js"]`.
*   [ ] Test bot locally using `npm run start:bot` (requires `.env` file with necessary config/secret names).
*   [ ] Add bot to a test Discord server.
*   [ ] Commit changes.

## Verification Steps

*   [ ] Bot starts locally without errors.
*   [ ] Bot logs in successfully and `ClientReady` event fires (logged output).
*   [ ] Slash commands (`/roll`, `/reset`) appear in the test Discord server.
*   [ ] Executing slash commands logs interaction received (stub handler).
*   [ ] Bot logs errors/warnings correctly.
*   [ ] Dockerfile builds successfully (`docker build .`).

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Register commands globally or per-guild for development? (Per-guild is faster for updates during dev, global for production).
*   Final structure of command handling delegation? (Simple switch/map initially).

## Acceptable Tradeoffs

*   Stub command handlers initially.
*   Basic error handling.
*   `MessageCreate` handler might do nothing initially.
*   Dockerfile is basic, may need optimization later.
