/**
 * Represents a completed OmniSight field session.
 * This structure perfectly mirrors the document schema we will use in Google Firestore.
 */
export interface SessionLog {
  /** * Optional because it won't exist until Firestore generates it upon saving. 
   */
  id?: string;               

  /** * ISO String format (e.g., "2026-02-24T10:00:00.000Z")
   */
  timestamp: string;         

  /** * Total length of the Live API session to track usage/cost.
   */
  durationSeconds: number;   

  /** * Categorizes the task for the user's dashboard.
   * Using a strict union type prevents frontend typos from polluting the database.
   */
  taskType: 'repair' | 'agriculture' | 'general'; 

  /** * The AI-generated summary of what happened during the physical task.
   */
  summary: string;           

  /** * Analytics: How many times did the AI have to use Voice Activity Detection (VAD)
   * to interrupt the user from making a physical mistake.
   */
  criticalInterruptions: number; 
}

/**
 * (Optional) You can also define the shape of incoming REST API requests 
 * to strictly type your Express req.body.
 */
export interface CreateSessionRequest {
  durationSeconds: number;
  taskType: 'repair' | 'agriculture' | 'general';
  summary: string;
  criticalInterruptions: number;
}