import { auth } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Property-based authorization middleware
 * Requirements: 3.3, 3.4, 3.5, 9.1, 9.2, 9.3
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
 * Check if user has access to a property
 * @param {string} userId - User ID
 * @param {string} propertyId - Property ID
 * @returns {Promise<boolean>}
 */
export async function hasPropertyAccess(userId, propertyId) {
  if (!userId || !propertyId) {
    return false;
  }

  // Super Admin has access to all properties
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (user?.role === 'SUPER_ADMIN') {
    return true;
  }

  // Check PropertyOwnership
  const ownership = await prisma.propertyOwnership.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId
      }
    }
  });

  return !!ownership;
}

/**
 * Get all property IDs that user has access to
 * @param {string} userId - User ID
 * @returns {Promise<string[]>}
 */
export async function getUserPropertyIds(userId) {
  if (!userId) {
    return [];
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Super Admin has access to all properties
  if (user?.role === 'SUPER_ADMIN') {
    const allProperties = await prisma.property.findMany({
      select: { id: true }
    });
    return allProperties.map(p => p.id);
  }

  // Get properties from PropertyOwnership
  const ownerships = await prisma.propertyOwnership.findMany({
    where: { userId },
    select: { propertyId: true }
  });

  return ownerships.map(o => o.propertyId);
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isSuperAdmin(session)) {
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!isPropertyOwner(session)) {
      return NextResponse.json(
        { error: 'Forbidden: Property Owner access required' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Middleware to require property access
 * @param {Function} handler - API route handler
 * @param {Function} getPropertyId - Function to extract propertyId from request
 * @returns {Function}
 */
export function requirePropertyAccess(handler, getPropertyId) {
  return async (request, context) => {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Super Admin has access to all properties
    if (isSuperAdmin(session)) {
      return handler(request, context);
    }

    const propertyId = getPropertyId ? getPropertyId(request, context) : null;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const hasAccess = await hasPropertyAccess(session.user.id, propertyId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: No access to this property' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
}

/**
 * Add property filter to Prisma query options
 * @param {Object} options - Prisma query options
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated query options with property filter
 */
export async function addPropertyFilter(options, userId) {
  if (!userId) {
    return options;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  // Super Admin can see all properties
  if (user?.role === 'SUPER_ADMIN') {
    return options;
  }

  // Get user's property IDs
  const propertyIds = await getUserPropertyIds(userId);

  if (propertyIds.length === 0) {
    // User has no properties, return empty result
    return {
      ...options,
      where: {
        ...options.where,
        id: 'none' // This will return no results
      }
    };
  }

  // Add property filter
  return {
    ...options,
    where: {
      ...options.where,
      propertyId: {
        in: propertyIds
      }
    }
  };
}

/**
 * Validate property ownership for a resource
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

  // Get resource with propertyId
  let resource;
  switch (resourceType) {
    case 'room':
      resource = await prisma.room.findUnique({
        where: { id: resourceId },
        select: { propertyId: true }
      });
      break;
    case 'feeType':
      resource = await prisma.feeType.findUnique({
        where: { id: resourceId },
        select: { propertyId: true }
      });
      break;
    case 'utilityRate':
      resource = await prisma.utilityRate.findUnique({
        where: { id: resourceId },
        select: { propertyId: true }
      });
      break;
    default:
      return false;
  }

  if (!resource || !resource.propertyId) {
    return false;
  }

  return hasPropertyAccess(userId, resource.propertyId);
}
