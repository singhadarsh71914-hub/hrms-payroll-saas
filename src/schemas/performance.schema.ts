import { z } from 'zod';

export const createGoalSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    start_date: z.string().or(z.date()),
    deadline: z.string().or(z.date()),
  })
});

export const updateGoalSchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED']).optional(),
    progress: z.number().min(0).max(100).optional(),
    start_date: z.string().or(z.date()).optional(),
    deadline: z.string().or(z.date()).optional(),
  })
});

export const createKPISchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    weightage: z.number().min(1).max(100),
    target_value: z.number(),
  })
});

export const updateKPISchema = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    weightage: z.number().min(1).max(100).optional(),
    target_value: z.number().optional(),
    achieved_value: z.number().optional(),
  })
});

export const createReviewSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    cycle_name: z.string().min(1),
    review_period: z.string().min(1),
  })
});

export const submitSelfReviewSchema = z.object({
  body: z.object({
    self_rating: z.number().min(1).max(5),
    self_comments: z.string().min(1),
  })
});

export const submitManagerReviewSchema = z.object({
  body: z.object({
    manager_rating: z.number().min(1).max(5),
    manager_comments: z.string().min(1),
  })
});
