// lib/services/procedure-manager.service.js
import prisma from '@/lib/prisma';
import { ReportError, ReportErrorCode, ReportErrorCategory } from '@/lib/utils/report-errors';
import { reportLogger } from '@/lib/utils/report-logger';

/**
 * Procedure Manager
 * Quản lý stored procedures cho hệ thống báo cáo
 * Requirements: 1.1, 1.3, 1.4, 1.5, 3.2
 */
export class ProcedureManagerService {
  /**
   * Tạo stored procedure mới
   * - Lưu định nghĩa vào bảng report_procedures
   * - Thực thi SQL để tạo function trong DB
   */
  async createProcedure(sql, metadata, createdBy) {
    try {
      const validation = await this.validateSQL(sql);
      if (!validation.isValid) {
        throw new ReportError(
          'SQL syntax is invalid',
          ReportErrorCode.PROCEDURE_SYNTAX_ERROR,
          ReportErrorCategory.PROCEDURE,
          validation.errors
        );
      }

      const { name, description } = metadata || {};

      // 1. Thực thi SQL trong database để tạo actual function
      try {
        await prisma.$executeRawUnsafe(sql);
        reportLogger.info(`Function "${name}" created/replaced in database`);
      } catch (dbError) {
        // Cụ thể: Lỗi 42P13 - "cannot change return type of existing function"
        // PostgreSQL không cho phép CREATE OR REPLACE thay đổi RETURNS TABLE của function đã có.
        if (dbError.code === 'P2010' && dbError.message.includes('42P13')) {
          reportLogger.warn(`Detecting 42P13 (return type change) for "${name}". Attempting DROP and re-CREATE...`);
          const dropSql = this.generateDropSql(sql);
          if (dropSql) {
            await prisma.$executeRawUnsafe(dropSql);
            await prisma.$executeRawUnsafe(sql);
            reportLogger.info(`Function "${name}" re-created successfully after DROP.`);
          } else {
            throw dbError; // Không thể parse được tên hàm để drop
          }
        } else {
          throw new ReportError(
            `Database error while creating function: ${dbError.message}`,
            ReportErrorCode.PROCEDURE_EXECUTION_ERROR,
            ReportErrorCategory.PROCEDURE
          );
        }
      }

      // 2. Lưu metadata vào DB
      const detectedParameters = this.detectParameters(sql);
      const returnColumns = this.detectReturnColumns(sql);

      const procedure = await prisma.reportProcedure.create({
        data: {
          name,
          description,
          sqlDefinition: sql,
          parameters: detectedParameters,
          returnType: validation.type === 'procedure' ? 'procedure' : 'table',
          isActive: true,
          createdBy,
          version: 1,
        },
      });

      // 3. Ghi lại lịch sử (Lần đầu tiên)
      await prisma.reportProcedureHistory.create({
        data: {
          procedureId: procedure.id,
          sqlDefinition: sql,
          version: 1,
          metaData: { name, description },
          changedBy: createdBy
        }
      });

      return {
        ...procedure,
        parameters: detectedParameters,
        returnColumns,
      };
    } catch (error) {
      if (!(error instanceof ReportError)) {
        await reportLogger.error('Unexpected error in createProcedure', error);
      }
      throw error;
    }
  }

  /**
   * Cập nhật stored procedure
   * - Tăng version
   * - Thực thi lại SQL
   */
  async updateProcedure(id, sql, metadata, updatedBy) {
    try {
      const existing = await prisma.reportProcedure.findUnique({ where: { id } });
      if (!existing) {
        throw new ReportError('Procedure not found', ReportErrorCode.PROCEDURE_NOT_FOUND, ReportErrorCategory.PROCEDURE);
      }

      const validation = await this.validateSQL(sql);
      if (!validation.isValid) {
        throw new ReportError(
          'SQL syntax is invalid',
          ReportErrorCode.PROCEDURE_SYNTAX_ERROR,
          ReportErrorCategory.PROCEDURE,
          validation.errors
        );
      }

      // 1. Thực thi lại SQL trong database
      const { name } = metadata || {};
      const funcName = name || existing.name;
      try {
        await prisma.$executeRawUnsafe(sql);
        reportLogger.info(`Function "${funcName}" updated in database`);
      } catch (dbError) {
        // Cụ thể: Lỗi 42P13 - "cannot change return type of existing function"
        if (dbError.code === 'P2010' && dbError.message.includes('42P13')) {
          reportLogger.warn(`Detecting 42P13 (return type change) for "${funcName}". Attempting DROP and re-CREATE...`);
          const dropSql = this.generateDropSql(sql);
          if (dropSql) {
            await prisma.$executeRawUnsafe(dropSql);
            await prisma.$executeRawUnsafe(sql);
            reportLogger.info(`Function "${funcName}" re-created successfully after DROP.`);
          } else {
            throw dbError;
          }
        } else {
          throw new ReportError(
            `Database error while updating function: ${dbError.message}`,
            ReportErrorCode.PROCEDURE_EXECUTION_ERROR,
            ReportErrorCategory.PROCEDURE
          );
        }
      }

      const detectedParameters = this.detectParameters(sql);
      const returnColumns = this.detectReturnColumns(sql);
      const { description } = metadata || {};

      const updated = await prisma.reportProcedure.update({
        where: { id },
        data: {
          name: funcName,
          description: description ?? existing.description,
          sqlDefinition: sql,
          parameters: detectedParameters,
          returnType: validation.type === 'procedure' ? 'procedure' : 'table',
          version: existing.version + 1,
          updatedAt: new Date(),
        },
      });

      // 2. Ghi lại lịch sử thay đổi
      await prisma.reportProcedureHistory.create({
        data: {
          procedureId: updated.id,
          sqlDefinition: sql,
          version: updated.version,
          metaData: {
            name: funcName,
            description: description ?? existing.description,
          },
          changedBy: updatedBy
        }
      });

      return {
        ...updated,
        parameters: detectedParameters,
        returnColumns,
      };
    } catch (error) {
      if (!(error instanceof ReportError)) {
        await reportLogger.error('Unexpected error in updateProcedure', error);
      }
      throw error;
    }
  }

  /**
   * Xóa stored procedure
   * (MVP: soft delete bằng isActive = false để giữ lịch sử)
   */
  async deleteProcedure(id) {
    try {
      const existing = await prisma.reportProcedure.findUnique({ where: { id } });
      if (!existing) {
        throw new ReportError('Procedure not found', ReportErrorCode.PROCEDURE_NOT_FOUND, ReportErrorCategory.PROCEDURE);
      }

      await prisma.reportProcedure.update({
        where: { id },
        data: { isActive: false },
      });
    } catch (error) {
      if (!(error instanceof ReportError)) {
        await reportLogger.error('Unexpected error in deleteProcedure', error);
      }
      throw error;
    }
  }

  /**
   * Validate cú pháp SQL bằng PostgreSQL
   */
  async validateSQL(sql) {
    if (!sql || typeof sql !== 'string') {
      return {
        isValid: false,
        errors: [{ message: 'SQL must be a non-empty string' }],
        warnings: [],
        detectedParameters: [],
        returnColumns: [],
      };
    }

    // Kiểm tra bắt buộc: phải chứa "CREATE OR REPLACE FUNCTION" hoặc "CREATE OR REPLACE PROCEDURE"
    const normalized = sql.toUpperCase();
    const hasCreateOrReplace = normalized.includes('CREATE OR REPLACE FUNCTION') || normalized.includes('CREATE OR REPLACE PROCEDURE');

    if (!hasCreateOrReplace) {
      return {
        isValid: false,
        errors: [
          {
            message: 'SQL must strictly use "CREATE OR REPLACE" syntax (FUNCTION or PROCEDURE).',
          },
        ],
        warnings: [],
        detectedParameters: this.detectParameters(sql),
        returnColumns: this.detectReturnColumns(sql),
      };
    }

    // Kiểm tra bắt buộc: Phải có tham số p_uid (để phân quyền dữ liệu)
    const detectedParams = this.detectParameters(sql);
    const hasPUidParam = detectedParams.some(p => p.name.toLowerCase() === 'p_uid');

    if (!hasPUidParam) {
      return {
        isValid: false,
        errors: [
          {
            message: 'Tham số "p_uid" là bắt buộc và duy nhất được chấp nhận để phân quyền (không dùng tên khác).',
          },
        ],
        warnings: [],
        detectedParameters: detectedParams,
        returnColumns: this.detectReturnColumns(sql),
      };
    }

    // (Optionally) Run EXPLAIN or local parsing if needed.
    // For now, assume validity if structural check passes.
    return {
      isValid: true,
      errors: [],
      warnings: [],
      detectedParameters: this.detectParameters(sql),
      returnColumns: this.detectReturnColumns(sql),
      type: isProcedure ? 'procedure' : 'function',
    };
  }

  /**
   * Liệt kê procedures
   */
  async listProcedures() {
    return prisma.reportProcedure.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lấy chi tiết 1 procedure
   */
  async getProcedure(id) {
    const procedure = await prisma.reportProcedure.findUnique({ where: { id } });
    if (!procedure) {
      throw new ReportError('Procedure not found', ReportErrorCode.PROCEDURE_NOT_FOUND, ReportErrorCategory.PROCEDURE);
    }
    return procedure;
  }

  /**
   * Lấy lịch sử thay đổi của 1 procedure
   */
  async getProcedureHistory(id) {
    return prisma.reportProcedureHistory.findMany({
      where: { procedureId: id },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Detect tham số trong định nghĩa function
   */
  detectParameters(sql) {
    try {
      const match = sql.match(/\(([^)]*)\)/);
      if (!match) return [];
      const inside = match[1].trim();
      if (!inside) return [];

      return inside
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => {
          const [name, type] = p.split(/\s+/);
          return {
            name,
            type: type || 'text',
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Detect cột trả về từ RETURNS TABLE
   */
  detectReturnColumns(sql) {
    try {
      const returnsMatch = sql.match(/RETURNS\s+TABLE\s*\(([^)]*)\)/i);
      if (!returnsMatch) return [];

      const inside = returnsMatch[1].trim();
      if (!inside) return [];

      return inside
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
          const [name, type] = c.split(/\s+/);
          return {
            name,
            type: type || 'text',
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Tạo lệnh DROP FUNCTION/PROCEDURE IF EXISTS dựa trên SQL định nghĩa
   * Cần tên hàm và danh sách kiểu dữ liệu tham số đầu vào
   */
  generateDropSql(sql) {
    try {
      const normalized = sql.toUpperCase();
      const isProcedure = normalized.includes('PROCEDURE');
      const keyword = isProcedure ? 'PROCEDURE' : 'FUNCTION';

      // 1. Tìm tên (chấp nhận cả FUNCTION và PROCEDURE)
      const nameRegex = new RegExp(`CREATE\\s+(?:OR\\s+REPLACE\\s+)?${keyword}\\s+([a-zA-Z0-9_.]+)`, 'i');
      const nameMatch = sql.match(nameRegex);
      if (!nameMatch) return null;
      const funcName = nameMatch[1];

      // 2. Tìm tham số
      const firstParenIndex = sql.indexOf('(', nameMatch.index + nameMatch[0].length - 10);
      if (firstParenIndex === -1) return `DROP ${keyword} IF EXISTS ${funcName}()`;

      let parenBalance = 1;
      let i = firstParenIndex + 1;
      let paramsStr = '';
      while (i < sql.length && parenBalance > 0) {
        if (sql[i] === '(') parenBalance++;
        else if (sql[i] === ')') parenBalance--;

        if (parenBalance > 0) paramsStr += sql[i];
        i++;
      }

      // 3. Parse kiểu dữ liệu tham số
      const paramTypes = paramsStr.split(',')
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          const parts = p.split(/\s+/).filter(Boolean);
          // Ưu tiên lấy kiểu dữ liệu (thường ở cuối, bỏ qua IN/OUT/DEFAULT)
          const cleanParts = parts.filter(pt => !['IN', 'OUT', 'INOUT', 'VARIADIC'].includes(pt.toUpperCase()));
          return cleanParts.length > 1 ? cleanParts[cleanParts.length - 1] : cleanParts[0];
        })
        .join(', ');

      return `DROP ${keyword} IF EXISTS ${funcName}(${paramTypes})`;
    } catch (e) {
      reportLogger.error('Error generating drop SQL', e);
      return null;
    }
  }
}

// Singleton helper
let procedureManagerInstance = null;

export function getProcedureManagerService() {
  if (!procedureManagerInstance) {
    procedureManagerInstance = new ProcedureManagerService();
  }
  return procedureManagerInstance;
}
