# Work Plan: DISCORD-V1-002 - Discord Bot - Live Voice API Integration

*   **Task ID**: DISCORD-V1-002
*   **Phase**: 2 - Core V1 Components
*   **Status**: Not Started
*   **Estimate**: 3 Days
*   **Author**: Gemini
*   **Dependencies**: DISCORD-V1-001 (Bot structure, client), CORE-V1-001 (Config, Logger), INFRA-V1-002 (Bot SA with permissions for Voice API - TBD), Google Live Voice API documentation & SDK/Client library (Node.js if available, otherwise REST/gRPC details).
*   **Related Docs**: `docs/architecture_v2.md` (Sections 4, 5.3, 7.2), `docs/product_requirements_v2.md` (Section 4).

## Problem Statement

Integrate the Google Live Voice API into the Discord Bot. The bot needs to manage the bidirectional audio stream: capture user audio from a Discord voice channel, stream it to the Live Voice API, receive the audio response from the API, play it back into the Discord channel, and handle the final transcript/result upon interaction completion.

## Components Involved

*   `src/discord/liveVoiceHandler.ts` (New module)
*   `src/discord/bot.ts` (Event listeners for voice state, potentially commands)
*   `discord.js` (Voice channel management, audio streams)
*   Google Live Voice API Client (Node.js, likely direct WebSocket implementation for `wss://generativelanguage.googleapis.com/.../BidiGenerateContent` endpoint, or verify if `@google/generative-ai` SDK adequately supports this specific audio streaming use case)
*   `@discordjs/voice` library (For managing Discord voice connections and streams)
*   `src/config/config.ts` (API keys/endpoints for Live Voice API)
*   `src/utils/logger.ts`

## Proposed Solution / Design Approach

1.  **Install Dependencies:** Add `@discordjs/voice` and any necessary Google Cloud client libraries for the Live Voice API.
2.  **Voice Channel Connection Management:**
    *   Implement logic (likely triggered by a command like `/join` or automatically on specific events) for the bot to join the user's current voice channel using `@discordjs/voice` (`joinVoiceChannel`).
    *   Manage the voice connection state (`VoiceConnection`).
3.  **Audio Streaming (Discord -> Live Voice API):**
    *   Once connected, get the audio stream (`receiver.subscribe`) for a user (or potentially combined stream, TBD based on API needs).
    *   Set up the WebSocket connection to the Gemini Live API endpoint (e.g., `wss://generativelanguage.googleapis.com/ws/.../BidiGenerateContent`). This may involve direct WebSocket client usage if the standard `@google/generative-ai` SDK does not fully support the required audio streaming and message exchange protocol for `BidiGenerateContent`.
    *   Investigate and confirm the audio encoding format(s) (e.g., LINEAR16, Opus) accepted by the Gemini Live API for the `audio` field in `BidiGenerateContentRealtimeInput`. Implement transcoding from Discord's Opus stream if necessary.
    *   Pipe/forward the Opus audio stream from Discord (potentially needing transcoding if the API requires a different format like LINEAR16) to the Live Voice API input stream.
4.  **Audio Streaming (Live Voice API -> Discord):**
    *   Receive the audio stream output from the Live Voice API.
    *   Create an `AudioPlayer` using `@discordjs/voice`.
    *   Subscribe the `VoiceConnection` to the `AudioPlayer`.
    *   Create an `AudioResource` from the Live Voice API's output stream (potentially needing format conversion) and play it using the `AudioPlayer`.
5.  **Interaction Lifecycle & Transcript Handling:**
    *   Manage the bidirectional stream lifecycle according to the Live Voice API's protocol (start, send audio chunks, receive audio chunks, receive final transcript/result, end stream).
    *   Implement handlers for API events (e.g., speech detected, response ready, transcript available, error).
    *   Store the final transcript/result received from the API.
6.  **Integration with Storyteller:**
    *   Once a voice interaction turn is complete and the final transcript/result is received from the Live Voice API, trigger the call to the Storyteller Flow (implemented in DISCORD-V1-003) passing this data.
7.  **Error Handling:** Implement robust error handling for voice connection issues, API connection errors, streaming errors, and API-reported errors.
8.  **Configuration:** Load necessary API keys, endpoint URLs, or other configuration for the Live Voice API via the Config Loader.

## Implementation Checklist

*   [ ] `npm install @discordjs/voice @google-cloud/live-voice-api` (Or equivalent SDK/library if available).
*   [ ] **Configuration:**
    *   [ ] Add necessary Live Voice API config (e.g., API Key secret name) to `src/config/schema.ts`.
    *   [ ] Ensure Bot SA has permissions to call Live Voice API (Add IAM bindings in `infra/iam.tf` - **Specific roles TBD**).
*   [ ] **Voice Connection (`src/discord/bot.ts`, `src/discord/liveVoiceHandler.ts`):**
    *   [ ] Add a command (e.g., `/join`) to trigger joining the user's voice channel.
    *   [ ] Implement `joinChannel(interaction)`: get user's channel, use `joinVoiceChannel`, store connection.
    *   [ ] Implement `leaveChannel()`: destroy connection, cleanup resources.
    *   [ ] Handle voice connection status changes and errors.
*   [ ] **Live Voice API Client Setup (`src/discord/liveVoiceHandler.ts`):**
    *   [ ] Instantiate the Live Voice API client using credentials/config.
    *   [ ] Implement function to establish the bidirectional stream connection.
*   **Audio Streaming Logic (`src/discord/liveVoiceHandler.ts`):**
    *   [ ] On voice connection ready, subscribe to user's speaking events/streams (`connection.receiver.subscribe`).
    *   [ ] **(Challenge)** Pipe Discord Opus stream to Live Voice API input stream (handle potential transcoding if needed - e.g., using `prism-media` or similar).
    *   [ ] Set up `AudioPlayer` (`createAudioPlayer`) and subscribe connection (`connection.subscribe`).
    *   [ ] Handle incoming audio stream from Live Voice API.
    *   [ ] Create `AudioResource` (`createAudioResource`) from the API's stream.
    *   [ ] Play the resource using `player.play()`. Handle playback state changes (idle, playing, error).
*   **Transcript/Result Handling (`src/discord/liveVoiceHandler.ts`):**
    *   [ ] Implement logic based on API events to capture the final transcript/result at the end of an interaction turn.
    *   [ ] Store the result temporarily.
    *   [ ] **Trigger Storyteller call:** Once result is received, call the (yet to be fully implemented) function from DISCORD-V1-003, passing the transcript, userId, campaignId etc.
*   **Error Handling:**
    *   [ ] Add try/catch blocks and event listeners for errors in voice connection, API connection, streaming, playback.
    *   [ ] Implement basic retry logic or graceful failure messages (using Bot text messages).
*   **Testing:**
    *   [ ] **(Challenge)** Unit testing streaming logic is complex. Focus on testing connection setup, state management, and trigger points (mocking API/Discord voice internals).
    *   [ ] Manual testing: Bot joins channel, user speaks, bot plays back *something* (even if just test audio initially), transcript is logged/received.

## Verification Steps

*   [ ] Bot successfully joins the voice channel when commanded.
*   [ ] Bot appears to stream user audio (requires observing network traffic or API logs/metrics).
*   [ ] Bot plays back audio received from the (mocked or real) Live Voice API.
*   [ ] Bot logs or otherwise indicates receipt of a final transcript/result from the API after user stops speaking.
*   [ ] Bot handles voice connection errors and API errors gracefully (logs errors, potentially posts status message).
*   [ ] Bot leaves the voice channel cleanly when commanded.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   **Availability & Interface of Live Voice API Node.js Client:** Confirm if the standard `@google/generative-ai` Node.js client directly supports the stateful, bidirectional audio streaming over WebSockets required by the Gemini Live API (`BidiGenerateContent`), or if direct WebSocket client implementation is necessary. Clarify the exact message schema and lifecycle management (e.g., handling `BidiGenerateContentSetup`, `RealtimeInput`, `ServerContent` messages).
*   **Audio Format Compatibility:** **Crucially, determine if the Gemini Live API accepts Discord's Opus format directly for the `audio` field in `BidiGenerateContentRealtimeInput`.** If not, transcoding (e.g., to LINEAR16) is required, adding complexity and latency. This needs to be confirmed during initial implementation.
*   **API Authentication:** Exact mechanism for authenticating the streaming API call (API Key? ADC with SA?).
*   **Interaction Turn Detection:** How reliably does the API signal the end of a user's utterance and the availability of the final transcript?
*   **Handling Multiple Users:** Does the bot need to handle simultaneous speakers or manage separate streams per user? (Assume single active stream focus for V1 simplifies). Needs clarification based on API capabilities.
*   **Permissions:** Exact IAM roles needed for the Bot SA to use the Live Voice API.

## Acceptable Tradeoffs

*   Initial implementation might use placeholder audio playback instead of real API output for testing flow.
*   Basic error handling initially.
*   Assuming single-speaker interaction simplifies stream management significantly for V1.
*   Potential need for manual protocol implementation if SDK is unavailable.

