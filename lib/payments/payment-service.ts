/**
 * Payment Service Entry Point
 * 
 * This file provides backward compatibility by re-exporting 
 * the modular payment services
 */

// Re-export all payment services and types for backward compatibility
export * from './payment-service-new';

// Default export for existing imports
export { default } from './payment-service-new';