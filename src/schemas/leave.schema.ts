import { z } from 'zod';

export const createLeaveSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid().optional(),
    leaveType: z.enum(['SICK', 'CASUAL', 'ANNUAL']),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  })
});

export const updateLeaveStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
  })
});
