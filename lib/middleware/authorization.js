import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logUnauthorizedAccess, logAuthorizationViolation } from './security-logging';

/**
 * Property-based authorization middleware
 * Requirements: 3.3, 3.4, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5
 */

/**
 * Check if user is Super Admin
 * @param {Object} session - NextAuth session
 * @returns {boolean}
 */
export function isSuperAdmin(session) {
  return session?.user?.role === 'SUPER_ADMIN';
}

/**
 * Check if user is Property Owner
 * @param {Object} session - NextAuth session
 * @returns {boolean}
 */
export function isPropertyOwner(session) {
  return session?.user?.role === 'PROPERTY_OWNER';
}

/**
 * Check if user has access to another user's property (for admin operations)
 * For property owners, they only have access to their own property
 * @param {string} userId - User ID requesting access
 * @param {string} targetUserId - Target user ID (property owner)
 * @returns {Promise<boolean>}
 */
export async function hasUserAccess(userId, targetUserId) {
  if (!userId || !targetUserId) {
    return false;
  }

  // Super Admin has access to all users
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'SUPER_ADMIN') {
    return true;
  }

  // Property owners can only access their own data
  return userId === targetUserId;
}

/**
 * Get user ID for property owner (returns userId for property owners, null for super admin)
 * For property owners, returns their own userId
 * For super admin, returns null (meaning they can access all)
 * @param {string} userId - User ID
 * @returns {Promise<string|null>}
 */
export async function getUserPropertyOwnerId(userId) {
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Super Admin has access to all (returns null to indicate no filtering)
  if (user?.role === 'SUPER_ADMIN') {
    return null;
  }

  // Property owners can only access their own data
  return userId;
}

/**
 * Middleware to require Super Admin role
 * @param {Function} handler - API route handler
 * @returns {Function}
 */
export function requireSuperAdmin(handler) {
  return async (request, context) => {
    const session = await auth();

    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isSuperAdmin(session)) {
      logAuthorizationViolation(
        request, 
        session, 
        'Super Admin access required but user is not Super Admin'
      );
      return NextResponse.json(
        { error: 'Forbidden: Super Admin access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Middleware to require Property Owner role
 * @param {Function} handler - API route handler
 * @returns {Function}
 */
export function requirePropertyOwner(handler) {
  return async (request, context) => {
    const session = await auth();

    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isPropertyOwner(session)) {
      logAuthorizationViolation(
        request, 
        session, 
        'Property Owner access required but user is not Property Owner'
      );
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Middleware to require user access (for accessing another user's data)
 * @param {Function} handler - API route handler
 * @param {Function} getTargetUserId - Function to extract target userId from request
 * @returns {Function}
 */
export function requireUserAccess(handler, getTargetUserId) {
  return async (request, context) => {
    const session = await auth();

    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Super Admin has access to all users
    if (isSuperAdmin(session)) {
      return handler(request, context);
    }

    const targetUserId = getTargetUserId ? getTargetUserId(request, context) : null;

    if (!targetUserId) {
      logAuthorizationViolation(
        request, 
        session, 
        'Target User ID is required but not provided'
      );
      return NextResponse.json(
        { error: 'Target User ID is required' },
        { status: 400 }
      );
    }

    const hasAccess = await hasUserAccess(session.user.id, targetUserId);

    if (!hasAccess) {
      logAuthorizationViolation(
        request, 
        session, 
        `No access to user ${targetUserId}`,
        targetUserId,
        'user'
      );
      return NextResponse.json(
        { error: 'Forbidden: No access to this user' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Add user filter to Prisma query options for user-scoped resources
 * @param {Object} options - Prisma query options
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated query options with userId filter
 */
export async function addUserFilter(options, userId) {
  if (!userId) {
    return options;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Super Admin can see all data (no filter)
  if (user?.role === 'SUPER_ADMIN') {
    return options;
  }

  // Property owners can only see their own data
  return {
    ...options,
    where: {
      ...options.where,
      userId
    }
  };
}

/**
 * Validate resource ownership for a user-scoped resource
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID (room, feeType, utilityRate, etc.)
 * @param {string} resourceType - Resource type ('room', 'feeType', 'utilityRate')
 * @returns {Promise<boolean>}
 */
export async function validateResourceOwnership(userId, resourceId, resourceType) {
  if (!userId || !resourceId) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Super Admin has access to all resources
  if (user?.role === 'SUPER_ADMIN') {
    return true;
  }

  // Get resource with userId
  let resource;
  switch (resourceType) {
    case 'room':
      resource = await prisma.room.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      break;
    case 'feeType':
      resource = await prisma.feeType.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      break;
    case 'utilityRate':
      resource = await prisma.utilityRate.findUnique({
        where: { id: resourceId },
        select: { userId: true }
      });
      break;
    default:
      return false;
  }

  if (!resource || !resource.userId) {
    return false;
  }

  // Property owners can only access their own resources
  return resource.userId === userId;
}

/**
 * Middleware wrapper to ensure authentication for all routes
 * Logs unauthorized access attempts and validates user exists in database
 * @param {Function} handler - API route handler
 * @returns {Function}
 */
export function requireAuth(handler) {
  return async (request, context) => {
    const session = await auth();

    if (!session) {
      logUnauthorizedAccess(request, null, 'No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate user still exists and is active in database
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, isActive: true, role: true }
      });

      if (!user) {
        logUnauthorizedAccess(request, session.user.id, 'User not found in database');
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }

      if (!user.isActive) {
        logUnauthorizedAccess(request, session.user.id, 'User account is inactive');
        return NextResponse.json(
          { error: 'Account deactivated' },
          { status: 401 }
        );
      }

      // Update session with current user data
      session.user.isActive = user.isActive;
      session.user.role = user.role;

    } catch (error) {
      console.error('Error validating user in requireAuth middleware:', error);
      logUnauthorizedAccess(request, session.user.id, 'Database error during user validation');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    return handler(request, context, session);
  };
}
