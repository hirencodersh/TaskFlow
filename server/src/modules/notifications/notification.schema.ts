import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type ListNotificationsQuery = z.infer<
  typeof listNotificationsQuerySchema
>;
