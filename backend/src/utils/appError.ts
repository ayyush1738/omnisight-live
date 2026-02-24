/**
 * Custom Error Class for OmniSight
 * Extends the native JS Error object to include HTTP status codes
 * and operational flags for the global error handler.
 */
export class AppError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        // Call the parent Error class constructor with the message
        super(message);

        this.statusCode = statusCode;
        
        // If the status code starts with a 4 (e.g., 400, 404), it's a client 'fail'.
        // If it starts with a 5 (e.g., 500), it's a server 'error'.
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        
        // This flag proves the error was anticipated (e.g., missing API key, bad input)
        // rather than an unknown programming bug (like a null pointer exception).
        this.isOperational = true;

        // Captures the stack trace to keep the error logs clean and traceable
        Error.captureStackTrace(this, this.constructor);
    }
}