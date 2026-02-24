import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load environment variables from the .env file
dotenv.config();

// Define a strict interface to provide autocomplete and type safety across the app
interface Config {
  port: number;
  geminiApiKey: string;
  gcpProjectId: string; // Added for Firestore identification
  environment: string;
}

// Map the raw environment variables to our typed config object
export const config: Config = {
  // Cloud Run defaults to port 8080, so we use that as our fallback
  port: parseInt(process.env.PORT || '8080', 10),
  
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  gcpProjectId: process.env.GCP_PROJECT_ID || '',
  
  environment: process.env.NODE_ENV || 'development',
};

/**
 * VALIDATION LOGIC
 * Ensures the server doesn't boot up in a broken state.
 */

if (!config.geminiApiKey) {
  logger.error('CRITICAL ERROR: GEMINI_API_KEY is missing!');
  logger.error('OmniSight requires a Google AI Studio API key to power the AI logic.');
  process.exit(1); 
}

if (!config.gcpProjectId && config.environment !== 'test') {
  logger.warn('GCP_PROJECT_ID is missing.');
  logger.warn('Firestore operations (session logging) will fail until this is provided.');
  // We don't process.exit(1) here in case you want to test just the AI logic
}

export default config;