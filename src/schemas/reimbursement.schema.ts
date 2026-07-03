import { z } from 'zod';

export const createReimbursementSchema = z.object({
  body: z.object({
    type: z.enum(['TRAVEL', 'FOOD', 'MEDICAL', 'INTERNET', 'OTHER']),
    amount: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]),
    description: z.string().optional(),
  })
});

export const updateReimbursementStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PROCESSED']),
    remarks: z.string().optional(),
  })
});
