const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        user: req.user?.id,
    });

    // Prisma errors
    if (err.code === 'P2002') {
        // Unique constraint violation
        return res.status(409).json({
            success: false,
            error: 'Duplicate entry',
            field: err.meta?.target,
        });
    }

    if (err.code === 'P2025') {
        // Record not found
        return res.status(404).json({
            success: false,
            error: 'Record not found',
        });
    }

    if (err.code === 'P2003') {
        // Foreign key constraint violation
        return res.status(400).json({
            success: false,
            error: 'Invalid reference: The referenced record (e.g., customer, product) does not exist.',
            details: err.meta,
        });
    }

    // Validation errors (Joi)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: err.details,
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    // For debugging, reveal the message even for 500 during development
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        details: err.meta // helpful for Prisma errors that aren't caught above
    });
};

module.exports = errorHandler;
