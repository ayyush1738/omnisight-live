import { WebSocket } from 'ws';
import { GeminiService } from '../services/gemini.service';
import { logger } from '../utils/logger';

export interface Room {
  id: string;
  technicianWs: WebSocket | null;
  expertWs: WebSocket | null;
  geminiService: GeminiService | null;
}

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map();

  // Private constructor prevents creating multiple instances with 'new'
  private constructor() {}

  /**
   * Access the single source of truth for all rooms
   */
  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public getActiveRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      roomId: room.id,
      hasTech: !!room.technicianWs,
      hasExpert: !!room.expertWs,
      status: room.technicianWs ? 'live' : 'waiting'
    }));
  }

  public joinRoom(roomId: string, role: 'technician' | 'expert', ws: WebSocket) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        technicianWs: null,
        expertWs: null,
        geminiService: null,
      });
      logger.info(`[Room: ${roomId}] Created new room instance.`);
    }

    const room = this.rooms.get(roomId)!;

    if (role === 'technician') {
      this.handleTechnicianConnection(room, ws);
    } else if (role === 'expert') {
      this.handleExpertConnection(room, ws);
    }
  }

  private handleTechnicianConnection(room: Room, ws: WebSocket) {
    if (room.technicianWs) {
      logger.warn(`[Room: ${room.id}] Technician reconnected. Closing old socket.`);
      room.technicianWs.close();
    }

    room.technicianWs = ws;
    room.geminiService = new GeminiService();
    room.geminiService.startLiveSession(ws);

    ws.on('message', (message: string | Buffer) => {
      // Forward technician video frames to the expert
      if (!Buffer.isBuffer(message) && room.expertWs && room.expertWs.readyState === WebSocket.OPEN) {
        try {
          const data = JSON.parse(message.toString());
          if (data.realtimeInput) {
            room.expertWs.send(message.toString());
          }
        } catch (e) { /* Ignore non-JSON */ }
      }
    });

    ws.on('close', () => {
      logger.info(`[Room: ${room.id}] Technician disconnected.`);
      this.cleanupRoom(room.id);
    });
  }

  private handleExpertConnection(room: Room, ws: WebSocket) {
    if (room.expertWs) room.expertWs.close();
    room.expertWs = ws;
    
    if (room.geminiService) {
        room.geminiService.injectExpertCommand("System Status: A senior expert has joined to observe.");
    }

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'expert_command' && room.geminiService) {
          const prompt = `Expert instruction: "${data.text}". Relay this to the technician.`;
          room.geminiService.injectExpertCommand(prompt);
        }
      } catch (err) {
        logger.error(`[Room: ${room.id}] Error parsing expert message`, err);
      }
    });

    ws.on('close', () => {
      logger.info(`[Room: ${room.id}] Expert disconnected.`);
      room.expertWs = null; 
    });
  }

  private cleanupRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.expertWs) room.expertWs.close();
      this.rooms.delete(roomId);
      logger.info(`[Room: ${roomId}] Room destroyed.`);
    }
  }
}