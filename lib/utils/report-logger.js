import prisma from '@/lib/prisma';

/**
 * Simple Logger for the Reporting System
 * (MVP: Logs to console and eventually to database SecurityLog or a custom table)
 */
export const reportLogger = {
    info: (message, metadata = {}) => {
        console.log(`[REPORT INFO] ${message}`, metadata);
    },

    error: async (message, error, metadata = {}) => {
        console.error(`[REPORT ERROR] ${message}`, {
            errorMessage: error.message,
            code: error.code,
            stack: error.stack,
            ...metadata,
        });

        // Option: Log highly critical errors to SecurityLog if necessary
        try {
            if (error.category === 'SYSTEM' || error.category === 'PROCEDURE') {
                // await prisma.securityLog.create(...) 
            }
        } catch (e) {
            console.error('Failed to log error to database', e);
        }
    },

    warn: (message, metadata = {}) => {
        console.warn(`[REPORT WARN] ${message}`, metadata);
    },

    debug: (message, metadata = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(`[REPORT DEBUG] ${message}`, metadata);
        }
    }
};
