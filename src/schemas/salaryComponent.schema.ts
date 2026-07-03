import { z } from 'zod';

export const createSalaryComponentSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    code: z.string().min(1, "Code is required").toUpperCase(),
    description: z.string().optional().nullable(),
    type: z.enum(['EARNING', 'DEDUCTION', 'REIMBURSEMENT', 'EMPLOYER_CONTRIBUTION']),
    category: z.enum(['FIXED', 'VARIABLE', 'STATUTORY']),
    is_taxable: z.boolean().default(true),
    is_statutory: z.boolean().default(false),
    pf_applicable: z.boolean().default(false),
    esi_applicable: z.boolean().default(false),
    is_active: z.boolean().default(true),
    calculation_type: z.enum(['PERCENTAGE_OF_CTC', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_GROSS', 'FLAT_AMOUNT', 'REMAINDER_OF_CTC', 'FORMULA']).optional().nullable(),
    formula: z.string().optional().nullable(),
    value: z.number().min(0, "Value cannot be negative").optional().nullable(),
    max_limit: z.number().min(0, "Max limit must be non-negative").optional().nullable(),
    display_order: z.number().int().optional().nullable(),
    system_role: z.enum(['BASIC', 'HRA', 'SPECIAL_ALLOWANCE', 'PF_EMPLOYEE', 'PF_EMPLOYER', 'PT', 'TDS', 'ESI_EMPLOYEE', 'ESI_EMPLOYER']).optional().nullable(),
  })
}).superRefine((data, ctx) => {
  if (data.body.calculation_type?.startsWith('PERCENTAGE_')) {
    if (data.body.value !== undefined && data.body.value !== null && (data.body.value < 0 || data.body.value > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "value between 0–100 for percentages",
        path: ['body', 'value']
      });
    }
  }
});

export const updateSalaryComponentSchema = createSalaryComponentSchema;
