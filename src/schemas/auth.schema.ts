import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']).optional(),
    company_name: z.string().min(1),
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  })
});

export const setPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(6),
  })
});
