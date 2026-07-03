import { z } from 'zod';

export const salaryStructureComponentSchema = z.object({
  salary_component_id: z.string().uuid("Invalid component ID"),
  calculation_type: z.enum(['FLAT_AMOUNT', 'PERCENTAGE_OF_CTC', 'PERCENTAGE_OF_BASIC', 'REMAINDER_OF_CTC']),
  value: z.number().min(0, "Value cannot be negative"),
  max_limit: z.number().nullable().optional(),
  sequence: z.number().int().positive("Display order must be a positive integer"),
  type: z.enum(['EARNING', 'DEDUCTION', 'REIMBURSEMENT', 'EMPLOYER_CONTRIBUTION']).optional(), // Usually fetched from DB, but passing here helps validation
});

export const upsertSalaryStructureSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    components: z.array(salaryStructureComponentSchema).min(1, "At least one component is required")
  }).superRefine((data, ctx) => {
    let totalPercentage = 0;
    let remainderCount = 0;
    const componentIds = new Set();
    const sequences = new Set();

    for (let i = 0; i < data.components.length; i++) {
      const comp = data.components[i];

      // Check max_limit
      if (comp.max_limit !== null && comp.max_limit !== undefined && comp.max_limit < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "max_limit cannot be negative",
          path: ['components', i, 'max_limit']
        });
      }

      // Check percentage range
      if (comp.calculation_type.startsWith('PERCENTAGE_')) {
        if (comp.value < 0 || comp.value > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Component percentages must be between 0 and 100",
            path: ['components', i, 'value']
          });
        }
      }

      // Tally Remainder
      if (comp.calculation_type === 'REMAINDER_OF_CTC') {
        remainderCount++;
      }

      // Tally CTC percentage for Earnings
      // Rule: PERCENTAGE_OF_BASIC and EMPLOYER_CONTRIBUTION must NOT count toward 100% CTC
      if (
        comp.calculation_type === 'PERCENTAGE_OF_CTC' &&
        comp.type === 'EARNING' &&
        true
      ) {
        totalPercentage += comp.value;
      }

      // Unique component ID
      if (componentIds.has(comp.salary_component_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Component names must be unique within a structure",
          path: ['components', i, 'salary_component_id']
        });
      }
      componentIds.add(comp.salary_component_id);

      // Unique sequence
      if (sequences.has(comp.sequence)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "display_order must be unique",
          path: ['components', i, 'sequence']
        });
      }
      sequences.add(comp.sequence);
    }

    if (remainderCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one remainder component is allowed.",
        path: ['components']
      });
    }

    if (totalPercentage > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total configured earnings exceed 100% of CTC.",
        path: ['components']
      });
    }
  })
});
