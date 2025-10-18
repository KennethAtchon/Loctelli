/**
 * Core module exports
 * Provides configuration types, validation, and management utilities
 */

// Configuration types
export * from './config.types';

// Configuration validation
export * from './config.validator';

// Configuration manager (internal use)
export { getConfigManager, ConfigurationManager } from './config.manager';
