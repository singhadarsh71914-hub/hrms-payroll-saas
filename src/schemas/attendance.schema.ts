import { z } from 'zod';

export const markAttendanceSchema = z.object({
  body: z.object({
    employeeId: z.string().uuid(),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND']),
    date: z.string().min(1),
  })
});
