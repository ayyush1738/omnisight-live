import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { RoomManager } from '../managers/room.manager';
import { logger } from '../utils/logger';

export class SocketController {
  private roomManager: RoomManager;

  constructor(wss: WebSocketServer) {
    // 🚨 FIXED: Use the Singleton instance so WS and API share the same memory state
    this.roomManager = RoomManager.getInstance();
    this.init(wss);
  }

  private init(wss: WebSocketServer) {
    // Capture 'req' to extract roomId and role from the connection URL
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      try {
        /**
         * Parsing the connection URL. 
         * Expected frontend connection: ws://backend:8080/live?role=technician&roomId=room123
         */
        const baseURL = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
        const url = new URL(req.url || '/', baseURL);
        
        const role = url.searchParams.get('role') as 'technician' | 'expert' | null;
        const roomId = url.searchParams.get('roomId');

        // Validation: Kick connections that don't identify themselves
        if (!role || !roomId) {
          logger.warn('Connection rejected: Missing role or roomId in URL.');
          ws.send(JSON.stringify({ type: 'error', message: 'Missing roomId or role.' }));
          ws.close();
          return;
        }

        if (role !== 'technician' && role !== 'expert') {
          logger.warn(`Connection rejected: Invalid role '${role}'`);
          ws.close();
          return;
        }

        logger.info(`🔌 [Room: ${roomId}] New client joined as [${role.toUpperCase()}]`);

        /**
         * Hand the WebSocket over to the RoomManager.
         * For 'technician': It starts a Gemini session.
         * For 'expert': It starts mirroring the technician's feed to this socket.
         */
        this.roomManager.joinRoom(roomId, role, ws);

      } catch (error) {
        logger.error('Critical failure during WebSocket handshake:', error);
        ws.close();
      }
    });
  }
}