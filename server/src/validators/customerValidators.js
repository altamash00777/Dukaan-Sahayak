const { z } = require('zod');

const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'Customer name is required' })
    .min(1, 'Customer name cannot be empty')
    .trim(),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .trim(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).default(''),
  address: z.string().trim().optional().default(''),
  whatsappOptIn: z.boolean().optional().default(true),
  outstandingBalance: z.number().optional().default(0),
});

const updateCustomerSchema = createCustomerSchema.partial();

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
};
