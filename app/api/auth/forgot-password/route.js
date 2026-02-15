import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { EmailNotificationService } from '@/lib/services/email-notification.service.js';
import { getWebsiteConfigurationService } from '@/lib/services/website-configuration.service';

/**
 * Hàm mask email để ẩn phần đầu (ví dụ: abc@gmail.com -> ***abc@gmail.com)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    // Nếu phần local ngắn, chỉ hiển thị ký tự cuối
    return `***${localPart.slice(-1)}@${domain}`;
  }
  // Hiển thị 3 ký tự cuối của phần local
  return `***${localPart.slice(-3)}@${domain}`;
}

/**
 * API route để xử lý yêu cầu quên mật khẩu
 * Tạo token reset password và lưu vào database
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên đăng nhập' },
        { status: 400 }
      );
    }

    // Tìm user theo username
    const user = await prisma.uSR_NGUOI_DUNG.findUnique({
      where: {
        tai_khoan: username,
      },
      include: {
        thong_tin_nha_tro: true,
      },
    });

    // Kiểm tra tên đăng nhập có tồn tại không
    if (!user) {
      return NextResponse.json(
        {
          error: 'Tên đăng nhập không tồn tại trong hệ thống. Vui lòng kiểm tra lại.'
        },
        { status: 404 }
      );
    }

    // Kiểm tra tài khoản có active không
    if (!user.trang_thai) {
      return NextResponse.json(
        {
          error: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
        },
        { status: 403 }
      );
    }

    // Kiểm tra tài khoản có email không
    const recipientEmail = user.thong_tin_nha_tro?.email;
    if (!recipientEmail || recipientEmail.trim() === '') {
      return NextResponse.json(
        {
          error: 'Tài khoản của bạn chưa có email. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
        },
        { status: 400 }
      );
    }

    // Xóa các token cũ chưa sử dụng của user này
    await prisma.uSR_TOKEN_DAT_LAI_MAT_KHAU.deleteMany({
      where: {
        nguoi_dung_id: user.id,
        da_su_dung: false,
        het_han_luc: {
          gt: new Date(), // Chỉ xóa token chưa hết hạn
        },
      },
    });

    // Tạo token mới (32 bytes = 64 ký tự hex)
    const token = randomBytes(32).toString('hex');

    // Token hết hạn sau 1 giờ
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Lưu token vào database
    await prisma.uSR_TOKEN_DAT_LAI_MAT_KHAU.create({
      data: {
        token,
        nguoi_dung_id: user.id,
        het_han_luc: expiresAt,
      },
    });

    // Gửi email chứa link reset password
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    // Lấy brand name từ website config
    const websiteConfigService = getWebsiteConfigurationService();
    const websiteConfig = await websiteConfigService.getCurrentConfiguration();
    const brandName = websiteConfig.ten_thuong_hieu || 'HomeZen';

    // Tạo email template
    const subject = `Đặt lại mật khẩu - ${brandName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #111827;
            background-color: #f9fafb;
            padding: 40px 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .email-header {
            padding: 32px 40px;
            border-bottom: 1px solid #e5e7eb;
            text-align: center;
          }
          .email-header h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin: 0;
            letter-spacing: -0.3px;
          }
          .email-header .brand {
            font-size: 14px;
            color: #6b7280;
            margin-top: 8px;
            font-weight: 400;
          }
          .email-content {
            padding: 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 16px;
            font-weight: 500;
            color: #111827;
            margin-bottom: 20px;
          }
          .message {
            font-size: 16px;
            color: #374151;
            line-height: 1.7;
            margin-bottom: 20px;
          }
          .username {
            font-weight: 600;
            color: #111827;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .reset-button {
            display: inline-block;
            background-color: #10b981 !important;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none !important;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            border: 1px solid #10b981 !important;
            transition: all 0.2s ease;
          }
          .reset-button:hover {
            background-color: #059669 !important;
            border-color: #059669 !important;
            color: #ffffff !important;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 32px 0;
            border: none;
          }
          .link-section {
            margin: 32px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background-color: #f9fafb;
          }
          .link-label {
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .reset-link {
            word-break: break-all;
            font-size: 13px;
            color: #10b981;
            text-decoration: none;
            font-family: 'Courier New', monospace;
            line-height: 1.6;
            display: block;
          }
          .reset-link:hover {
            text-decoration: underline;
          }
          .note {
            margin: 32px 0;
            padding: 16px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background-color: #ffffff;
          }
          .note p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;
            line-height: 1.6;
          }
          .note strong {
            color: #111827;
            font-weight: 600;
          }
          .email-footer {
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            background-color: #f9fafb;
          }
          .email-footer p {
            font-size: 13px;
            color: #9ca3af;
            margin: 0;
            line-height: 1.6;
          }
          @media only screen and (max-width: 600px) {
            body {
              padding: 20px 12px;
            }
            .email-header {
              padding: 24px 20px;
            }
            .email-header h1 {
              font-size: 20px;
            }
            .email-content {
              padding: 32px 24px;
            }
            .reset-button {
              padding: 12px 24px;
              font-size: 15px;
            }
            .link-section {
              padding: 16px;
            }
            .email-footer {
              padding: 20px 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-header">
            <h1>Yêu cầu đặt lại mật khẩu</h1>
            <div class="brand">${websiteConfig.ten_thuong_hieu || 'HomeZen'}</div>
          </div>
          
          <div class="email-content">
            <p class="greeting">Chào bạn,</p>
            <p class="message">
              Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <span class="username">${user.tai_khoan}</span> 
              tại ${websiteConfig.ten_thuong_hieu || 'HomeZen'}.
            </p>
            
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">Đặt lại mật khẩu</a>
            </div>
            
            <p class="message">Liên kết này sẽ có hiệu lực trong vòng <strong>1 giờ</strong>.</p>
            
            <div class="divider"></div>
            
            <div class="link-section">
              <div class="link-label">Nếu nút trên không hoạt động, bạn có thể sử dụng liên kết này:</div>
              <a href="${resetLink}" class="reset-link">${resetLink}</a>
            </div>
            
            <div class="note">
              <p>
                <strong>Lưu ý:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. 
                Mật khẩu của bạn sẽ không thay đổi cho đến khi bạn tạo mật khẩu mới.
              </p>
            </div>
          </div>
          
          <div class="email-footer">
            <p>${websiteConfig.tieu_de_footer || 'HomeZen — Boarding House Management v1.0'}</p>
            <p>&copy; ${new Date().getFullYear()} ${websiteConfig.ten_thuong_hieu || 'HomeZen'}. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const textContent = `
Đặt lại mật khẩu - ${brandName}

Xin chào,

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản ${user.tai_khoan}.

Vui lòng truy cập liên kết sau để đặt lại mật khẩu:
${resetLink}

Lưu ý: Liên kết này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

© ${new Date().getFullYear()} ${brandName}. Tất cả quyền được bảo lưu.
    `;

    // Gửi email
    try {
      await EmailNotificationService.sendEmail(
        recipientEmail,
        subject,
        textContent,
        htmlContent,
        user.id
      );

      // Trả về success với email đã mask
      const maskedEmail = maskEmail(recipientEmail);
      return NextResponse.json(
        {
          success: true,
          message: `Đã gửi email đặt lại mật khẩu đến ${maskedEmail}. Vui lòng kiểm tra hộp thư của bạn.`
        },
        { status: 200 }
      );
    } catch (emailError) {
      // Log lỗi và trả về lỗi
      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json(
        {
          error: 'Không thể gửi email. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    // Trả về success để không tiết lộ lỗi hệ thống
    return NextResponse.json(
      {
        success: true,
        message: 'Nếu tên đăng nhập tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.'
      },
      { status: 200 }
    );
  }
}
