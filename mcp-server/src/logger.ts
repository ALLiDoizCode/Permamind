import winston from 'winston';

/**
 * Custom formatter to redact sensitive data from logs
 */
const redactSensitiveData = winston.format((info) => {
  const message = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);

  // Redact 12-word seed phrases (12 words separated by spaces)
  const redactedMessage = message.replace(/\b([a-z]{3,}(\s+[a-z]{3,}){11})\b/gi, '[REDACTED_SEED_PHRASE]');

  // Redact private keys (long alphanumeric strings that might be keys)
  const finalMessage = redactedMessage.replace(/([a-zA-Z0-9+/]{64,})/g, '[REDACTED_PRIVATE_KEY]');

  info.message = finalMessage;
  return info;
});

/**
 * Initialize Winston logger with configured log level
 * @param logLevel - Log level (debug, info, warn, error)
 * @returns Winston logger instance
 */
export function createLogger(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'): winston.Logger {
  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      redactSensitiveData(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            const msg = stack !== undefined && stack !== null ? stack : message;
            return `${timestamp as string} [${level as string}]: ${msg as string}`;
          })
        ),
      }),
    ],
  });
}

// Export singleton logger instance (will be initialized in index.ts)
export let logger: winston.Logger;

/**
 * Set the logger instance (called during server initialization)
 */
export function setLogger(instance: winston.Logger): void {
  logger = instance;
}
