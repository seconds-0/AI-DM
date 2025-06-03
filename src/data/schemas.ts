import { z } from 'zod';

/**
 * Represents the dynamic state of the game world.
 * Stored at: /campaigns/{campaignId}/state/world
 */
export const WorldStateSchema = z.object({
  description: z.string().describe("A general description of the current world state, environment, or situation."),
  last_interaction_transcript: z.string().optional().describe("The last transcript from the user that significantly altered the world state."),
  last_narrative_response: z.string().optional().describe("The last narrative response from the GM that described the outcome of the user's action."),
  gm_notes: z.string().optional().describe("Internal notes for the GM regarding the world, plot hooks, secret events, etc."),
  // Player-specific states could be a nested object or separate documents
  // e.g., player_states: z.record(z.string(), z.object({ location: z.string(), inventory: z.array(z.string()) })).optional(),
  updatedAt: z.any().optional().describe("Firestore server timestamp of the last update."),
  createdAt: z.any().optional().describe("Firestore server timestamp of creation."),
});
export type WorldState = z.infer<typeof WorldStateSchema>;

/**
 * Represents a single interaction event in a session.
 * Stored in subcollection: /campaigns/{campaignId}/sessionEvents/
 */
export const SessionEventSchema = z.object({
  userId: z.string().describe("The ID of the user who initiated the event."),
  transcript: z.string().describe("The user's transcribed speech or text input."),
  narrative_response: z.string().describe("The GM's narrative response to the user's input."),
  timestamp: z.any().describe("Firestore server timestamp of when the event occurred."),
  // Optional fields:
  // worldState_before_event_ref: z.string().optional().describe("Reference to world state before this event"),
  // choices_offered: z.array(z.string()).optional().describe("Explicit choices offered to the player"),
  // dice_roll_result: z.string().optional().describe("Outcome of any dice rolls in this event"),
});
export type SessionEvent = z.infer<typeof SessionEventSchema>;

/**
 * Represents a task for the Planner Flow to process asynchronously.
 * Stored in subcollection: /campaigns/{campaignId}/plannerTasks/
 */
export const PlannerTaskSchema = z.object({
  campaignId: z.string().describe("The ID of the campaign this task belongs to."),
  description: z.string().describe("A description of what the planner needs to analyze or decide."),
  status: z.enum(['new', 'processing', 'completed', 'failed']).describe("The current status of the task."),
  createdAt: z.any().optional().describe("Firestore server timestamp when the task was created."),
  processedAt: z.any().optional().describe("Firestore server timestamp when the task was last processed."),
  triggeringEventId: z.string().optional().describe("The ID of the SessionEvent that triggered this task, if applicable."),
  analysis_summary: z.string().optional().describe("The summary of the analysis provided by the planner flow upon completion."),
  error: z.string().optional().describe("Error message if the task failed."),
  // priority: z.number().optional().describe("Priority of the task"),
  // assigned_to_model: z.string().optional().describe("Which specific model/version was intended if specific routing is needed"),
});
export type PlannerTask = z.infer<typeof PlannerTaskSchema>;

/**
 * Represents the aggregated state and outputs of the Planner Flow.
 * Stored at: /campaigns/{campaignId}/state/planner
 */
export const PlannerStateSchema = z.object({
  last_analysis_for_task_id: z.string().optional().describe("The ID of the last task that was analyzed to update this state."),
  last_analysis_summary: z.string().optional().describe("A summary of the latest significant planning analysis."),
  plot_vectors: z.array(z.string()).optional().describe("Potential future plot directions or story arcs identified by the planner."),
  npc_status: z.record(z.string(), z.object({ // Keyed by NPC ID or name
    mood: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    knowledge: z.array(z.string()).optional(), // Things the NPC knows
    last_interaction_with_player: z.string().optional(),
  })).optional().describe("Status, mood, or objectives of key NPCs."),
  world_lore_updates: z.array(z.string()).optional().describe("New lore or world details generated from planning."),
  potential_consequences: z.array(z.object({
    if_event: z.string(),
    then_consequence: z.string(),
    severity: z.number().optional(),
  })).optional().describe("Potential future consequences based on current world state and tasks."),
  updatedAt: z.any().optional().describe("Firestore server timestamp of the last update."),
  createdAt: z.any().optional().describe("Firestore server timestamp of creation."),
});
export type PlannerState = z.infer<typeof PlannerStateSchema>;

console.log("Data schemas defined: WorldStateSchema, SessionEventSchema, PlannerTaskSchema, PlannerStateSchema");
