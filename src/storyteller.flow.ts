/**
 * Storyteller flow
 * Handles real-time game logic, interaction processing, and narrative generation.
 */
import { defineFlow, run } from 'genkit';
import { z } from 'zod';
import { gemini15Flash } from '@genkit-ai/googleai'; // Or other appropriate model
import { generate } from '@genkit-ai/ai';
import { getDoc, setDoc, updateDoc, collection, doc, serverTimestamp, addDoc } from '@genkit-ai/firebase/firestore';
// Removed: import { firestore } from 'firebase-admin'; // Not directly needed if using genkit utils

export const storytellerFlow = defineFlow(
  {
    name: 'storytellerFlow',
    inputSchema: z.object({
      transcript: z.string(),
      userId: z.string(),
      campaignId: z.string(),
      // Potentially other fields like current scene ID, etc.
    }),
    outputSchema: z.object({
      status: z.string(),
      narrative_response: z.string().optional(), // What the GM "says" or narrates
      gm_text_response: z.string().optional(), // Any OOC text for the player from GM
      error_message: z.string().optional(),
    }),
  },
  async (input) => {
    console.log(`Storyteller flow invoked for campaign ${input.campaignId} by user ${input.userId} with transcript: "${input.transcript}"`);

    // Construct Firestore document paths
    // Note: Direct usage of firestore() from 'firebase-admin' is not recommended with genkit firebase plugin.
    // Instead, pass the Firestore instance or rely on genkit's configured instance.
    // For simplicity, assuming genkit handles Firestore instance implicitly through configured firebase plugin.
    const campaignCollectionRef = collection('campaigns'); // Root collection for campaigns
    const campaignDocRef = doc(campaignCollectionRef, input.campaignId);
    
    // It's generally better to use subcollections directly from a DocumentReference
    const worldStateRef = doc(campaignDocRef, 'state', 'world'); // Path: /campaigns/{campaignId}/state/world
    const sessionEventsColRef = collection(campaignDocRef, 'sessionEvents'); // Path: /campaigns/{campaignId}/sessionEvents
    const plannerTasksColRef = collection(campaignDocRef, 'plannerTasks'); // Path: /campaigns/{campaignId}/plannerTasks

    try {
      // 1. Retrieve worldState
      const worldStateSnap = await run("get-world-state", async () => await getDoc(worldStateRef));
      const worldState = worldStateSnap.data() || { description: "A new realm unfolds, shrouded in mist and ancient secrets." , gm_notes: "The initial state of the world."}; 
      console.log("Retrieved world state:", worldState);

      // 2. Call Gemini model
      // TODO: Refine this prompt based on actual worldState structure and desired narrative style
      const prompt = `
        Campaign Context:
        ${worldState.description}

        GM Internal Notes (do not reveal directly to player):
        ${worldState.gm_notes || "No specific GM notes for this scene."}

        Player (User ID: ${input.userId}) says: "${input.transcript}"

        Based on this, narrate the outcome of the player's action and provide a brief Game Master (GM) response.
        The narrative should describe what happens in the game world.
        The GM response can be an in-character comment or an out-of-character clarification if needed.
        Format the output as plain text.
      `;

      const llmResponse = await run("generate-narrative", async () => await generate({
        model: gemini15Flash, // Ensure this model is correctly configured in index.ts
        prompt: prompt,
        output: { format: 'text' } 
      }));
      
      const narrative = llmResponse.text(); 
      console.log("LLM Response Text:", narrative);


      // 3. Update worldState and save sessionEvent
      //    (Simplistic update, real logic would be more complex and should reflect changes from the narrative)
      const updatedWorldStateData = { 
        ...worldState, 
        last_interaction_transcript: input.transcript,
        last_narrative_response: narrative,
        // Consider adding fields like current_scene_id, player_choices_made, consequences_unfolding
        updatedAt: serverTimestamp() // Firestore server-side timestamp
      };
      await run("update-world-state", async () => await setDoc(worldStateRef, updatedWorldStateData, { merge: true }));
      console.log("World state updated for campaign:", input.campaignId);
      
      const sessionEvent = {
        userId: input.userId,
        transcript: input.transcript,
        narrative_response: narrative, // The generated narrative from LLM
        timestamp: serverTimestamp(), // Firestore server-side timestamp
        // Add other relevant event data, e.g., worldState_before_event, choices_offered, etc.
      };
      const sessionEventDocRef = await run("save-session-event", async () => await addDoc(sessionEventsColRef, sessionEvent));
      console.log("Session event saved with ID:", sessionEventDocRef.id);

      // 4. If planning needed (example condition - refine based on actual game logic)
      // This condition is very basic and should be made more robust.
      if (narrative && (narrative.toLowerCase().includes("major discovery") || narrative.toLowerCase().includes("significant change"))) {
        const plannerTask = {
          campaignId: input.campaignId,
          triggeringEventId: sessionEventDocRef.id, // Link to the event that triggered this task
          description: `Analyze consequences of narrative: "${narrative.substring(0, 100)}..."`, // Truncate for brevity
          status: 'new', // 'new', 'processing', 'completed', 'failed'
          createdAt: serverTimestamp(),
          // Add more details: e.g., specific entities involved, type of planning needed
        };
        const plannerTaskDocRef = await run("create-planner-task", async () => await addDoc(plannerTasksColRef, plannerTask));
        console.log("Planner task created with ID:", plannerTaskDocRef.id, "for campaign:", input.campaignId);
      }

      // 5. Return response
      return {
        status: 'success',
        narrative_response: narrative, // Send the generated narrative to the client
        gm_text_response: 'The story unfolds...', // Placeholder, could be dynamic or part of LLM output
      };

    } catch (error: any) {
      console.error('Error in storytellerFlow for campaign', input.campaignId, ':', error);
      // Ensure error is an instance of Error for accessing message property safely
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      return {
        status: 'error',
        error_message: errorMessage,
      };
    }
  }
);

// Genkit's defineFlow typically handles exports correctly.
// If storytellerFlow is not being picked up, uncommenting this might be necessary
// depending on the Genkit version and project setup.
// export default storytellerFlow;
