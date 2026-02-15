import prisma from '@/lib/prisma';
import { getProcedureManagerService } from '@/lib/services/procedure-manager.service';
import { getTemplateManagerService } from '@/lib/services/template-manager.service';
import { reportLogger } from '@/lib/utils/report-logger';

const procedureManager = getProcedureManagerService();
const templateManager = getTemplateManagerService();

/**
 * Report Seeder
 * Khởi tạo dữ liệu mẫu cho hệ thống báo cáo (Phiên bản HTML/PDF)
 */
export async function seedInitialReports(userId) {
    reportLogger.info('Starting report seeding (HTML/PDF version)...');

    // 1. Dữ liệu các Procedure mẫu
    const procedures = [
        {
            ten: 'report_revenue_summary',
            mo_ta: 'Báo cáo tổng hợp doanh thu theo phòng và tháng.',
            sql: `
CREATE OR REPLACE FUNCTION report_revenue_summary(
    p_uid TEXT,
    p_start_date TIMESTAMP DEFAULT '2024-01-01',
    p_end_date TIMESTAMP DEFAULT '2024-12-31'
) RETURNS TABLE (
    room_code TEXT,
    room_name TEXT,
    total_amount DECIMAL,
    paid_amount DECIMAL,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.ma_phong as room_code,
        r.ten_phong as room_name,
        COALESCE(SUM(b.tong_tien), 0) as total_amount,
        COALESCE(SUM(b.so_tien_da_tra), 0) as paid_amount,
        CASE 
            WHEN SUM(b.tong_tien) = SUM(b.so_tien_da_tra) AND SUM(b.tong_tien) > 0 THEN 'Đã thanh toán'
            WHEN SUM(b.so_tien_da_tra) > 0 THEN 'Thiếu một phần'
            ELSE 'Chưa thanh toán'
        END as status
    FROM "PRP_PHONG" r
    LEFT JOIN "BIL_HOA_DON" b ON r.id = b.phong_id
    WHERE r.nguoi_dung_id = p_uid
    AND b.ngay_tao BETWEEN p_start_date AND p_end_date
    GROUP BY r.ma_phong, r.ten_phong;
END;
$$ LANGUAGE plpgsql;
      `
        },
        {
            ten: 'report_occupancy_status',
            mo_ta: 'Trạng thái thuê phòng hiện tại và thông tin khách thuê.',
            sql: `
CREATE OR REPLACE FUNCTION report_occupancy_status(
    p_uid TEXT
) 
RETURNS TABLE (
    room_code TEXT,
    room_status TEXT,
    tenant_name TEXT,
    phone TEXT,
    move_in_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.ma_phong,
        r.trang_thai::text,
        t.ho_ten,
        t.dien_thoai,
        t.ngay_vao_o
    FROM "PRP_PHONG" r
    LEFT JOIN "TNT_NGUOI_THUE_CHINH" t ON r.id = t.phong_id
    WHERE r.nguoi_dung_id = p_uid
    ORDER BY r.ma_phong;
END;
$$ LANGUAGE plpgsql;
      `
        },
        {
            ten: 'proc_bao_cao_ct01',
            mo_ta: 'Tờ khai thay đổi thông tin cư trú (Mẫu CT01).',
            sql: `
CREATE OR REPLACE FUNCTION proc_bao_cao_ct01(
    p_uid TEXT,
    p_phong TEXT
) RETURNS TABLE (
    ten_phong TEXT,
    ho_ten_chu TEXT,
    ngay_sinh_chu TIMESTAMP,
    gioi_tinh_chu TEXT,
    cccd_chu TEXT,
    sdt_chu TEXT,
    email_chu TEXT,
    thuong_tru_chu TEXT,
    dia_chi_phong TEXT,
    ten_chu_ho_khau TEXT,
    moi_quan_he_chu TEXT,
    cccd_chu_ho TEXT,
    danh_sach_nguoi_o JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.ten_phong::text,
        t.ho_ten::text as ho_ten_chu,
        t.ngay_sinh as ngay_sinh_chu,
        t.gioi_tinh::text as gioi_tinh_chu,
        t.can_cuoc::text as cccd_chu,
        t.dien_thoai::text as sdt_chu,
        NULL::text as email_chu,
        t.dia_chi_thuong_tru::text as thuong_tru_chu,
        room_info.dia_chi::text as dia_chi_phong,
        room_info.ten_chu_nha::text as ten_chu_ho_khau,
        'Khách thuê'::text as moi_quan_he_chu,
        NULL::text as cccd_chu_ho,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'ho_ten', sub.ho_ten,
                'ngay_sinh', sub.ngay_sinh,
                'gioi_tinh', sub.gioi_tinh,
                'moi_quan_he', sub.moi_quan_he,
                'can_cuoc', sub.can_cuoc
            ))
            FROM "TNT_NGUOI_O" sub
            WHERE sub.nguoi_thue_id = t.id
        ) as danh_sach_nguoi_o
    FROM "PRP_PHONG" r
    LEFT JOIN "TNT_NGUOI_THUE_CHINH" t ON r.id = t.phong_id
    LEFT JOIN "PRP_THONG_TIN_NHA_TRO" room_info ON r.nguoi_dung_id = room_info.nguoi_dung_id
    WHERE r.id = p_phong AND r.nguoi_dung_id = p_uid;
END;
$$ LANGUAGE plpgsql;
      `
        }
    ];

    for (const procData of procedures) {
        try {
            reportLogger.info(`Seeding procedure: ${procData.ten}`);

            const existingProc = await prisma.rPT_THU_TUC.findUnique({
                where: { ten: procData.ten }
            });

            let proc;
            if (existingProc) {
                // Luôn cập nhật nếu có thay đổi SQL hoặc mô tả
                const isSqlChanged = existingProc.dinh_nghia_sql !== procData.sql;
                const isDescriptionChanged = existingProc.mo_ta !== procData.mo_ta;

                if (isSqlChanged || isDescriptionChanged) {
                    proc = await procedureManager.updateProcedure(existingProc.id, procData.sql, {
                        ten: procData.ten,
                        mo_ta: procData.mo_ta,
                    }, userId);
                    reportLogger.info(`Updated existing procedure: ${procData.ten}`);
                } else {
                    proc = existingProc;
                }
            } else {
                proc = await procedureManager.createProcedure(procData.sql, {
                    ten: procData.ten,
                    mo_ta: procData.mo_ta,
                }, userId);
                reportLogger.info(`Created new procedure: ${procData.ten}`);
            }

            let parameterMapping = [];
            if (procData.ten === 'proc_bao_cao_ct01') {
                parameterMapping = [{ ten_tham_so: 'p_phong', loai_hien_thi: 'ROOM_SELECT' }];
            } else if (procData.ten === 'report_revenue_summary') {
                parameterMapping = [
                    { ten_tham_so: 'p_start_date', loai_hien_thi: 'DATE' },
                    { ten_tham_so: 'p_end_date', loai_hien_thi: 'DATE' }
                ];
            }

            await createInitialHtmlTemplate(proc.id, procData.ten, userId, parameterMapping);
        } catch (error) {
            reportLogger.warn(`Failed to seed procedure ${procData.ten}: ${error.message}`);
        }
    }

    reportLogger.info('Report seeding completed.');
}

/**
 * Tạo nội dung HTML template mẫu hỗ trợ Handlebars
 */
async function createInitialHtmlTemplate(procedureId, procName, userId, parameterMapping = []) {
    let htmlContent = '';
    let cssContent = '';

    if (procName === 'report_revenue_summary') {
        cssContent = `
body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; background: #fff; line-height: 1.5; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
.title { font-size: 26px; font-weight: bold; text-transform: uppercase; }
table { width: 100%; border-collapse: collapse; margin-top: 20px; }
th, td { border: 1px solid #000; padding: 10px; text-align: left; }
th { background-color: #f2f2f2; font-weight: bold; }
.footer { margin-top: 50px; text-align: right; font-weight: bold; }
        `.trim();
        htmlContent = `
<div class="header">
    <div class="title">Báo cáo Tổng hợp Doanh thu</div>
    <div style="margin-top: 5px;">Ngày in: {{thong_tin_chinh.thoi_gian_tao}}</div>
</div>
<table>
    <thead>
        <tr>
            <th style="width: 15%;">Mã phòng</th>
            <th>Tên phòng</th>
            <th style="text-align: right; width: 20%;">Tổng doanh thu</th>
            <th style="text-align: right; width: 20%;">Đã thu</th>
            <th style="text-align: center; width: 15%;">Trạng thái</th>
        </tr>
    </thead>
    <tbody>
        {{#each data}}
        <tr>
            <td>{{room_code}}</td>
            <td>{{room_name}}</td>
            <td style="text-align: right;">{{vnCurrency total_amount}}</td>
            <td style="text-align: right;">{{vnCurrency paid_amount}}</td>
            <td style="text-align: center;">{{status}}</td>
        </tr>
        {{/each}}
    </tbody>
</table>
<div class="footer">Người lập biểu: {{thong_tin_chinh.nguoi_lap}}</div>
`;
    } else if (procName === 'report_occupancy_status') {
        cssContent = `
body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; background: #fff; }
.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
.title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
.room-card { margin-bottom: 15px; padding: 15px; border: 1px solid #000; }
.room-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px; }
        `.trim();
        htmlContent = `
<div class="header">
    <div class="title">Trạng thái thuê phòng hiện tại</div>
</div>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
{{#each data}}
<div class="room-card">
    <div class="room-title">Phòng: {{room_code}} - {{room_status}}</div>
    <div>Khách thuê: {{#if tenant_name}}<strong>{{tenant_name}}</strong>{{else}}--- Trống ---{{/if}}</div>
    {{#if phone}}<div>Điện thoại: {{phone}}</div>{{/if}}
    {{#if move_in_date}}<div>Ngày dọn vào: {{vnDate move_in_date}}</div>{{/if}}
</div>
{{/each}}
</div>
`;
    } else if (procName === 'proc_bao_cao_ct01') {
        cssContent = `
body { font-family: 'Times New Roman', Times, serif; padding: 30px; line-height: 1.5; color: #000; max-width: 800px; margin: 0 auto; }
.header-top { text-align: center; margin-bottom: 20px; font-weight: bold; }
.header { text-align: center; margin-bottom: 30px; }
.title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
.subtitle { font-style: italic; font-size: 14px; }
.info-row { margin-bottom: 10px; }
.info-row strong { font-weight: normal; } /* Reset bold to match sample */
table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 14px; vertical-align: middle; }
th { text-align: center; font-weight: bold; }
.footer { margin-top: 30px; display: flex; justify-content: space-between; page-break-inside: avoid; }
.footer-col { text-align: center; flex: 1; padding: 0 5px; }
.sign-area { height: 100px; }
        `.trim();
        htmlContent = `
<div class="header-top" style="font-size: 13px;">
    <div>Mẫu CT01 ban hành kèm theo Thông tư số 66/2023/TT-BCA</div>
    <div>ngày 17/11/2023 của Bộ trưởng Bộ Công an</div>
</div>

<div class="header">
    <div style="font-weight: bold; font-size: 16px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
    <div style="font-weight: bold; font-size: 16px; border-bottom: 1px solid #000; display: inline-block; padding-bottom: 3px;">Độc lập - Tự do - Hạnh phúc</div>
</div>

<div class="header">
    <div class="title">TỜ KHAI THAY ĐỔI THÔNG TIN CƯ TRÚ</div>
    <div style="margin-top: 10px;">Kính gửi <sup>(1)</sup>: Công an ...........................................................</div>
</div>

<div class="info-row">
    1. Họ, chữ đệm và tên khai sinh: <strong>{{ho_ten_chu}}</strong>
</div>
<div class="info-row" style="display: flex; gap: 20px;">
    <div style="flex: 1;">2. Ngày, tháng, năm sinh: {{vnDate ngay_sinh_chu}}</div>
    <div style="width: 150px;">3. Giới tính: {{gioi_tinh_chu}}</div>
</div>
<div class="info-row">
    4. Số định danh cá nhân: {{cccd_chu}}
</div>
<div class="info-row" style="display: flex; gap: 20px;">
    <div style="flex: 1;">5. Số điện thoại liên hệ: {{sdt_chu}}</div>
    <div style="flex: 1;">6. Email: {{email_chu}}</div>
</div>
<div class="info-row">
    7. Nơi thường trú: {{thuong_tru_chu}}
</div>
<div class="info-row">
    8. Nơi tạm trú: {{ten_phong}}, {{dia_chi_phong}}
</div>
<div class="info-row">
    9. Nơi ở hiện tại: {{ten_phong}}, {{dia_chi_phong}}
</div>
<div class="info-row">
    10. Họ, chữ đệm và tên chủ hộ: {{ten_chu_ho_khau}} &nbsp;&nbsp;&nbsp; 11. Quan hệ với chủ hộ: {{moi_quan_he_chu}}
</div>
<div class="info-row">
    12. Số định danh cá nhân của chủ hộ: {{cccd_chu_ho}}
</div>
<div class="info-row">
    13. Nội dung đề nghị <sup>(2)</sup>: Đăng ký tạm trú vào phòng {{ten_phong}}
</div>
<div class="info-row">
    14. Những thành viên trong hộ gia đình cùng thay đổi:
</div>

<table>
    <thead>
        <tr>
            <th style="width: 40px;">TT</th>
            <th>Họ, chữ đệm<br>và tên</th>
            <th style="width: 100px;">Ngày, tháng, năm sinh</th>
            <th style="width: 60px;">Giới tính</th>
            <th style="width: 110px;">Số định danh cá<br>nhân</th>
            <th style="width: 100px;">Mối quan hệ với<br>chủ hộ</th>
        </tr>
    </thead>
    <tbody>
        {{#each danh_sach_nguoi_o}}
        <tr>
            <td style="text-align: center;">{{add @index 1}}</td>
            <td>{{ho_ten}}</td>
            <td style="text-align: center;">{{vnDate ngay_sinh}}</td>
            <td style="text-align: center;">{{gioi_tinh}}</td>
            <td style="text-align: center;">{{can_cuoc}}</td>
            <td style="text-align: center;">{{moi_quan_he}}</td>
        </tr>
        {{/each}}
    </tbody>
</table>

<div class="footer">
    <div class="footer-col">
        <strong>Ý KIẾN CỦA CHỦ HỘ <sup>(3)</sup></strong><br>
        <div class="sign-area"></div>
        <span>{{ten_chu_ho_khau}}</span>
    </div>
    <div class="footer-col">
        <strong>Ý KIẾN CỦA CHỦ SỞ HỮU<br>CHỖ Ở HỢP PHÁP <sup>(4)</sup></strong><br>
        <div class="sign-area"></div>
    </div>
    <div class="footer-col">
        <strong>Ý KIẾN CỦA CHA, MẸ HOẶC<br>NGƯỜI GIÁM HỘ <sup>(5)</sup></strong><br>
        <div class="sign-area"></div>
    </div>
    <div class="footer-col">
        <em>......., ngày ... tháng ... năm ...</em><br>
        <strong>NGƯỜI KÊ KHAI <sup>(6)</sup></strong><br>
        <span style="font-size: 11px; font-style: italic;">(Ký, ghi rõ họ tên)</span>
        <div class="sign-area"></div>
        <strong>{{ho_ten_chu}}</strong>
    </div>
</div>
        `;
    }

    const templateName = `Mẫu ${procName} (Mặc định)`;
    const existingTemplate = await prisma.rPT_MAU_BAO_CAO.findFirst({
        where: { ten: templateName, thu_tuc_id: procedureId }
    });

    const templateData = {
        ten: templateName,
        mo_ta: `Template mặc định cho ${procName}`,
        thu_tuc_id: procedureId,
        danh_muc: procName === 'proc_bao_cao_ct01' ? 'Hành chính' : 'Hệ thống',
        noi_dung: htmlContent.trim(),
        css: cssContent.trim(),
        js: '',
        anh_xa_tham_so: parameterMapping,
        phan_quyen: { users: [], roles: ['SIEU_QUAN_TRI'] }, // Empty users array, admin can assign later
        trang_thai: true,
        nguoi_tao: userId
    };

    if (existingTemplate) {
        // Force update content and css to ensure latest version
        await prisma.rPT_MAU_BAO_CAO.update({
            where: { id: existingTemplate.id },
            data: {
                noi_dung: htmlContent.trim(),
                css: cssContent.trim(),
                anh_xa_tham_so: parameterMapping,
                phan_quyen: { users: [], roles: ['SIEU_QUAN_TRI'] }
            }
        });
        reportLogger.info(`Updated existing template content: ${templateName}`);
    } else {
        await prisma.rPT_MAU_BAO_CAO.create({
            data: templateData
        });
        reportLogger.info(`Created new template: ${templateName}`);
    }
}
