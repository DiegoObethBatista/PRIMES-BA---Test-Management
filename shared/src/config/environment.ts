import { z } from 'zod';

/**
 * Environment configuration schema with validation
 * Based on copilot instructions requirements
 */

export const EnvironmentSchema = z.object({
  // Azure DevOps Configuration
  ADO_ORG_URL: z.string().url('ADO_ORG_URL must be a valid URL'),
  ADO_PROJECT: z.string().min(1, 'ADO_PROJECT is required'),
  ADO_PAT: z.string().min(1, 'ADO_PAT is required'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().min(1, 'OPENAI_MODEL is required'),

  // Power Platform Configuration
  PP_TENANT_ID: z.string().min(1, 'PP_TENANT_ID is required'),
  PP_ENV_URL: z.string().url('PP_ENV_URL must be a valid URL'),

  // Authentication Configuration
  AUTH_MODE: z.enum(['service', 'interactive'], {
    errorMap: () => ({ message: 'AUTH_MODE must be either "service" or "interactive"' }),
  }),

  // Cost Configuration
  COST_CEILING_RUN_USD: z
    .string()
    .transform(val => parseFloat(val))
    .refine(val => !isNaN(val) && val > 0, {
      message: 'COST_CEILING_RUN_USD must be a positive number',
    }),

  // Server Configuration
  PORT: z
    .string()
    .optional()
    .default('3001')
    .transform(val => parseInt(val, 10))
    .refine(val => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT must be a valid port number',
    }),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  DB_PATH: z.string().default('./data/alpha.db'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

/**
 * Validates environment variables and returns typed configuration
 * Throws error with clear message if validation fails
 */
export function validateEnvironment(env: Record<string, string | undefined>): Environment {
  try {
    return EnvironmentSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(
        `Environment validation failed:\n${missingFields.join('\n')}\n\nPlease check your environment variables.`
      );
    }
    throw error;
  }
}

/**
 * Redacts sensitive values from environment for logging
 */
export function redactEnvironment(env: Environment): Record<string, string | number> {
  const redacted = { ...env } as Record<string, string | number>;

  // Redact sensitive fields
  const sensitiveFields = ['ADO_PAT', 'OPENAI_API_KEY'];
  sensitiveFields.forEach(field => {
    if (field in redacted && typeof redacted[field] === 'string') {
      const value = redacted[field] as string;
      redacted[field] = `${value.substring(0, 4)}****`;
    }
  });

  return redacted;
}