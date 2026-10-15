const { z } = require('zod');

const draftItemSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than zero'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  unit: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

const createDraftSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerSnapshot: z
    .object({
      name: z.string().default('Cash Customer'),
      phone: z.string().default(''),
      address: z.string().default(''),
    })
    .optional(),
  items: z
    .array(draftItemSchema)
    .min(1, 'Invoice must contain at least one item'),
  discountAmount: z.number().min(0, 'Discount cannot be negative').optional().default(0),
  notes: z.string().optional().default(''),
});

const confirmInvoiceSchema = z.object({
  paymentStatus: z
    .enum(['draft', 'pending', 'paid', 'partial'], {
      required_error: 'Payment status is required',
    })
    .default('paid'),
  paymentMethod: z
    .enum(['cash', 'upi', 'credit', 'card', 'split', 'pending'])
    .default('cash'),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative').optional(),
  notes: z.string().optional().default(''),
});

module.exports = {
  createDraftSchema,
  confirmInvoiceSchema,
};
