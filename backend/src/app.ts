import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/v1', apiRoutes);

// Health Check
app.get('/health', (_, res) => res.status(200).json({ status: 'ok' }));

/**
 * GLOBAL ERROR HANDLER
 * Catches all errors thrown in the app (including AppError)
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    logger.error(`${req.method} ${req.path} - ${err.message}`, err);

    res.status(statusCode).json({
        status: status,
        message: err.message,
        // Only show stack trace in development mode
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

export default app;