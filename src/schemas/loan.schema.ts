import { z } from 'zod';

export const applyLoanSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid().optional(),
    loanType: z.enum(['PERSONAL', 'MEDICAL', 'EMERGENCY', 'EDUCATION', 'HOME']),
    principalAmount: z.number().positive(),
    interestRate: z.number().min(0),
    tenureMonths: z.number().int().positive(),
    startDate: z.string().min(1),
  })
});

export const updateLoanStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    remarks: z.string().optional(),
  }).optional()
});
