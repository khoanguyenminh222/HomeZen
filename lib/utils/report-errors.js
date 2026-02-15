/**
 * Report Error Categories
 */
export const ReportErrorCategory = {
    THU_TUC: 'THU_TUC',
    MAU_BAO_CAO: 'MAU_BAO_CAO',
    XUAT_BAO_CAO: 'XUAT_BAO_CAO',
    HE_THONG: 'HE_THONG',
};

/**
 * Report Error Codes
 */
export const ReportErrorCode = {
    // Procedure Errors
    THU_TUC_KHONG_TON_TAI: 'PROC_001',
    LOI_CU_PHAP_THU_TUC: 'PROC_002',
    LOI_THUC_THI_THU_TUC: 'PROC_003',
    XAC_THUC_THU_TUC_THAT_BAI: 'PROC_004',

    // Template Errors
    MAU_BAO_CAO_KHONG_TON_TAI: 'TEMP_001',
    DINH_DANG_MAU_KHONG_HOP_LE: 'TEMP_002',
    THIEU_PLACEHOLDER_TRONG_MAU: 'TEMP_003',
    LUU_MAU_BAO_CAO_THAT_BAI: 'TEMP_004',

    // Generation Errors
    MAPPING_DU_LIEU_THAT_BAI: 'GEN_001',
    LOI_HE_THONG_TAP_TIN: 'GEN_002',
    LOI_CO_SO_DU_LIEU: 'GEN_003',

    // System Errors
    LOI_HE_THONG_NOI_BO: 'SYS_001',
    TRUY_CAP_TRAI_PHEP: 'SYS_002',
};

/**
 * Custom Error class for the Advanced Reporting System
 */
export class ReportError extends Error {
    constructor(message, code, category, details = null) {
        super(message);
        this.name = 'ReportError';
        this.code = code || ReportErrorCode.LOI_HE_THONG_NOI_BO;
        this.category = category || ReportErrorCategory.HE_THONG;
        this.details = details;
    }

    toJSON() {
        return {
            success: false,
            error: {
                name: this.name,
                message: this.message,
                code: this.code,
                category: this.category,
                details: this.details,
            },
        };
    }
}

/**
 * Helper to handle errors in API routes
 */
export function handleErrorResponse(error, customMessage) {
    if (error instanceof ReportError) {
        const statusMap = {
            [ReportErrorCode.THU_TUC_KHONG_TON_TAI]: 404,
            [ReportErrorCode.MAU_BAO_CAO_KHONG_TON_TAI]: 404,
            [ReportErrorCode.TRUY_CAP_TRAI_PHEP]: 403,
            [ReportErrorCode.LOI_CU_PHAP_THU_TUC]: 400,
            [ReportErrorCode.DINH_DANG_MAU_KHONG_HOP_LE]: 400,
            [ReportErrorCode.LOI_THUC_THI_THU_TUC]: 400,
            [ReportErrorCode.LUU_MAU_BAO_CAO_THAT_BAI]: 400,
        };

        const status = statusMap[error.code] || 500;
        return Response.json(error.toJSON(), { status });
    }

    // Generic Error
    console.error(customMessage || 'Unhandled API error', error);

    // Attempt to extract as much info as possible from raw error
    const message = error.message || 'Internal server error';
    const detail = error.stack ? (process.env.NODE_ENV === 'development' ? error.stack : undefined) : undefined;

    return Response.json({
        success: false,
        error: {
            message: customMessage ? `${customMessage}: ${message}` : message,
            code: ReportErrorCode.INTERNAL_SERVER_ERROR,
            category: ReportErrorCategory.SYSTEM,
            details: detail
        }
    }, { status: 500 });
}
