/**
 * Error Handler Utility
 * Requirements: 9.4, 11.2
 * 
 * Centralized error handling for API routes
 */

/**
 * Handle API errors and return appropriate responses
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred (e.g., 'creating room')
 * @returns {Object} NextResponse-compatible error response
 */
export function handleApiError(error, context = 'operation') {
  console.error(`Error ${context}:`, error);

  // Zod validation errors
  if (error.name === 'ZodError') {
    return {
      error: 'Dữ liệu không hợp lệ',
      details: error.errors,
      status: 400
    };
  }

  // Prisma unique constraint errors
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return {
      error: `${field} đã tồn tại`,
      details: `Giá trị này đã được sử dụng. Vui lòng chọn giá trị khác.`,
      status: 400
    };
  }

  // Prisma foreign key constraint errors
  if (error.code === 'P2003') {
    return {
      error: 'Tham chiếu không hợp lệ',
      details: 'Dữ liệu được tham chiếu không tồn tại.',
      status: 400
    };
  }

  // Prisma record not found errors
  if (error.code === 'P2025') {
    return {
      error: 'Không tìm thấy dữ liệu',
      details: 'Bản ghi bạn đang tìm không tồn tại hoặc đã bị xóa.',
      status: 404
    };
  }

  // Authorization errors
  if (error.message?.includes('Forbidden') || error.message?.includes('No access')) {
    return {
      error: 'Không có quyền truy cập',
      details: 'Bạn không có quyền thực hiện thao tác này.',
      status: 403
    };
  }

  // Authentication errors
  if (error.message?.includes('Unauthorized') || error.message?.includes('session')) {
    return {
      error: 'Chưa đăng nhập',
      details: 'Vui lòng đăng nhập để tiếp tục.',
      status: 401
    };
  }

  // Business logic errors (custom error messages)
  if (error.message && !error.code) {
    return {
      error: error.message,
      status: 400
    };
  }

  // Generic server errors
  return {
    error: `Lỗi khi ${context}`,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    status: 500
  };
}

/**
 * Create a standardized error response for NextResponse
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @returns {NextResponse} NextResponse with error
 */
export function createErrorResponse(error, context = 'operation') {
  const errorData = handleApiError(error, context);
  return Response.json(
    {
      error: errorData.error,
      ...(errorData.details && { details: errorData.details })
    },
    { status: errorData.status }
  );
}

/**
 * Validate property ownership for operations
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID to check
 * @param {string} resourceType - Type of resource ('room', 'feeType', 'utilityRate')
 * @returns {Promise<boolean>} True if user owns the resource
 */
export async function validatePropertyOwnership(userId, resourceId, resourceType) {
  const prisma = (await import('@/lib/prisma')).default;
  
  try {
    switch (resourceType) {
      case 'room':
        const room = await prisma.room.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        return room?.userId === userId;
      
      case 'feeType':
        const feeType = await prisma.feeType.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        return feeType?.userId === userId;
      
      case 'utilityRate':
        const utilityRate = await prisma.utilityRate.findUnique({
          where: { id: resourceId },
          select: { userId: true }
        });
        return utilityRate?.userId === userId;
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error validating property ownership:', error);
    return false;
  }
}
