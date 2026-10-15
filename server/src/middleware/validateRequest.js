const { ZodError } = require('zod');

/**
 * Higher-order middleware function to validate incoming request body against a Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body);
      req.body = parsed; // Use validated & coerced data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

module.exports = validateRequest;
