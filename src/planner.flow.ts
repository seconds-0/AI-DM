/**
 * Planner flow
 * Handles asynchronous analysis, planning, and world state evolution.
 * Intended to be triggered by Firestore events on plannerTask creation.
 */
import { defineFlow, run } from 'genkit';
import { z } from 'zod';
import { gemini15Pro } from '@genkit-ai/googleai'; // Using Pro for more complex analysis
import { generate } from '@genkit-ai/ai';
import { getDoc, setDoc, updateDoc, collection, doc, serverTimestamp, query, orderBy, limit, getDocs } from '@genkit-ai/firebase/firestore';

// Define the structure of a planner task document (as created by storytellerFlow)
// This schema should match the data written to Firestore.
const PlannerTaskDataSchema = z.object({
  campaignId: z.string(),
  triggeringEventId: z.string().optional(), // Optional: link to the event that triggered this task
  description: z.string(),
  status: z.string(), // e.g., 'new', 'processing', 'completed', 'failed'
  createdAt: z.any().optional(), // Firestore timestamp, can be complex to validate precisely with Zod
  // Any other fields that storytellerFlow might add to the task document
});

// Input schema for the flow when triggered by Firestore.
// Genkit's Firestore trigger typically provides the document data and context.
// We expect `data` to contain the planner task fields, and `id` to be the task's document ID.
export const PlannerFlowInputSchema = z.object({
  id: z.string(), // Document ID of the plannerTask
  data: PlannerTaskDataSchema, // The content of the plannerTask document
});

export const plannerFlow = defineFlow(
  {
    name: 'plannerFlow',
    // Input schema reflects the data provided by a Firestore trigger (document ID + data)
    inputSchema: PlannerFlowInputSchema, 
    outputSchema: z.object({
      status: z.string(),
      analysis_summary: z.string().optional(),
      error_message: z.string().optional(),
      processed_task_id: z.string().optional(),
    }),
    // Firebase trigger configuration (metadata for Genkit deployment)
    // This tells Genkit that this flow should be triggered by Firestore events.
    // The actual Eventarc trigger is set up in GCP, but this helps Genkit understand the linkage.
    trigger: {
      name: 'onNewPlannerTask',
      type: 'firestore', // Specify the trigger type as Firestore
      options: {
        // Path to the documents that will trigger this flow.
        // {campaignId} and {taskId} are wildcards.
        document: 'campaigns/{campaignId}/plannerTasks/{taskId}',
        // Firestore events to listen for: 'create', 'update', 'delete', 'write'
        events: ['create'] // Trigger only when a new task is created
      }
    }
  },
  async (input) => {
    // `input.id` is the taskId, `input.data` is the plannerTask document content
    const taskId = input.id;
    const taskData = input.data;
    const campaignId = taskData.campaignId;

    console.log(`Planner flow invoked for campaign ${campaignId}, task ${taskId}. Task data:`, taskData);

    // Construct Firestore document paths
    const campaignDocRef = doc(collection('campaigns'), campaignId);
    const plannerTaskRef = doc(campaignDocRef, 'plannerTasks', taskId);
    const plannerStateRef = doc(campaignDocRef, 'state', 'planner'); // Stores aggregated planning outputs
    const worldStateRef = doc(campaignDocRef, 'state', 'world'); // Current world state
    const sessionEventsColRef = collection(campaignDocRef, 'sessionEvents'); // For context

    try {
      // 1. Planner task data is already available in `taskData`.
      //    Update status to 'processing'
      await run("update-task-status-processing", async () => await updateDoc(plannerTaskRef, {
        status: 'processing',
        processedAt: serverTimestamp()
      }));

      // 2. Retrieve worldState and recent session events for context
      const worldStateSnap = await run("get-world-state", async () => await getDoc(worldStateRef));
      const worldState = worldStateSnap.data() || { description: "No world state found." };
      console.log("Retrieved world state for planning:", worldState);

      // Fetch recent session events for richer context (e.g., last 3-5 events)
      const eventsQuery = query(sessionEventsColRef, orderBy('timestamp', 'desc'), limit(5));
      const eventsSnap = await run("get-recent-session-events", async () => await getDocs(eventsQuery));
      const recentEvents = eventsSnap.docs.map(d => ({id: d.id, ...d.data()}));
      console.log(`Retrieved ${recentEvents.length} recent session events for context.`);

      // 3. Call Gemini model for analysis and planning
      // TODO: Refine this prompt for more sophisticated planning.
      const prompt = `
        Objective: Analyze the following game task and propose strategic considerations.

        Campaign World State:
        ${JSON.stringify(worldState, null, 2)}

        Recent Session Events (leading up to this task):
        ${JSON.stringify(recentEvents, null, 2)}

        Planner Task (ID: ${taskId}): "${taskData.description}"
        Task Creation Timestamp: ${taskData.createdAt ? new Date(taskData.createdAt.seconds * 1000).toISOString() : 'N/A'}

        Based on the task, world state, and recent events:
        1.  Identify key entities (NPCs, locations, items) involved or affected.
        2.  Suggest 2-3 potential plot developments or hooks related to this task.
        3.  Outline potential consequences or ripple effects of completing or ignoring this task.
        4.  What specific aspects should the Game Master (GM) prepare or consider for future sessions?

        Provide a concise analysis.
      `;

      const llmResponse = await run("generate-plan-analysis", async () => await generate({
        model: gemini15Pro, // Ensure this model is configured in index.ts
        prompt: prompt,
        output: { format: 'text' } // Or JSON for structured planning data
      }));
      
      const analysis = llmResponse.text() || "No analysis generated.";
      console.log("LLM Analysis for task", taskId, ":", analysis);

      // 4. Update planner_state (aggregate planning outputs) and task status to 'completed'
      const newPlannerStateData = { 
        last_analysis_for_task_id: taskId,
        last_analysis_summary: analysis.substring(0, 1500), // Firestore limit for string value
        updatedAt: serverTimestamp(),
        // Consider merging with existing state or storing analyses in a subcollection/array
      };
      await run("update-planner-state", async () => await setDoc(plannerStateRef, newPlannerStateData, { merge: true }));
      console.log("Planner state updated for campaign:", campaignId);
      
      await run("update-task-status-completed", async () => await updateDoc(plannerTaskRef, { 
        status: 'completed', 
        analysis_summary: analysis,
        completedAt: serverTimestamp() 
      }));
      console.log("Planner task", taskId, "marked as completed.");

      return {
        status: 'success',
        analysis_summary: analysis,
        processed_task_id: taskId,
      };

    } catch (error: any) {
      console.error(`Error in plannerFlow (campaign ${campaignId}, task ${taskId}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      // Attempt to update task status to 'failed'
      try {
        await run("update-task-status-failed", async () => await updateDoc(plannerTaskRef, { 
            status: 'failed', 
            error: errorMessage,
            failedAt: serverTimestamp() 
        }));
      } catch (updateError) {
        console.error("Failed to update task status to 'failed':", updateError);
      }
      return {
        status: 'error',
        error_message: errorMessage,
        processed_task_id: taskId,
      };
    }
  }
);

// export default plannerFlow; // Genkit's defineFlow usually handles this.
