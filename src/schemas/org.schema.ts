import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  })
});

export const createDesignationSchema = z.object({
  body: z.object({
    name: z.string().min(1),
  })
});
