import { z } from 'zod';

export const createHolidaySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    date: z.string().min(1),
    type: z.enum(['PUBLIC_HOLIDAY', 'OPTIONAL_HOLIDAY']),
  })
});

export const seedHolidaysSchema = z.object({
  body: z.object({
    year: z.number().int().min(2020).max(2100).optional(),
  })
});
