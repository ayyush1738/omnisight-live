import http from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { config } from './config/env';
import { SocketController } from './controllers/socket.controller';
import { logger } from './utils/logger';

const server = http.createServer(app);

/**
 * SHARED ROOM MANAGER
 * This is the central hub for "Ghost Mode". By keeping it here,
 * we can technically share this instance across both WS and REST if needed.
 */
const wss = new WebSocketServer({ 
    server, 
    path: '/live' // Unified endpoint for Tech and Expert
});

// Initialize the SocketController to handle the 3-way multiplexing logic
new SocketController(wss);

server.listen(config.port, () => {
    logger.success(`OmniSight Backend Operational`);
    logger.info(`PORT: ${config.port}`);
    logger.info(`REST API: http://localhost:${config.port}/api/v1`);
    logger.info(`WS ENDPOINT: ws://localhost:${config.port}/live`);
});