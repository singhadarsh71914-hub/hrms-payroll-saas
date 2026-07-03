import { z } from 'zod';

export const reviseSalarySchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    ctcAnnual: z.number().positive(),
    hra: z.number().min(0).optional(),
    conveyance: z.number().min(0).optional(),
    medical: z.number().min(0).optional(),
    specialAllowance: z.number().min(0).optional(),
    pfDeduction: z.number().min(0).optional(),
    ptDeduction: z.number().min(0).optional(),
    tdsDeduction: z.number().min(0).optional(),
    effectiveFrom: z.string().min(1),
    reason: z.string().optional(),
  })
});
