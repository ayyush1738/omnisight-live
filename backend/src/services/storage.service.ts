import { Firestore } from '@google-cloud/firestore';
import { SessionLog } from '../models/session.model';
import { logger } from '../utils/logger';

export class StorageService {
  private db: Firestore;
  private collectionName = 'omnisight_sessions';

  constructor() {
    // When deployed to Cloud Run, this automatically picks up your GCP credentials.
    // Locally, it will look for the GOOGLE_APPLICATION_CREDENTIALS environment variable.
    try {
        this.db = new Firestore();
        logger.info('☁️ Google Firestore initialized.');
    } catch (error) {
        logger.error('Failed to initialize Firestore. Check your GCP credentials.', error);
        throw error;
    }
  }

  /**
   * Saves a completed session to Google Cloud Firestore.
   */
  public async saveSessionLog(logData: SessionLog): Promise<SessionLog> {
    try {
      logger.info(`Writing session to Firestore: ${logData.taskType}`);
      
      const docRef = await this.db.collection(this.collectionName).add(logData);
      
      // Return the object with the newly generated Google Cloud ID attached
      return {
        ...logData,
        id: docRef.id,
      };
    } catch (error) {
      logger.error('Firestore Write Error:', error);
      throw new Error('Failed to save session to database.');
    }
  }

  /**
   * Fetches the history of past sessions from Firestore, sorted by newest first.
   */
  public async getSessionHistory(limit: number = 10): Promise<SessionLog[]> {
    try {
      logger.info('Reading session history from Firestore...');
      
      const snapshot = await this.db.collection(this.collectionName)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      if (snapshot.empty) {
        return [];
      }

      // Map the Firestore documents back into our strict TypeScript interface
      const history: SessionLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        history.push({
          id: doc.id,
          timestamp: data.timestamp,
          durationSeconds: data.durationSeconds,
          taskType: data.taskType,
          summary: data.summary,
          criticalInterruptions: data.criticalInterruptions,
        });
      });

      return history;
    } catch (error) {
      logger.error('Firestore Read Error:', error);
      throw new Error('Failed to fetch history from database.');
    }
  }
}