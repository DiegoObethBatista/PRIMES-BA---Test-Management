import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logRequest, logResponse } from '../utils/logger';

/**
 * Add request ID to all requests for tracing
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Log all HTTP requests and responses
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;
  
  // Log incoming request
  logRequest(req.method, req.url, requestId);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logResponse(req.method, req.url, res.statusCode, requestId, duration);
  });
  
  next();
}