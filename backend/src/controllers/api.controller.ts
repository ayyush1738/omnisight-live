import { Request, Response } from 'express';
import { SessionLog } from '../models/session.model';
import { logger } from '../utils/logger';
import { RoomManager } from '../managers/room.manager';
import { StorageService } from '../services/storage.service';

export class ApiController {
  private roomManager: RoomManager;
  private storageService: StorageService;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
    // Ensure StorageService is initialized properly in its own file
    this.storageService = new StorageService();
  }

  /**
   * GET /api/v1/rooms/active
   * Returns list of live sessions from the in-memory RoomManager
   */
  public getActiveRooms = (req: Request, res: Response): void => {
    try {
      const rooms = this.roomManager.getActiveRooms();
      res.status(200).json({ 
        success: true, 
        count: rooms.length, 
        data: rooms 
      });
    } catch (error) {
      logger.error('Failed to fetch active rooms:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching active sessions' 
      });
    }
  };

  /**
   * GET /api/v1/history
   * Pulls last 20 sessions from Firestore
   */
  public getSessionHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('API: Fetching session history from StorageService');
      const history = await this.storageService.getSessionHistory(20);
      
      res.status(200).json({ 
        success: true, 
        count: history.length, 
        data: history 
      });
    } catch (error) {
      logger.error('Failed to fetch history:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  };

  /**
   * POST /api/v1/log
   * Persists a completed session summary to Firestore
   */
  public saveSessionLog = async (req: Request, res: Response): Promise<void> => {
    try {
      const { durationSeconds, taskType, summary, criticalInterruptions } = req.body;

      // Validation
      if (!taskType || !summary) {
        res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: taskType and summary' 
        });
        return;
      }

      const newLog: SessionLog = {
        timestamp: new Date().toISOString(),
        durationSeconds: Number(durationSeconds) || 0,
        taskType,
        summary,
        criticalInterruptions: Number(criticalInterruptions) || 0
      };

      logger.info(`API: Saving session log for task: ${taskType}`);
      const savedLog = await this.storageService.saveSessionLog(newLog);

      res.status(201).json({ 
        success: true, 
        data: savedLog 
      });
    } catch (error) {
      logger.error('Failed to save log:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error' 
      });
    }
  };
}