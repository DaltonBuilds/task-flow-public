// Environment variable validation and type-safe access
import type { D1Database } from '@cloudflare/workers-types';
import type { Bindings } from '../types';

export interface EnvConfig {
  DB: D1Database;
  ALLOWED_ORIGINS?: string;
  ENVIRONMENT?: string;
}

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables
 */
export function validateEnv(env: Bindings): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required variables
  if (!env.DB) {
    errors.push('DB (D1Database) is required but not found');
  }
  
  // Optional but recommended variables
  const environment = env.ENVIRONMENT || 'development';
  
  if (environment === 'production') {
    if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim().length === 0) {
      warnings.push('ALLOWED_ORIGINS is not set in production. CORS will be restricted to same-origin only.');
    } else {
      // Validate ALLOWED_ORIGINS format
      const origins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      const invalidOrigins = origins.filter(o => {
        try {
          new URL(o);
          return false;
        } catch {
          return true;
        }
      });
      
      if (invalidOrigins.length > 0) {
        errors.push(`Invalid origins in ALLOWED_ORIGINS: ${invalidOrigins.join(', ')}`);
      }
    }
  }
  
  // Validate ENVIRONMENT value
  if (env.ENVIRONMENT && !['development', 'production', 'staging'].includes(env.ENVIRONMENT)) {
    warnings.push(`ENVIRONMENT has unexpected value: ${env.ENVIRONMENT}. Expected: development, production, or staging`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment configuration
 * Throws if required variables are missing
 */
export function getEnvConfig(env: Bindings): EnvConfig {
  const validation = validateEnv(env);
  
  if (!validation.valid) {
    throw new Error(
      `Environment validation failed:\n${validation.errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
  
  // Log warnings but don't fail
  if (validation.warnings.length > 0) {
    console.warn('Environment warnings:');
    validation.warnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  return {
    DB: env.DB,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    ENVIRONMENT: env.ENVIRONMENT || 'development',
  };
}
