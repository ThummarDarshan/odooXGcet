const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const details = {};
            error.details.forEach((detail) => {
                details[detail.path[0]] = detail.message;
            });

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details,
            });
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

module.exports = validate;
