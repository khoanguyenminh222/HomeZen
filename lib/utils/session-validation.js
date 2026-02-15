import prisma from '@/lib/prisma';

/**
 * Validate if a user session is still valid by checking database
 * @param {string} userId - User ID from session
 * @returns {Promise<{isValid: boolean, user?: Object, reason?: string}>}
 */
export async function validateUserSession(userId) {
  if (!userId) {
    return { isValid: false, reason: 'No user ID provided' };
  }

  try {
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tai_khoan: true,
        vai_tro: true,
        trang_thai: true,
        ngay_tao: true,
        ngay_cap_nhat: true
      }
    });

    if (!user) {
      return { isValid: false, reason: 'User not found in database' };
    }

    if (!user.trang_thai) {
      return { isValid: false, reason: 'Account is deactivated' };
    }

    return { isValid: true, user };
  } catch (error) {
    console.error('Error validating user session:', error);
    return { isValid: false, reason: 'Database error during validation' };
  }
}

/**
 * Middleware helper to validate session and return appropriate response
 * @param {Object} session - NextAuth session
 * @returns {Promise<{isValid: boolean, response?: NextResponse, user?: Object}>}
 */
export async function validateSessionMiddleware(session) {
  if (!session) {
    return {
      isValid: false,
      response: NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    };
  }

  const validation = await validateUserSession(session.user.id);

  if (!validation.isValid) {
    const statusCode = validation.reason === 'Database error during validation' ? 500 : 401;
    return {
      isValid: false,
      response: NextResponse.json(
        { error: validation.reason },
        { status: statusCode }
      )
    };
  }

  return {
    isValid: true,
    user: validation.user
  };
}