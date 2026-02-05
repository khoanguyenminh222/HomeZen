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
            name: 'report_revenue_summary',
            description: 'Báo cáo tổng hợp doanh thu theo phòng và tháng.',
            sql: `
CREATE OR REPLACE FUNCTION report_revenue_summary(
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
        r.code as room_code,
        r.name as room_name,
        COALESCE(SUM(b."totalCost"), 0) as total_amount,
        COALESCE(SUM(b."paidAmount"), 0) as paid_amount,
        CASE 
            WHEN SUM(b."totalCost") = SUM(b."paidAmount") AND SUM(b."totalCost") > 0 THEN 'Đã thanh toán'
            WHEN SUM(b."paidAmount") > 0 THEN 'Thiếu một phần'
            ELSE 'Chưa thanh toán'
        END as status
    FROM "Room" r
    LEFT JOIN "Bill" b ON r.id = b."roomId"
    WHERE b."createdAt" BETWEEN p_start_date AND p_end_date
    GROUP BY r.code, r.name;
END;
$$ LANGUAGE plpgsql;
      `
        },
        {
            name: 'report_occupancy_status',
            description: 'Trạng thái thuê phòng hiện tại và thông tin khách thuê.',
            sql: `
CREATE OR REPLACE FUNCTION report_occupancy_status() 
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
        r.code,
        r.status::text,
        t."fullName",
        t.phone,
        t."moveInDate"
    FROM "Room" r
    LEFT JOIN "Tenant" t ON r.id = t."roomId"
    ORDER BY r.code;
END;
$$ LANGUAGE plpgsql;
      `
        }
    ];

    for (const procData of procedures) {
        try {
            reportLogger.info(`Seeding procedure: ${procData.name}`);

            // Kiểm tra xem procedure đã tồn tại chưa
            const existingProc = await prisma.reportProcedure.findUnique({
                where: { name: procData.name }
            });

            let proc;
            if (existingProc) {
                // Chỉ cập nhật nếu có sự thay đổi thực sự
                const isSqlChanged = existingProc.sqlDefinition !== procData.sql;
                const isDescriptionChanged = existingProc.description !== procData.description;

                if (isSqlChanged || isDescriptionChanged) {
                    proc = await procedureManager.updateProcedure(existingProc.id, procData.sql, {
                        name: procData.name,
                        description: procData.description,
                    }, userId);
                    reportLogger.info(`Updated existing procedure: ${procData.name} (Version increased)`);
                } else {
                    proc = existingProc;
                    reportLogger.info(`Procedure ${procData.name} has no changes, skip update.`);
                }
            } else {
                // Nếu chưa có, tạo mới
                proc = await procedureManager.createProcedure(procData.sql, {
                    name: procData.name,
                    description: procData.description,
                }, userId);
                reportLogger.info(`Created new procedure: ${procData.name}`);
            }

            // Tạo hoặc cập nhật template HTML tương ứng
            await createInitialHtmlTemplate(proc.id, procData.name, userId);
        } catch (error) {
            reportLogger.warn(`Failed to seed procedure ${procData.name}: ${error.message}`);
        }
    }

    reportLogger.info('Report seeding completed.');
}

import prisma from '@/lib/prisma';

/**
 * Tạo nội dung HTML template mẫu hỗ trợ Handlebars - Phiên bản Monochrome
 */
async function createInitialHtmlTemplate(procedureId, procName, userId) {
    let htmlContent = '';
    let cssContent = '';

    if (procName === 'report_revenue_summary') {
        cssContent = `
body { 
  font-family: 'Times New Roman', Times, serif; 
  padding: 40px; 
  color: #000; 
  background: #fff; 
  line-height: 1.5; 
}
.header { 
  text-align: center; 
  margin-bottom: 30px; 
  border-bottom: 2px solid #000; 
  padding-bottom: 15px; 
}
.title { 
  color: #000; 
  font-size: 26px; 
  font-weight: bold; 
  text-transform: uppercase; 
}
table { 
  width: 100%; 
  border-collapse: collapse; 
  margin-top: 20px; 
}
th { 
  background-color: #fff; 
  color: #000; 
  border: 1px solid #000; 
  padding: 12px; 
  text-align: left; 
  font-weight: bold; 
}
td { 
  border: 1px solid #000; 
  padding: 10px; 
}
.footer { 
  margin-top: 50px; 
  text-align: right; 
  font-weight: bold; 
}
        `.trim();
        htmlContent = `
<div class="header">
    <div class="title">Báo cáo Tổng hợp Doanh thu</div>
    <div style="margin-top: 5px;">Ngày in: {{metadata.generatedAt}}</div>
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

<div class="footer">Người lập biểu: {{metadata.userName}}</div>
`;
    } else {
        cssContent = `
body { 
  font-family: 'Times New Roman', Times, serif; 
  padding: 40px; 
  color: #000; 
  background: #fff; 
}
.header { 
  text-align: center; 
  margin-bottom: 30px; 
  border-bottom: 2px solid #000; 
  padding-bottom: 10px; 
}
.title { 
  color: #000; 
  font-size: 24px; 
  font-weight: bold; 
  text-transform: uppercase; 
}
.room-card { 
  margin-bottom: 15px; 
  padding: 15px; 
  border: 1px solid #000; 
}
.room-title { 
  font-weight: bold; 
  border-bottom: 1px solid #eee; 
  padding-bottom: 5px; 
  margin-bottom: 5px; 
}
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
    }

    const templateName = `Mẫu ${procName} (Mặc định)`;

    // Kiểm tra xem template đã tồn tại chưa
    const existingTemplate = await prisma.reportTemplate.findFirst({
        where: { name: templateName, procedureId: procedureId }
    });

    const templateData = {
        name: templateName,
        description: `Template mặc định cho ${procName}`,
        procedureId: procedureId,
        category: 'Hệ thống',
        designerState: [],
        content: htmlContent.trim(),
        css: cssContent.trim(),
        js: '',
        isActive: true,
        createdBy: userId
    };

    if (existingTemplate) {
        await prisma.reportTemplate.update({
            where: { id: existingTemplate.id },
            data: templateData
        });
        reportLogger.info(`Updated existing template: ${templateName}`);
    } else {
        await prisma.reportTemplate.create({
            data: templateData
        });
        reportLogger.info(`Created new template: ${templateName}`);
    }
}
