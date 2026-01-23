/**
 * Security Logging Utility
 * Requirements: 9.4, 9.5
 * 
 * Logs security events including unauthorized access attempts,
 * authentication failures, and authorization violations.
 */

/**
 * Log security event
 * @param {Object} event - Security event details
 * @param {string} event.type - Event type (UNAUTHORIZED_ACCESS, AUTH_FAILURE, AUTHORIZATION_VIOLATION)
 * @param {string} event.userId - User ID (if available)
 * @param {string} event.username - Username (if available)
 * @param {string} event.role - User role (if available)
 * @param {string} event.endpoint - API endpoint
 * @param {string} event.method - HTTP method
 * @param {string} event.ip - IP address (if available)
 * @param {string} event.reason - Reason for the security event
 * @param {Object} event.metadata - Additional metadata
 */
export function logSecurityEvent(event) {
  const {
    type,
    userId,
    username,
    role,
    endpoint,
    method,
    ip,
    reason,
    metadata = {}
  } = event;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    userId: userId || 'unknown',
    username: username || 'unknown',
    role: role || 'unknown',
    endpoint: endpoint || 'unknown',
    method: method || 'unknown',
    ip: ip || 'unknown',
    reason: reason || 'N/A',
    metadata
  };

  // Log to console (can be extended to log to database or external service)
  console.warn('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2));

  // In production, you might want to:
  // - Send to external logging service (e.g., Sentry, LogRocket)
  // - Store in database audit log table
  // - Send alerts for critical events
}

/**
 * Log unauthorized access attempt
 * @param {Object} request - Next.js request object
 * @param {Object} session - NextAuth session (if available)
 * @param {string} reason - Reason for unauthorized access
 */
export function logUnauthorizedAccess(request, session, reason) {
  const url = new URL(request.url);
  
  logSecurityEvent({
    type: 'UNAUTHORIZED_ACCESS',
    userId: session?.user?.id,
    username: session?.user?.username,
    role: session?.user?.role,
    endpoint: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    reason,
    metadata: {
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    }
  });
}

/**
 * Log authorization violation
 * @param {Object} request - Next.js request object
 * @param {Object} session - NextAuth session
 * @param {string} reason - Reason for authorization violation
 * @param {string} resourceId - Resource ID that was accessed (if applicable)
 * @param {string} resourceType - Resource type (if applicable)
 */
export function logAuthorizationViolation(request, session, reason, resourceId = null, resourceType = null) {
  const url = new URL(request.url);
  
  logSecurityEvent({
    type: 'AUTHORIZATION_VIOLATION',
    userId: session?.user?.id,
    username: session?.user?.username,
    role: session?.user?.role,
    endpoint: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    reason,
    metadata: {
      resourceId,
      resourceType,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    }
  });
}

/**
 * Log authentication failure
 * @param {Object} request - Next.js request object
 * @param {string} username - Username that failed authentication
 * @param {string} reason - Reason for authentication failure
 */
export function logAuthenticationFailure(request, username, reason) {
  const url = new URL(request.url);
  
  logSecurityEvent({
    type: 'AUTH_FAILURE',
    username: username || 'unknown',
    endpoint: url.pathname,
    method: request.method,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    reason,
    metadata: {
      userAgent: request.headers.get('user-agent')
    }
  });
}
