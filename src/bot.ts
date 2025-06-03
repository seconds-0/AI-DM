import { Client, GatewayIntentBits, Events, Interaction, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, VoiceConnectionStatus, entersState, AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';
import axios from 'axios';
// import { SpeechClient } from '@google-cloud/speech'; // Placeholder for Google Speech-to-Text / Live Voice API
// import { TextToSpeechClient } from '@google-cloud/text-to-speech'; // Placeholder for Google Text-to-Speech

// --- Configuration Placeholders ---
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || 'YOUR_DISCORD_BOT_TOKEN';
const STORYTELLER_FLOW_URL = process.env.STORYTELLER_FLOW_URL || 'http://127.0.0.1:3400/storytellerFlow';
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (DISCORD_BOT_TOKEN === 'YOUR_DISCORD_BOT_TOKEN') {
  console.warn("Discord bot token is not set. Please set DISCORD_BOT_TOKEN environment variable.");
}
if (!STORYTELLER_FLOW_URL.startsWith('http')) {
    console.warn("STORYTELLER_FLOW_URL might be invalid. It should be a valid URL.");
}
if (!GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. Google Cloud services may not work.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

interface ActiveConnection {
    connection: VoiceConnection;
    player: any; // AudioPlayer
    voiceChannelId: string;
    userId?: string; // User who initiated the session or is currently interacting
    campaignId?: string;
    // Potentially add a state here: 'listening_for_user', 'speaking_gm_narrative', 'processing_storyteller'
}
const activeConnections = new Map<string, ActiveConnection>();

/**
 * Simulates interaction with Google Live Voice API.
 * If textToSpeak is provided, it "speaks" that text (simulated) and returns it as gmActuallySpoke.
 * Then, it "listens" for user speech (simulated) and returns a userTranscript.
 */
async function handleLiveVoiceInteraction(
    _discordVoiceConnection: VoiceConnection, // Used to ensure we have a connection context
    campaignId: string,
    userId: string,
    textToSpeak?: string // Text the GM/Narrator should speak
): Promise<{ userTranscript?: string; gmActuallySpoke?: string; error?: string }> {
    console.log(`[${campaignId}] Handling live voice interaction for user ${userId}. Text to Speak (GM): "${textToSpeak || 'None'}"`);

    let gmSpokenOutput: string | undefined = undefined;

    // Part 1: GM Speaking (if textToSpeak is provided)
    if (textToSpeak) {
        console.log(`[${campaignId}] Simulating GM/Narrator speaking: "${textToSpeak}" (TTS and audio playback would be here)`);
        // In a real implementation:
        // 1. Send textToSpeak to Google Live Voice API (or TTS API).
        // 2. Receive audio stream.
        // 3. Play audio stream through discordVoiceConnection using an AudioPlayer.
        await new Promise(resolve => setTimeout(resolve, 1500 + (textToSpeak.length * 50))); // Simulate delay for speech
        gmSpokenOutput = textToSpeak;
        console.log(`[${campaignId}] GM/Narrator finished speaking.`);
    }

    // Part 2: Listening for Player Speech
    // This part would involve listening to the voice channel for the user's speech.
    // For simulation, we'll assume the user says something after the GM finishes or if no GM text was spoken.
    console.log(`[${campaignId}] Simulating user ${userId} speaking... (voice activity detection & STT would be here)`);
    // Simulate a delay for user to speak
    await new Promise(resolve => setTimeout(resolve, 3000)); 
    // This is where a real STT would provide the transcript.
    // For V1, the user will use `/speak` command after GM finishes.
    // So, this function might not even return a userTranscript in this refined model if it's purely for GM speaking.
    // However, the original PRD implies a bidirectional API. So we keep the structure.
    const simulatedUserTranscript = `User utterance after GM: "${gmSpokenOutput || 'nothing specific'}"`; // Placeholder
    console.log(`[${campaignId}] Simulated user transcript: "${simulatedUserTranscript}"`);
    
    return { userTranscript: simulatedUserTranscript, gmActuallySpoke: gmSpokenOutput };
}


async function speakTextViaLiveAPI(
    connection: VoiceConnection,
    campaignId: string,
    textToSpeak: string
): Promise<{ spokenText: string; error?: string}> {
    console.log(`[${campaignId}] speakTextViaLiveAPI called. Text: "${textToSpeak}"`);
    // This is a simplified version focusing only on TTS output for the GM.
    // In a real scenario, this would integrate with Google Live Voice API or a TTS service.
    // For simulation:
    const audioPlayer = (activeConnections.get(connection.joinConfig.guildId) as ActiveConnection)?.player;
    if (!audioPlayer) {
        return {spokenText: "", error: "Audio player not found for connection."};
    }
    
    console.log(`[${campaignId}] Simulating TTS and playback for: "${textToSpeak}"`);
    // Placeholder: Imagine `textToSpeak` is converted to an audio stream and played.
    // const audioResource = createAudioResource(...); // From actual TTS audio stream
    // audioPlayer.play(audioResource);
    // await entersState(audioPlayer, AudioPlayerStatus.Idle, 60e3); // Wait for speech to finish
    await new Promise(resolve => setTimeout(resolve, 1000 + (textToSpeak.length * 50))); // Simulate speech duration
    
    console.log(`[${campaignId}] Finished speaking: "${textToSpeak}"`);
    return { spokenText: textToSpeak };
}


async function processStorytellerInteraction(
    userTranscript: string,
    userId: string,
    campaignId: string,
    guildId: string,
    channelId: string, // Text channel for OOC messages or fallbacks
    interaction?: Interaction // Optional: For replying to initial interactions
): Promise<void> {
    console.log(`[${campaignId}] Processing storyteller interaction. User: ${userId}, Transcript: "${userTranscript}"`);

    try {
        const response = await axios.post(STORYTELLER_FLOW_URL, {
            transcript: userTranscript,
            userId: userId,
            campaignId: campaignId,
        });

        const { narrative_response, gm_text_response, status, error_message } = response.data;

        if (status === 'error') {
            console.error(`[${campaignId}] Storyteller flow returned an error: ${error_message}`);
            const channel = client.channels.cache.get(channelId);
            if (channel?.isTextBased()) {
                channel.send(`The storyteller seems to have encountered an issue: ${error_message}`);
            }
            return;
        }

        console.log(`[${campaignId}] Storyteller response: Narrative: "${narrative_response}", GM Text: "${gm_text_response}"`);
        const textChannel = client.channels.cache.get(channelId);

        if (gm_text_response) {
            if (textChannel?.isTextBased()) {
                textChannel.send(`**GM (OOC):** ${gm_text_response}`);
            }
        }

        const connectionDetails = activeConnections.get(guildId);

        if (connectionDetails && connectionDetails.connection && narrative_response) {
            console.log(`[${campaignId}] Active voice connection found. Attempting to speak narrative: "${narrative_response}"`);
            
            // Use speakTextViaLiveAPI to make the GM speak the narrative.
            const speakResult = await speakTextViaLiveAPI(connectionDetails.connection, campaignId, narrative_response);

            if (speakResult.error) {
                console.error(`[${campaignId}] Error speaking narrative via voice: ${speakResult.error}. Falling back to text.`);
                if (textChannel?.isTextBased()) {
                    textChannel.send(`**Narrator (voice error):** ${narrative_response}`);
                }
            } else {
                console.log(`[${campaignId}] Narrative spoken successfully via voice: "${speakResult.spokenText}"`);
                 if (textChannel?.isTextBased()) { // Also send as text for V1 for clarity / record
                    textChannel.send(`**Narrator:** ${narrative_response}`);
                }
                // After GM speaks, bot should conceptually be "listening" for the player's next voice input.
                // The current model relies on user initiating next turn via `/speak` or a future voice activity detection.
                if (textChannel?.isTextBased()) {
                    textChannel.send(`*(The GM finishes speaking. You can now use '/speak <your_action>' or wait for voice activation.)*`);
                }
            }
        } else if (narrative_response) {
            console.warn(`[${campaignId}] No active voice connection for guild ${guildId} or no narrative. Sending narrative as text.`);
            if (textChannel?.isTextBased()) {
                textChannel.send(`**Narrator (no voice connection):** ${narrative_response}`);
            }
        }

    } catch (error: any) {
        console.error(`[${campaignId}] Error calling Storyteller flow or processing its response:`, error.message, error.stack);
        const textChannel = client.channels.cache.get(channelId);
        if (textChannel?.isTextBased()) {
            textChannel.send('There was an error communicating with the storyteller.');
        }
    }
}

client.once(Events.ClientReady, async c => {
  console.log(`Discord client ready! Logged in as ${c.user.tag}`);
  const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!'),
    new SlashCommandBuilder().setName('roll').setDescription('Rolls dice (e.g., 1d20, 2d6+3)')
        .addStringOption(option => option.setName('dice').setDescription('The dice notation').setRequired(true)),
    new SlashCommandBuilder().setName('join').setDescription('Joins your current voice channel to start an adventure!'),
    new SlashCommandBuilder().setName('leave').setDescription('Leaves the current voice channel.'),
    new SlashCommandBuilder().setName('speak').setDescription('Manually provide text for the GM to process.')
        .addStringOption(option => option.setName('text').setDescription('What you say to the GM').setRequired(true)),
  ];
  
  // Guild-specific command registration (use environment variable for guild ID)
  // const guildId = process.env.DISCORD_TEST_GUILD_ID;
  // if (guildId) {
  //   try {
  //     await client.guilds.cache.get(guildId)?.commands.set(commands);
  //     console.log(`Successfully registered commands for guild ${guildId}`);
  //   } catch (error) {
  //     console.error(`Failed to register commands for guild ${guildId}:`, error);
  //   }
  // } else {
  //    console.warn("DISCORD_TEST_GUILD_ID not set. Skipping guild command registration. Global commands can take up to an hour to propagate.");
       // Fallback or alternative: register global commands (can take time to update)
       // await client.application?.commands.set(commands);
       // console.log("Attempted to register global commands.");
  // }
  console.log("Slash commands prepared (actual registration might be manual or per-guild).");
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, guild, user, channelId, member } = interaction;
  const guildId = guild?.id;

  if (!guildId || !channelId) {
    await interaction.reply({ content: 'Commands must be used in a server channel.', ephemeral: true });
    return;
  }

  const campaignId = guildId; // Using guildId as campaignId for simplicity

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'roll') {
    const diceNotation = options.getString('dice', true);
    try {
      const parts = diceNotation.match(/(\d+)[dD](\d+)(?:([+-])(\d+))?/);
      if (!parts) throw new Error('Invalid dice notation.');
      const numDice = parseInt(parts[1]);
      const diceSides = parseInt(parts[2]);
      const modifierSign = parts[3];
      const modifierValue = parseInt(parts[4] || '0');

      if (numDice < 1 || numDice > 100) throw new Error('Number of dice must be between 1 and 100.');
      if (diceSides < 2 || diceSides > 1000) throw new Error('Dice sides must be between 2 and 1000.');
      if (modifierValue < 0 || modifierValue > 1000) throw new Error('Modifier must be between 0 and 1000.');

      let total = 0;
      const rolls = [];
      for (let i = 0; i < numDice; i++) {
        const roll = Math.floor(Math.random() * diceSides) + 1;
        rolls.push(roll);
        total += roll;
      }
      let modifierText = '';
      if (modifierSign && modifierValue !== 0) {
        total = modifierSign === '+' ? total + modifierValue : total - modifierValue;
        modifierText = ` ${modifierSign} ${modifierValue}`;
      }
      await interaction.reply(`Rolling ${diceNotation}...\nResult: **${total}** (Rolls: [${rolls.join(', ')}]${modifierText})`);
    } catch (e: any) {
      await interaction.reply({ content: `Error rolling dice: ${e.message}`, ephemeral: true });
    }
  } else if (commandName === 'join') {
    if (!(member instanceof Object && 'voice' in member && member.voice && member.voice.channel)) {
        await interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true});
        return;
    }
    const voiceChannel = member.voice.channel;

    try {
      await interaction.deferReply();
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });
      
      const audioPlayer = createAudioPlayer();
      connection.subscribe(audioPlayer);

      activeConnections.set(guildId, { connection, player: audioPlayer, voiceChannelId: voiceChannel.id, userId: user.id, campaignId });

      await entersState(connection, VoiceConnectionStatus.Ready, 30e3);
      
      const greetingText = "GM is ready. The adventure begins now!";
      await interaction.editReply(`Joined ${voiceChannel.name}! ${greetingText}`);

      // GM speaks the initial greeting
      const speakResult = await speakTextViaLiveAPI(connection, campaignId, greetingText);
      if (speakResult.error) {
          console.error(`[${campaignId}] Error speaking greeting: ${speakResult.error}`);
          if (interaction.channel?.isTextBased()) {
            interaction.channel.send(`*(GM tried to speak but encountered an error: ${speakResult.error})*`);
          }
      }
       if (interaction.channel?.isTextBased()) { // Also send as text for V1
            interaction.channel.send(`**Narrator:** ${greetingText}`);
            interaction.channel.send(`*(The GM finishes speaking. Use '/speak <your_action>' to tell the GM what you do.)*`);
        }
      // After this, the bot is "listening". The user will use /speak for their turn.

    } catch (error: any) {
      console.error("Error joining voice channel:", error.message, error.stack);
      activeConnections.get(guildId)?.connection?.destroy();
      activeConnections.delete(guildId);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: 'Failed to join voice channel. See console for details.'});
      } else {
        await interaction.reply({ content: 'Failed to join voice channel. See console for details.', ephemeral: true });
      }
    }
  } else if (commandName === 'leave') {
    const connectionDetails = activeConnections.get(guildId);
    if (connectionDetails) {
      connectionDetails.connection.destroy();
      activeConnections.delete(guildId);
      await interaction.reply('Left the voice channel.');
    } else {
      await interaction.reply({ content: 'Not currently in a voice channel.', ephemeral: true });
    }
  } else if (commandName === 'speak') {
    const text = options.getString('text', true);
    const connectionDetails = activeConnections.get(guildId);

    if (!connectionDetails) {
        await interaction.reply({ content: "I'm not in a voice channel. Use `/join` first.", ephemeral: true });
        return;
    }
    if (user.id !== connectionDetails.userId) {
        // This check is basic. In a multi-user channel, you might want a turn system.
        // await interaction.reply({ content: "It's not your turn to speak or you didn't initiate the session.", ephemeral: true });
        // return;
        console.warn(`[${campaignId}] User ${user.id} used /speak but session was initiated by ${connectionDetails.userId}. Allowing for now.`);
    }

    await interaction.deferReply();
    // User's spoken text is passed to storyteller.
    // The `handleLiveVoiceInteraction` would ideally get this from actual voice.
    // For now, `/speak` command provides this transcript.
    console.log(`[${campaignId}] User ${user.id} used /speak with text: "${text}"`);
    await processStorytellerInteraction(text, user.id, campaignId, guildId, channelId, interaction);
    // Reply is handled within processStorytellerInteraction or by its follow-ups
    await interaction.editReply(`Your action: "${text}" has been sent to the storyteller. The GM will respond shortly.`);

  }
});

if (DISCORD_BOT_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN') {
    client.login(DISCORD_BOT_TOKEN)
        .then(() => console.log("Discord client login successful."))
        .catch(err => {
            console.error("Discord client login failed:", err.message, err.stack);
            process.exit(1);
        });
} else {
    console.error("Discord bot token is not configured. Exiting.");
    process.exit(1);
}

client.on(Events.Error, error => console.error('Discord client error:', error.message, error.stack));
client.on(Events.Warn, warning => console.warn('Discord client warning:', warning));

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
});
