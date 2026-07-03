import { z } from 'zod';

const reviewBaseSchema = {
  cycle_name: z.string().min(1),
  review_period: z.string().min(1),
  goals_rating: z.number().min(1).max(5),
  skills_rating: z.number().min(1).max(5),
  attitude_rating: z.number().min(1).max(5),
  leadership_rating: z.number().min(1).max(5),
  remarks: z.string().optional(),
};

export const createPerformanceReviewSchema = z.object({
  body: z.object({
    employee_id: z.string().uuid(),
    ...reviewBaseSchema,
  })
});

export const updatePerformanceReviewSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object(reviewBaseSchema).partial()
});
