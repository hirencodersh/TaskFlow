import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().optional(),

  role: z
    .enum([
      'ADMIN',
      'PROJECT_MANAGER',
      'DEVELOPER',
    ])
    .optional(),

  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),

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

export type ListUsersQuery = z.infer<
  typeof listUsersQuerySchema
>;

export const updateUserRoleSchema = z.object({
  role: z.enum([
    'ADMIN',
    'PROJECT_MANAGER',
    'DEVELOPER',
  ]),
});

export type UpdateUserRoleInput = z.infer<
  typeof updateUserRoleSchema
>;

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type UpdateUserStatusInput = z.infer<
  typeof updateUserStatusSchema
>;