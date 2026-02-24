/**
 * Custom Logger Utility
 * Provides standardized, timestamped console output.
 * In a full production environment, this could be easily swapped to use 
 * Winston or Pino and pipe directly into Google Cloud Logging.
 */

// ANSI Color Codes for terminal formatting
const colors = {
    reset: "\x1b[0m",
    info: "\x1b[36m",    // Cyan
    success: "\x1b[32m", // Green
    warn: "\x1b[33m",    // Yellow
    error: "\x1b[31m",   // Red
    timestamp: "\x1b[90m"// Gray
};

const getTimestamp = (): string => {
    return new Date().toISOString();
};

export const logger = {
    info: (message: string, ...optionalParams: any[]) => {
        console.log(
            `${colors.timestamp}[${getTimestamp()}]${colors.reset} ${colors.info}[INFO]${colors.reset} ${message}`,
            ...optionalParams
        );
    },

    success: (message: string, ...optionalParams: any[]) => {
        console.log(
            `${colors.timestamp}[${getTimestamp()}]${colors.reset} ${colors.success}[SUCCESS]${colors.reset} ${message}`,
            ...optionalParams
        );
    },

    warn: (message: string, ...optionalParams: any[]) => {
        console.warn(
            `${colors.timestamp}[${getTimestamp()}]${colors.reset} ${colors.warn}[WARN]${colors.reset} ${message}`,
            ...optionalParams
        );
    },

    error: (message: string, error?: any) => {
        console.error(
            `${colors.timestamp}[${getTimestamp()}]${colors.reset} ${colors.error}[ERROR]${colors.reset} ${message}`
        );
        if (error) {
            // Print the stack trace if an actual Error object is passed
            console.error(error);
        }
    },
};