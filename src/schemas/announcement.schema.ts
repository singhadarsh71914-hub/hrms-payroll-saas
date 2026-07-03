import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  })
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional(),
  })
});
