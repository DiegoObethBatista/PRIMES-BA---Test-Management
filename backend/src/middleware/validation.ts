import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(public errors: Array<{ field: string; message: string }>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Middleware to handle validation results
 */
export function handleValidation(req: Request, _res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg as string,
    }));
    
    throw new ValidationError(validationErrors);
  }
  
  next();
}

/**
 * Helper to run validation chains
 */
export async function runValidations(
  validations: ValidationChain[],
  req: Request,
  res: Response
): Promise<void> {
  await Promise.all(validations.map(validation => validation.run(req)));
  handleValidation(req, res, () => {});
}