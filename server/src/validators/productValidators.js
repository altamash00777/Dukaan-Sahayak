const { z } = require('zod');

const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .min(1, 'Product name cannot be empty')
    .trim(),
  aliases: z.array(z.string().trim()).optional().default([]),
  category: z.string().trim().optional().default('General'),
  unit: z.string().trim().optional().default('pcs'),
  sellingPrice: z
    .number({ required_error: 'Selling price is required' })
    .min(0, 'Selling price cannot be negative'),
  purchaseCost: z.number().min(0, 'Purchase cost cannot be negative').optional().default(0),
  currentStock: z.number().optional().default(0),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative').optional().default(5),
  hsnCode: z.string().trim().optional().default(''),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional().default(0),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};
