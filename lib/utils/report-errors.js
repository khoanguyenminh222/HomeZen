/**
 * Report Error Categories
 */
export const ReportErrorCategory = {
    PROCEDURE: 'PROCEDURE',
    TEMPLATE: 'TEMPLATE',
    GENERATION: 'GENERATION',
    SYSTEM: 'SYSTEM',
};

/**
 * Report Error Codes
 */
export const ReportErrorCode = {
    // Procedure Errors
    PROCEDURE_NOT_FOUND: 'PROC_001',
    PROCEDURE_SYNTAX_ERROR: 'PROC_002',
    PROCEDURE_EXECUTION_ERROR: 'PROC_003',
    PROCEDURE_VALIDATION_FAILED: 'PROC_004',

    // Template Errors
    TEMPLATE_NOT_FOUND: 'TEMP_001',
    TEMPLATE_INVALID_FORMAT: 'TEMP_002',
    TEMPLATE_MISSING_PLACEHOLDERS: 'TEMP_003',
    TEMPLATE_SAVE_FAILED: 'TEMP_004',

    // Generation Errors
    GENERATION_MAPPING_FAILED: 'GEN_001',
    GENERATION_FILE_SYSTEM_ERROR: 'GEN_002',
    GENERATION_DATABASE_ERROR: 'GEN_003',

    // System Errors
    INTERNAL_SERVER_ERROR: 'SYS_001',
    UNAUTHORIZED_ACCESS: 'SYS_002',
};

/**
 * Custom Error class for the Advanced Reporting System
 */
export class ReportError extends Error {
    constructor(message, code, category, details = null) {
        super(message);
        this.name = 'ReportError';
        this.code = code || ReportErrorCode.INTERNAL_SERVER_ERROR;
        this.category = category || ReportErrorCategory.SYSTEM;
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
            [ReportErrorCode.PROCEDURE_NOT_FOUND]: 404,
            [ReportErrorCode.TEMPLATE_NOT_FOUND]: 404,
            [ReportErrorCode.UNAUTHORIZED_ACCESS]: 403,
            [ReportErrorCode.PROCEDURE_SYNTAX_ERROR]: 400,
            [ReportErrorCode.TEMPLATE_INVALID_FORMAT]: 400,
            [ReportErrorCode.PROCEDURE_EXECUTION_ERROR]: 400,
            [ReportErrorCode.TEMPLATE_SAVE_FAILED]: 400,
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
