import { z } from 'zod';

export const uploadDocumentSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    document_type: z.enum(['OFFER_LETTER', 'RELIEVING_LETTER', 'PAYSLIP', 'ID_PROOF', 'ADDRESS_PROOF', 'OTHER']),
  })
});
