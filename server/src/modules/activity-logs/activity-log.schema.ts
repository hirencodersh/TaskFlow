import { z } from 'zod';

export const activityLogQuerySchema = z.object({
  projectId: z.string().min(1).optional(),

  taskId: z.string().min(1).optional(),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export type ActivityLogQuery = z.infer<
  typeof activityLogQuerySchema
>;