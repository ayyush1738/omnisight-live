import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Define a strict interface so TypeScript catches any typos elsewhere in your app
interface Config {
  port: number;
  geminiApiKey: string;
  environment: string;
}

// Map the raw environment variables to our typed config object
export const config: Config = {
  // Cloud Run defaults to port 8080, so we use that as our fallback
  port: parseInt(process.env.PORT || '8080', 10),
  
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  
  environment: process.env.NODE_ENV || 'development',
};

// ==========================================
// CRITICAL VALIDATION (The "Fail-Fast" check)
// ==========================================
if (!config.geminiApiKey) {
  console.error('\n🚨 CRITICAL ERROR: GEMINI_API_KEY is missing!');
  console.error('OmniSight cannot start without a valid Google AI Studio API key.');
  console.error('If running locally, ensure you have a .env file in your backend folder.');
  console.error('If deploying to Cloud Run, ensure the Secret Manager is bound to this variable.\n');
  
  // Exit the process with a failure code (1) to prevent the server from running blind
  process.exit(1); 
}