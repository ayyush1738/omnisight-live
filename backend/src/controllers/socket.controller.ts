import { WebSocket, WebSocketServer } from 'ws';
import { GeminiService } from '../services/gemini.service';
import { logger } from '../utils/logger';

export class SocketController {
  constructor(wss: WebSocketServer) {
    this.init(wss);
  }

  private init(wss: WebSocketServer) {
    // This triggers the moment your Next.js frontend calls `new WebSocket(...)`
    wss.on('connection', (ws: WebSocket) => {
      logger.info('🔌 New client connected to OmniSight Live Stream');

      // 1. Instantiate a FRESH GeminiService for this specific user.
      // This is critical for scaling. If two people use the app at once, 
      // they each get their own isolated AI brain and session context.
      const geminiService = new GeminiService();

      // 2. Hand the WebSocket over to the Service layer to open the AI pipe.
      // The GeminiService will now take over listening to ws.on('message')
      // to process the streaming audio and video frames.
      geminiService.startLiveSession(ws);

      // 3. Handle high-level network lifecycle events
      ws.on('close', () => {
        logger.info('❌ Client disconnected from WebSocket server.');
        // The GeminiService also listens to 'close' to safely kill the API connection.
      });

      ws.on('error', (err) => {
        logger.error('WebSocket connection error:', err);
      });
    });
  }
}