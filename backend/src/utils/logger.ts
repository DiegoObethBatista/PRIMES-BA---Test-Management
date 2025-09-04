import winston from 'winston';

/**
 * Logger configuration with secret redaction
 */

// Pattern to match potential secrets/tokens (32+ alphanumeric characters)
const SECRET_PATTERN = /\b[A-Za-z0-9]{32,}\b/g;

// Known secret field names to redact
const SECRET_FIELDS = ['password', 'token', 'key', 'secret', 'pat', 'api_key', 'apikey'];

/**
 * Redacts potential secrets from log messages
 */
function redactSecrets(message: string): string {
  // Redact patterns that look like secrets
  let redacted = message.replace(SECRET_PATTERN, '****');
  
  // Redact known secret field values
  SECRET_FIELDS.forEach(field => {
    const regex = new RegExp(`(${field}[\\s]*[:=][\\s]*)([^\\s,}]+)`, 'gi');
    redacted = redacted.replace(regex, '$1****');
  });
  
  return redacted;
}

/**
 * Custom format to redact secrets from logs
 */
const redactFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = redactSecrets(info.message);
  }
  
  // Also redact from metadata
  if (info.meta && typeof info.meta === 'object') {
    info.meta = JSON.parse(redactSecrets(JSON.stringify(info.meta)));
  }
  
  return info;
});

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'primes-ba-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}

/**
 * Log request information (with request ID for tracing)
 */
export function logRequest(
  method: string,
  url: string,
  requestId: string,
  userId?: string
): void {
  logger.info('HTTP Request', {
    method,
    url,
    requestId,
    userId,
  });
}

/**
 * Log response information
 */
export function logResponse(
  method: string,
  url: string,
  statusCode: number,
  requestId: string,
  duration: number
): void {
  logger.info('HTTP Response', {
    method,
    url,
    statusCode,
    requestId,
    duration,
  });
}