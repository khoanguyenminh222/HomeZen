import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';

/**
 * User Service
 * Requirements: 4.5
 * 
 * Handles user-related operations including password management
 */
export class UserService {
  /**
   * Change password for a user
   * Requirements: 4.5
   * 
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      select: { id: true, mat_khau: true, vai_tro: true, trang_thai: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.trang_thai) {
      throw new Error('Account is deactivated');
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.mat_khau);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is different
    const isSamePassword = await verifyPassword(newPassword, user.mat_khau);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password (maintain role and other fields)
    await prisma.uSR_NGUOI_DUNG.update({
      where: { id: user.id },
      data: {
        mat_khau: hashedPassword,
      }
    });

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Reset password for a user (Admin only)
   * Requirements: 4.5
   * 
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  static async resetPassword(userId, newPassword) {
    // Get user
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: { id: userId },
      select: { id: true, vai_tro: true, trang_thai: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password (maintain role and other fields)
    await prisma.uSR_NGUOI_DUNG.update({
      where: { id: user.id },
      data: {
        mat_khau: hashedPassword,
      }
    });

    return { success: true, message: 'Password reset successfully' };
  }
}
