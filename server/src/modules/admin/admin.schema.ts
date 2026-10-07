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

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['PROJECT_MANAGER', 'DEVELOPER']),
});

export type CreateUserInput = z.infer<
  typeof createUserSchema
>;