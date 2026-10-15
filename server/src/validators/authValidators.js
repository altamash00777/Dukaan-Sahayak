const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'User name is required' })
    .min(2, 'Name must be at least 2 characters long')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  phone: z
    .string()
    .optional()
    .default(''),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  shopName: z
    .string({ required_error: 'Shop name is required' })
    .min(2, 'Shop name must be at least 2 characters long')
    .trim(),
  address: z.string().optional().default(''),
  gstin: z.string().optional().default(''),
  language: z.enum(['hinglish', 'hindi', 'english']).optional().default('hinglish'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
