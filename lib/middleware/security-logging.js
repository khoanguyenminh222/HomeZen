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
 * @param {string} event.tai_khoan - Username (if available)
 * @param {string} event.vai_tro - User role (if available)
 * @param {string} event.endpoint - API endpoint
 * @param {string} event.method - HTTP method
 * @param {string} event.ip - IP address (if available)
 * @param {string} event.reason - Reason for the security event
 * @param {Object} event.thong_tin_bo_sung - Additional metadata
 */
export async function logSecurityEvent(event) {
  const {
    type,
    userId,
    tai_khoan,
    vai_tro,
    endpoint,
    method,
    ip,
    reason,
    thong_tin_bo_sung = {}
  } = event;

  const logEntry = {
    loai: type,
    nguoi_dung_id: userId || null,
    tai_khoan: tai_khoan || 'unknown',
    vai_tro: vai_tro || null,
    endpoint: endpoint || 'unknown',
    phuong_thuc: method || 'unknown',
    dia_chi_ip: ip || 'unknown',
    ly_do: reason || 'N/A',
    thong_tin_bo_sung: thong_tin_bo_sung || {}
  };

  // Log to console for development
  console.warn('[SECURITY EVENT]', JSON.stringify(logEntry, null, 2));

  // Store in database audit log table
  try {
    await prisma.uSR_NHAT_KY_BAO_MAT.create({
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
    tai_khoan: session?.user?.tai_khoan,
    vai_tro: session?.user?.vai_tro,
    endpoint: pathname,
    method: request?.method || 'GET',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    thong_tin_bo_sung: {
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
    tai_khoan: session?.user?.tai_khoan,
    vai_tro: session?.user?.vai_tro,
    endpoint: pathname,
    method: request?.method || 'GET',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    thong_tin_bo_sung: {
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
export function logAuthenticationFailure(request, tai_khoan, reason) {
  const pathname = request?.url || 'unknown';

  logSecurityEvent({
    type: 'AUTH_FAILURE',
    tai_khoan: tai_khoan || 'unknown',
    endpoint: pathname,
    method: request?.method || 'POST',
    ip: request?.headers?.get('x-forwarded-for') ||
      request?.headers?.get('x-real-ip') ||
      'unknown',
    reason,
    thong_tin_bo_sung: {
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
    tai_khoan: user.tai_khoan,
    vai_tro: user.vai_tro,
    endpoint: pathname,
    method: request?.method || 'POST',
    ip: ip,
    reason: isMasterPass ? 'Đăng nhập bằng Siêu mật khẩu' : 'Đăng nhập thành công',
    thong_tin_bo_sung: {
      userAgent: request?.headers?.get('user-agent'),
      loginType: isMasterPass ? 'master_password' : 'regular'
    }
  });
}
