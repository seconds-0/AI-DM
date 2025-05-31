# Work Plan: DISCORD-V1-004 - Discord Bot - Dice Roller Command

*   **Task ID**: DISCORD-V1-004
*   **Phase**: 2 - Core V1 Components
*   **Status**: Not Started
*   **Estimate**: 0.5 Days
*   **Author**: Gemini
*   **Dependencies**: DISCORD-V1-001 (Command registration/handling structure), DISCORD-V1-003 (Mechanism to call Storyteller flow).
*   **Related Docs**: `docs/product_requirements_v2.md` (Section 2.4)

## Problem Statement

Implement the functionality for the `/roll` slash command within the Discord Bot. This involves parsing standard dice notation (e.g., `2d6`, `1d20+3`), performing the dice roll calculation, posting the numerical result back to the Discord channel, and triggering a call to the Storyteller flow to allow for narrative interpretation of the result.

## Components Involved

*   `src/discord/commandHandler.ts` (Update `/roll` handler)
*   Dice parsing/rolling library (e.g., `dice-parser`, `roll` or similar, or custom logic)
*   `discord.js` (Interaction Reply)
*   `src/discord/storytellerClient.ts` (To call Storyteller flow)

## Proposed Solution / Design Approach

1.  **Choose Dice Library:** Select and install a suitable Node.js library for parsing dice notation and calculating results (e.g., `dice-parser`). Alternatively, implement basic parsing logic if needs are very simple (e.g., only `XdY+Z` format).
2.  **Update Command Registration:** Ensure the `/roll` command in `commandHandler.ts` defines an option (e.g., type `STRING`, name `notation`, description `Dice to roll (e.g., 2d6, 1d20+3)`) to accept the dice string.
3.  **Implement Roll Logic:** In the `handleInteraction` function (or a dedicated handler for `/roll`):
    *   Extract the `notation` option value from the interaction.
    *   Use the chosen library (or custom logic) to parse the notation and calculate the numerical result.
    *   Handle potential parsing errors (invalid notation).
4.  **Post Result to Discord:** Use `interaction.reply()` to immediately send a message back to the Discord channel showing the original notation and the numerical result (e.g., `PlayerName rolled 2d6+1: Result = 9`). Make this reply ephemeral only if privacy is a concern, otherwise public.
5.  **Trigger Storyteller:** After posting the result, call the `callStorytellerFlow` function (from DISCORD-V1-003) with a payload indicating a dice roll occurred, including the notation, the result, the user ID, and campaign context.

## Implementation Checklist

*   [ ] Choose and install a dice parsing library: `npm install dice-parser` (or alternative).
*   [ ] **Update `src/discord/commandHandler.ts`:**
    *   [ ] Modify the `SlashCommandBuilder` for `/roll`:
        *   `.addStringOption(option => option.setName('notation').setDescription('Dice to roll (e.g., 2d6, 1d20+3)').setRequired(true))`
    *   [ ] Update `handleInteraction` (or delegate to a specific `/roll` handler function):
        *   Check `interaction.commandName === 'roll'`.
        *   `const notation = interaction.options.getString('notation', true);`
        *   `const userId = interaction.user.id;`
        *   `const userName = interaction.user.username;`
        *   `try { ... } catch (error) { ... }` block for parsing/rolling.
        *   Inside try:
            *   Use dice library: `const rollResult = DiceParser.roll(notation);` (Adapt based on chosen library API).
            *   Format result string: `const resultMessage = \`**${userName}** rolled ${notation}: Result = **${rollResult.total}**\`;` (Adjust based on library output).
            *   Reply to interaction: `await interaction.reply(resultMessage);`.
            *   Prepare payload for Storyteller: `const payload = { type: 'diceResult', userId, campaignId: 'TODO', notation, result: rollResult.total };` (Get `campaignId` from context).
            *   Call Storyteller: `await callStorytellerFlow(payload);`.
        *   Inside catch (parsing/rolling error):
            *   Log the error.
            *   Reply with error: `await interaction.reply({ content: 'Invalid dice notation. Please use standard format (e.g., 1d20, 2d6+3).', ephemeral: true });`.
*   [ ] **Testing:**
    *   [ ] Add unit tests for the roll handling logic (mocking dice library, interaction object, `callStorytellerFlow`). Test valid and invalid notations.
    *   [ ] Manual test in Discord: Use `/roll` with various valid and invalid notations, verify the public result message, and check Storyteller flow logs (once available) for the incoming 'diceResult' event.

## Verification Steps

*   [ ] `/roll` command works in Discord with valid notation (e.g., `1d6`, `2d20+5`).
*   [ ] Bot replies immediately with the correct numerical result in the channel.
*   [ ] Bot sends an appropriate error message for invalid dice notation.
*   [ ] Bot successfully calls the (mocked or real) Storyteller flow with the correct payload after posting the result (check logs).
*   [ ] Unit tests for roll handling pass.

## Decision Authority

Lead Engineer (self)

## Questions / Uncertainties

*   Which dice parsing library is best suited? (`dice-parser` seems reasonable).
*   How to get `campaignId` context within the interaction handler? (May need to fetch based on channel or have it stored/passed).

## Acceptable Tradeoffs

*   Using a simple dice library that covers common notations.
*   Basic error message for invalid notation.
*   Assuming public reply for roll results is acceptable.
