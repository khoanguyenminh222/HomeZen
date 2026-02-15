import prisma from '@/lib/prisma';
import { ReportError, ReportErrorCode, ReportErrorCategory } from '@/lib/utils/report-errors';
import { reportLogger } from '@/lib/utils/report-logger';

/**
 * Data Connector Service
 * Chịu trách nhiệm thực thi các Stored Procedure và xử lý dữ liệu thô từ Database
 * Requirements: 4.1, 4.2, 4.3, 4.5
 */
export class DataConnectorService {
    /**
     * Thực thi procedure với tham số động và xử lý lỗi tập trung
     */
    async executeProcedure(procedureName, parameters, schemaParams = [], limit = null) {
        try {
            // 0. Lấy thông tin Procedure từ DB để biết loai_tra_ve (table/procedure/void)
            const procedure = await prisma.rPT_THU_TUC.findUnique({
                where: { ten: procedureName },
                select: { kieu_tra_ve: true }
            });

            // 1. Chuẩn bị giá trị tham số
            const values = schemaParams.map((p) => {
                const val = parameters[p.name];
                if (p.type.toLowerCase().includes('int')) return parseInt(val || 0);
                if (p.type.toLowerCase().includes('decimal')) return parseFloat(val || 0);
                if (p.type.toLowerCase().includes('bool')) return val === 'true' || val === true;
                return val;
            });

            // 2. Tạo câu lệnh SQL động
            const paramPlaceholders = values.map((_, i) => `$${i + 1}`).join(', ');

            let sql = '';
            const isProcedure = procedure?.kieu_tra_ve === 'procedure';

            if (isProcedure) {
                // PROCEDURE dùng CALL
                sql = `CALL ${procedureName}(${paramPlaceholders})`;
            } else {
                // FUNCTION dùng SELECT
                sql = `SELECT * FROM ${procedureName}(${paramPlaceholders})`;
                if (limit) {
                    sql += ` LIMIT ${limit}`;
                }
            }

            // 3. Thực thi truy vấn
            // queryRawUnsafe cho SELECT, executeRawUnsafe cho CALL
            let results = [];
            if (isProcedure) {
                await prisma.$executeRawUnsafe(sql, ...values);
                results = [{ status: 'success', message: `Procedure ${procedureName} executed` }];
            } else {
                results = await prisma.$queryRawUnsafe(sql, ...values);
            }

            reportLogger.info(`Executed procedure ${procedureName} successfully`, { rowCount: results.length });
            return results;
        } catch (error) {
            reportLogger.error(`Database Error in executeProcedure "${procedureName}"`, error);

            // Xử lý các mã lỗi cụ thể từ Database nếu cần
            throw new ReportError(
                `Procedure Execution Failed: ${error.message}`,
                ReportErrorCode.LOI_THUC_THI_THU_TUC,
                ReportErrorCategory.THU_TUC,
                { originalError: error.message, sqlState: error.code }
            );
        }
    }

    /**
     * Lấy dữ liệu mẫu (1 dòng) từ procedure (Task 10.3)
     */
    async getSampleData(procedureName, schemaParams = []) {
        // Sử dụng các tham số mặc định (rỗng/0) để lấy dữ liệu mẫu
        const results = await this.executeProcedure(procedureName, {}, schemaParams, 1);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Map các mã lỗi database sang thông điệp thân thiện (Task 6.3)
     */
    mapDatabaseError(error) {
        if (error.code === 'P2010') return 'Lỗi cú pháp trong câu lệnh raw query.';
        if (error.code === 'P2021') return 'Bảng hoặc Procedure không tồn tại trong database.';
        if (error.code === '42883') return 'Procedure không tìm thấy hoặc số lượng tham số không khớp.';
        return error.message;
    }
}

// Singleton instance
let dataConnectorInstance = null;

export function getDataConnectorService() {
    if (!dataConnectorInstance) {
        dataConnectorInstance = new DataConnectorService();
    }
    return dataConnectorInstance;
}
