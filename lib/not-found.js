import { notFound } from 'next/navigation';

/**
 * Utility function để trigger 404 page
 * Sử dụng trong API routes hoặc server components
 */
export function triggerNotFound() {
  notFound();
}

/**
 * Check if resource exists, if not trigger 404
 */
export function validateResourceExists(resource, resourceName = 'Resource') {
  if (!resource) {
    console.warn(`${resourceName} not found, triggering 404`);
    notFound();
  }
  return resource;
}