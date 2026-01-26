import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

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
 * @param {string} event.type - Event type (UNAUTHORIZED_ACCESS, AUTH_FAILURE, AUTHORIZATION_VIOLATION, MASTER_PASS_USE, LOGIN_SUCCESS)
 * @param {string} event.userId - User ID (if available)
 * @param {string} event.username - Username (if available)
 * @param {string} event.role - User role (if available)
 * @param {string} event.endpoint - API endpoint
 * @param {string} event.method - HTTP method
 * @param {string} event.ip - IP address (if available)
 * @param {string} event.reason - Reason for the security event
 * @param {Object} event.metadata - Additional metadata
 */
export async function logSecurityEvent(event) {
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

  const logEntry = {
    type,
    userId: userId || null,
    username: username || 'unknown',
    role: role || null,
    endpoint: endpoint || 'unknown',
    method: method || 'unknown',
    ip: ip || 'unknown',
    reason: reason || 'N/A',
    metadata: metadata || {}
  };

  // Log to console for development
  console.warn('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2));

  // Store in database audit log table
  try {
    await prisma.securityLog.create({
      data: logEntry
    });
  } catch (error) {
    console.error('FAILED TO SAVE SECURITY LOG TO DB:', error);
  }
}

/**
 * Log unauthorized access attempt
 * @param {Object} request - Next.js request object
 * @param {Object} session - NextAuth session (if available)
 * @param {string} reason - Reason for unauthorized access
 */
export function logUnauthorizedAccess(request, session, reason) {
  const pathname = request?.url || 'unknown';

  logSecurityEvent({
    type: 'UNAUTHORIZED_ACCESS',
    userId: session?.user?.id,
    username: session?.user?.username,
    role: session?.user?.role,
    endpoint: pathname,
    method: request?.method || 'GET',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    metadata: {
      userAgent: request?.headers?.get('user-agent'),
      referer: request?.headers?.get('referer')
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
  const pathname = request?.url || 'unknown';

  logSecurityEvent({
    type: 'AUTHORIZATION_VIOLATION',
    userId: session?.user?.id,
    username: session?.user?.username,
    role: session?.user?.role,
    endpoint: pathname,
    method: request?.method || 'GET',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    metadata: {
      resourceId,
      resourceType,
      userAgent: request?.headers?.get('user-agent'),
      referer: request?.headers?.get('referer')
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
  const pathname = request?.url || 'unknown';

  logSecurityEvent({
    type: 'AUTH_FAILURE',
    username: username || 'unknown',
    endpoint: pathname,
    method: request?.method || 'POST',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    metadata: {
      userAgent: request?.headers?.get('user-agent')
    }
  });
}

/**
 * Log login success
 * @param {Object} request - Next.js request object
 * @param {Object} user - Authenticated user object
 * @param {boolean} isMasterPass - Whether master password was used
 */
export function logLoginSuccess(request, user, isMasterPass = false) {
  const pathname = request?.url || '/api/auth/signin';
  const ip = request?.headers?.get('x-forwarded-for') ||
    request?.headers?.get('x-real-ip') ||
    'unknown';

  logSecurityEvent({
    type: isMasterPass ? 'MASTER_PASS_USE' : 'LOGIN_SUCCESS',
    userId: user.id,
    username: user.username,
    role: user.role,
    endpoint: pathname,
    method: request?.method || 'POST',
    ip: ip,
    reason: isMasterPass ? 'Đăng nhập bằng Siêu mật khẩu' : 'Đăng nhập thành công',
    metadata: {
      userAgent: request?.headers?.get('user-agent'),
      loginType: isMasterPass ? 'master_password' : 'regular'
    }
  });
}
