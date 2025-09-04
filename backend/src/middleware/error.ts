import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './validation';
import { logger } from '../utils/logger';

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  requestId?: string;
  details?: unknown;
}

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log the error with context
  logger.error('Request Error', {
    error: error.message,
    stack: error.stack,
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
  });

  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let details: unknown;

  // Handle specific error types
  if (error.name === 'ValidationError' || error instanceof ValidationError) {
    statusCode = 400;
    errorMessage = 'Validation Error';
    details = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Not Found';
  } else if (error.name === 'ConflictError') {
    statusCode = 409;
    errorMessage = 'Conflict';
  } else if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorMessage = 'Too Many Requests';
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: error.name || 'Error',
    message: errorMessage,
    requestId,
  };

  // Include details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details || error.message;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.headers['x-request-id'] as string;
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
    requestId,
  };

  res.status(404).json(errorResponse);
}